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
const httpntlm = require("httpntlm");
const node_fetch_1 = require("node-fetch");
var AuthenticationType;
(function (AuthenticationType) {
    AuthenticationType[AuthenticationType["Windows"] = 1] = "Windows";
    AuthenticationType[AuthenticationType["OAuth"] = 2] = "OAuth";
})(AuthenticationType = exports.AuthenticationType || (exports.AuthenticationType = {}));
class ConnectionOptions {
    constructor() {
        this.authType = AuthenticationType.OAuth;
        this.serverUrl = "";
        this.webApiVersion = Dynamics_1.DefaultWebApiVersion;
    }
}
exports.ConnectionOptions = ConnectionOptions;
function dynamicsQuery(connectionOptions, query, maxRowCount, headers) {
    return __awaiter(this, void 0, void 0, function* () {
        const dataQuery = Query_1.GetRootQuery(query);
        if (!dataQuery.EntityPath) {
            throw new Error('dynamicsQuery requires a Query object with an EntityPath');
        }
        return yield dynamicsQueryUrl(connectionOptions, `/api/data/${connectionOptions.webApiVersion}/${dataQuery.EntityPath}`, query, maxRowCount, headers);
    });
}
exports.dynamicsQuery = dynamicsQuery;
function dynamicsQueryUrl(connectionOptions, dynamicsEntitySetUrl, query, maxRowCount, headers) {
    return __awaiter(this, void 0, void 0, function* () {
        const querySeparator = (dynamicsEntitySetUrl.indexOf('?') > -1 ? '&' : '?');
        return yield request(connectionOptions, `${dynamicsEntitySetUrl}${querySeparator}fetchXml=${escape(QueryXml_1.default(query, maxRowCount))}`, 'GET', undefined, headers);
    });
}
exports.dynamicsQueryUrl = dynamicsQueryUrl;
function dynamicsRequest(connectionOptions, dynamicsEntitySetUrl, headers) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield request(connectionOptions, dynamicsEntitySetUrl, 'GET', undefined, headers);
    });
}
exports.dynamicsRequest = dynamicsRequest;
function dynamicsSave(connectionOptions, entitySetName, data, id, headers) {
    return __awaiter(this, void 0, void 0, function* () {
        if (id) {
            return yield request(connectionOptions, `/api/data/${connectionOptions.webApiVersion}/${entitySetName}(${trimId(id)})`, 'PATCH', data, headers);
        }
        else {
            return yield request(connectionOptions, `/api/data/${connectionOptions.webApiVersion}/${entitySetName}()`, 'POST', data, headers);
        }
    });
}
exports.dynamicsSave = dynamicsSave;
function formatDynamicsResponse(data) {
    var items = [];
    if (data && data.error) {
        throw new Error(data.error);
    }
    if (data && data.value) {
        data = data.value;
    }
    if (!Array.isArray(data)) {
        return formatDynamicsResponse([data])[0];
    }
    if (data) {
        for (var item of data) {
            let row = {};
            for (let key in item) {
                var name = key;
                if (name.indexOf('@odata') === 0) {
                    continue;
                }
                if (name.indexOf('transactioncurrencyid') > -1) {
                    continue;
                }
                if (name.indexOf('@') > -1) {
                    name = name.substring(0, name.indexOf('@'));
                    if (name.indexOf('_') === 0) {
                        name = name.slice(1, -6);
                    }
                    name += "_formatted";
                }
                else if (name.indexOf('_') === 0) {
                    name = name.slice(1, -6);
                }
                if (name.indexOf('_x002e_') > -1) {
                    var obj = name.substring(0, name.indexOf('_x002e_'));
                    name = name.substring(name.indexOf('_x002e_') + 7);
                    if (!row[obj]) {
                        row[obj] = {};
                    }
                    row[obj][name] = item[key];
                }
                else {
                    row[name] = item[key];
                }
            }
            items.push(row);
        }
    }
    return items;
}
exports.formatDynamicsResponse = formatDynamicsResponse;
function request(connectionOptions, url, method, body, headers) {
    return __awaiter(this, void 0, void 0, function* () {
        let callUrl = connectionOptions.serverUrl;
        if (callUrl.endsWith("/")) {
            callUrl = callUrl.substr(0, callUrl.length - 1);
        }
        callUrl = `${callUrl}${url}`;
        //TODO: fetch if we can.
        if (connectionOptions.authType === AuthenticationType.Windows) {
            return new Promise((resolve, reject) => {
                httpntlm[method.toLowerCase()]({
                    url: callUrl,
                    username: connectionOptions.username,
                    password: connectionOptions.password,
                    workstation: connectionOptions.workstation || '',
                    domain: connectionOptions.domain || '',
                    body: body,
                    headers: Object.assign(Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, Dynamics_1.DynamicsHeaders), headers)
                }, function (err, res) {
                    if (err) {
                        console.error(err);
                        reject(err);
                    }
                    const json = JSON.parse(res.body);
                    if (json.error) {
                        console.error(json.error.message);
                        reject(json.error.message);
                    }
                    else if (json.ExceptionMessage) {
                        console.error(json.ExceptionMessage);
                        reject(`The service call returned HTTP ${json.ErrorCode} - ${json.ExceptionMessage}`);
                    }
                    else {
                        resolve(formatDynamicsResponse(json));
                    }
                });
            });
        }
        else {
            return node_fetch_1.default(url, {
                method: method,
                headers: Object.assign(Object.assign({ 'Authorization': `Bearer ${connectionOptions.accessToken}`, 'Content-Type': 'application/json; charset=utf-8' }, Dynamics_1.DynamicsHeaders), headers),
                body: body
            })
                .then(response => response.json())
                .then(data => formatDynamicsResponse(data));
        }
    });
}
function trimId(id) {
    return (id || '').replace(/{|}/g, '');
}
//# sourceMappingURL=DynamicsRequest.js.map