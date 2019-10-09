"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Query_1 = require("../Query/Query");
const QueryXml_1 = require("../Query/QueryXml");
const Dynamics_1 = require("./Dynamics");
const DynamicsRequest_1 = require("./DynamicsRequest");
const httpntlm = require("httpntlm");
const node_fetch_1 = require("node-fetch");
function dynamicsBatch(connectionOptions, headers) {
    return new Batch(connectionOptions, headers);
}
exports.dynamicsBatch = dynamicsBatch;
function dynamicsBatchRequest(connectionOptions, ...url) {
    const batch = new Batch(connectionOptions);
    batch.requestAllUrls(url);
    return batch.execute();
}
exports.dynamicsBatchRequest = dynamicsBatchRequest;
function dynamicsBatchQuery(connectionOptions, ...query) {
    const batch = new Batch(connectionOptions);
    batch.requestAll(query);
    return batch.execute();
}
exports.dynamicsBatchQuery = dynamicsBatchQuery;
class Batch {
    constructor(options, headers) {
        this.options = options;
        this.headers = headers;
        this.ConnectionOptions = options;
        this.Changes = [];
        this.RelatedChanges = [];
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            const results = yield Batch.requestBatch(this.ConnectionOptions, `/api/data/${this.ConnectionOptions.webApiVersion}/$batch`, this.Changes, this.headers);
            if (this.RelatedChanges.length > 0) {
                for (let change of this.RelatedChanges) {
                    if (change !== undefined && change.relatedChange) {
                        let changeIndex = this.Changes.indexOf(change.relatedChange);
                        let relatedId = results !== undefined ? results[changeIndex] : undefined;
                        change.entityData[`${change.relatedPropertyName}@odata.bind`] = `${change.relatedChange.entitySetName}(${Batch.trimId(relatedId)})`;
                    }
                }
                const related = yield Batch.requestBatch(this.ConnectionOptions, `/api/data/${this.ConnectionOptions.webApiVersion}/$batch`, this.RelatedChanges, this.headers);
                return results !== undefined ? results.concat(related) : undefined;
            }
            else {
                return results;
            }
        });
    }
    requestAllUrls(urls) {
        this.Changes.push.apply(this.Changes, urls.map(entitySetQuery => ({ entitySetQuery })));
        return this;
    }
    requestAll(queries) {
        this.Changes.push.apply(queries.map(query => {
            const dataQuery = Query_1.GetRootQuery(query);
            this.request(query);
            return {
                entitySetName: dataQuery.EntityPath,
                entitySetQuery: `fetchXml=${escape(QueryXml_1.default(query))}`
            };
        }));
        return this;
    }
    request(query, maxRowCount = Dynamics_1.DefaultMaxRecords) {
        const dataQuery = Query_1.GetRootQuery(query);
        if (!dataQuery.EntityPath) {
            throw new Error('dynamicsBatch request requires a Query object with an EntityPath');
        }
        this.Changes.push({
            entitySetName: dataQuery.EntityPath,
            entitySetQuery: `fetchXml=${escape(QueryXml_1.default(query, maxRowCount))}`
        });
        return this;
    }
    deleteEntity(entitySetName, id) {
        this.Changes.push({
            entitySetName: entitySetName,
            entityId: id,
            entityData: 'DELETE'
        });
        return this;
    }
    saveEntity(entitySetName, data, id) {
        this.Changes.push({
            entitySetName: entitySetName,
            entityId: id,
            entityData: data
        });
        return this;
    }
    createRelatedEntity(entitySetName, data, navigationPropertyName) {
        let lastChange = this.Changes[this.Changes.length - 1];
        if (!lastChange || lastChange.entityData === 'DELETE') {
            throw new Error('createRelatedEntity relies on the previous change which was not found in the batch.');
        }
        if (lastChange.entityId) {
            data[`${navigationPropertyName}@odata.bind`] = `${lastChange.entitySetName}(${lastChange.entityId})`;
            this.Changes.push({
                entitySetName: entitySetName,
                entityData: data
            });
        }
        else {
            this.RelatedChanges.push({
                entitySetName: entitySetName,
                entityData: data,
                relatedChange: lastChange,
                relatedPropertyName: navigationPropertyName
            });
        }
    }
    static requestBatch(connectionOptions, url, requests, headers) {
        let callUrl = connectionOptions.serverUrl;
        if (callUrl.endsWith("/")) {
            callUrl = callUrl.substr(0, callUrl.length - 1);
        }
        callUrl = `${callUrl}${url}`;
        const batchId = Batch.createId();
        if (connectionOptions.authType === DynamicsRequest_1.AuthenticationType.Windows) {
            return new Promise((resolve, reject) => {
                httpntlm.post({
                    url: callUrl,
                    username: connectionOptions.username,
                    password: connectionOptions.password,
                    workstation: connectionOptions.workstation || '',
                    domain: connectionOptions.domain || '',
                    body: Batch.formatBatchRequest(connectionOptions, batchId, requests),
                    headers: Object.assign(Object.assign({ 'Content-Type': `multipart/mixed;boundary=batch_${batchId}` }, Dynamics_1.DynamicsHeaders), headers)
                }, function (err, res) {
                    if (err) {
                        console.error(err);
                        reject(err);
                    }
                    resolve(Batch.formatBatchResponse(res.responseText));
                });
            });
        }
        else {
            return node_fetch_1.default(callUrl, {
                method: 'POST',
                headers: Object.assign(Object.assign({ 'Content-Type': `multipart/mixed;boundary=batch_${batchId}`, 'Authorization': connectionOptions.accessToken }, Dynamics_1.DynamicsHeaders), headers),
                body: Batch.formatBatchRequest(connectionOptions, batchId, requests)
            })
                .then(response => Batch.formatBatchResponse(response.text()));
        }
    }
    static formatBatchRequest(connectionOptions, batchId, changes) {
        let batchBody = [];
        let requestBody = [];
        let changeNumber = 1;
        let changesetId = Batch.createId();
        batchBody.push(`--batch_${batchId}`);
        batchBody.push(`Content-Type: multipart/mixed;boundary=changeset_${changesetId}`);
        batchBody.push('');
        for (let change of changes) {
            if (change.entitySetQuery) {
                requestBody.push(`--batch_${batchId}`);
                requestBody.push('Content-Type: application/http');
                requestBody.push('Content-Transfer-Encoding:binary');
                requestBody.push('');
                if (change.entitySetName) {
                    requestBody.push(`GET ${encodeURI(`/api/data/${connectionOptions.webApiVersion}/${change.entitySetName}?${change.entitySetQuery}`)} HTTP/1.1`);
                }
                else {
                    requestBody.push(`GET ${encodeURI(change.entitySetQuery)} HTTP/1.1`);
                }
                requestBody.push('Accept: application/json');
                requestBody.push('Prefer: odata.include-annotations="OData.Community.Display.V1.FormattedValue"');
                requestBody.push('');
            }
            else {
                batchBody.push(`--changeset_${changesetId}`);
                batchBody.push('Content-Type: application/http');
                batchBody.push('Content-Transfer-Encoding:binary');
                batchBody.push(`Content-ID: ${changeNumber++}`);
                batchBody.push('');
                batchBody.push(`${change.entityId ? 'PATCH' : 'POST'} ${encodeURI(`/api/data/${connectionOptions.webApiVersion}/${change.entitySetName}(${Batch.trimId(change.entityId)})`)} HTTP/1.1`);
                batchBody.push('Content-Type: application/json;type=entry');
                batchBody.push('');
                batchBody.push(JSON.stringify(change.entityData));
            }
        }
        batchBody.push(`--changeset_${changesetId}--`);
        batchBody.push(requestBody.join('\n'));
        batchBody.push(`--batch_${batchId}--`);
        return batchBody.join('\n');
    }
    static formatBatchResponse(responseText) {
        return responseText.then(response => {
            if (response) {
                if (response.indexOf('"innererror"') > -1
                    || response.indexOf('HTTP/1.1 500 Internal Server Error') > -1
                    || response.indexOf('HTTP/1.1 400 Bad Request') > -1) {
                    throw new Error('Batch Request Error: ' + response);
                }
                else {
                    let data = [];
                    let responses = response.split('--changesetresponse');
                    for (let response of responses) {
                        let contentId = ((/Content-ID:\s?(.*)\b/g).exec(response) || []).slice(1)[0];
                        let entityId = ((/OData-EntityId:[^(]*\((.*)\)/g).exec(response) || []).slice(1)[0];
                        data[contentId - 1] = entityId;
                    }
                    let requests = response.split('--batchresponse');
                    for (let request of requests) {
                        //TODO: determine better way of identifying request responses
                        if (request.indexOf('OData.Community.Display.V1.FormattedValue') > -1) {
                            let responseIndex = request.indexOf('{');
                            let json = request.substring(responseIndex);
                            let item = JSON.parse(json);
                            data.push(DynamicsRequest_1.formatDynamicsResponse(item));
                        }
                    }
                    return data;
                }
            }
        });
    }
    static createId() {
        return 'id' + Math.random().toString(16).slice(2);
    }
    static trimId(id) {
        if (id !== undefined) {
            return (id || '').replace(/{|}/g, '');
        }
        return undefined;
    }
}
//# sourceMappingURL=DynamicsBatch.js.map