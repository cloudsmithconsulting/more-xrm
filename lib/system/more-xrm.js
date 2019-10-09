var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
System.register("Query/Query", [], function (exports_1, context_1) {
    "use strict";
    var QueryOperator, QueryProvider;
    var __moduleName = context_1 && context_1.id;
    function query(entityName, ...attributeNames) {
        return new QueryProvider(entityName).select(...attributeNames);
    }
    exports_1("default", query);
    function GetRootQuery(query) {
        return (query['RootQuery'] || query).Query;
    }
    exports_1("GetRootQuery", GetRootQuery);
    return {
        setters: [],
        execute: function () {
            (function (QueryOperator) {
                QueryOperator["Contains"] = "like";
                QueryOperator["NotContains"] = "not-like";
                QueryOperator["StartsWith"] = "begins-with";
                QueryOperator["Equals"] = "eq";
                QueryOperator["NotEquals"] = "neq";
                QueryOperator["GreaterThan"] = "gt";
                QueryOperator["LessThan"] = "lt";
                QueryOperator["In"] = "in";
                QueryOperator["NotIn"] = "not-in";
                QueryOperator["OnOrBefore"] = "on-or-before";
                QueryOperator["OnOrAfter"] = "on-or-after";
                QueryOperator["Null"] = "null";
                QueryOperator["NotNull"] = "not-null";
                QueryOperator["IsCurrentUser"] = "eq-userid";
                QueryOperator["IsNotCurrentUser"] = "ne-userid";
                QueryOperator["IsCurrentUserTeam"] = "eq-userteams";
            })(QueryOperator || (QueryOperator = {}));
            exports_1("QueryOperator", QueryOperator);
            QueryProvider = class QueryProvider {
                constructor(EntityName) {
                    this.EntityName = EntityName;
                    this.Query = {
                        Alias: { EntityName },
                        EntityName: EntityName,
                        Attributes: new Set(),
                        OrderBy: new Set(),
                        Conditions: [],
                        Joins: []
                    };
                }
                alias(attributeName, alias) {
                    this.Query.Alias[attributeName] = alias;
                    return this;
                }
                path(entityPath) {
                    this.Query.EntityPath = entityPath;
                    return this;
                }
                select(...attributeNames) {
                    for (const a of this.flatten(attributeNames)) {
                        this.Query.Attributes.add(a);
                    }
                    if (this.RootQuery) {
                        const rootQuery = GetRootQuery(this);
                        for (const a of this.flatten(attributeNames)) {
                            rootQuery.Attributes.add(this.EntityName + '.' + a);
                        }
                    }
                    return this;
                }
                where(attributeName, operator, ...values) {
                    this.Query.Conditions.push({
                        AttributeName: attributeName,
                        Operator: operator,
                        Values: this.flatten(values)
                    });
                    return this;
                }
                whereAny(any) {
                    let conditions = [];
                    any((attributeName, operator, ...values) => {
                        conditions.push({
                            AttributeName: attributeName,
                            Operator: operator,
                            Values: this.flatten(values)
                        });
                    });
                    this.Query.Conditions.push(conditions);
                    return this;
                }
                orderBy(attributeName, isDescendingOrder) {
                    if (isDescendingOrder) {
                        this.Query.OrderBy.add('_' + attributeName);
                    }
                    else {
                        this.Query.OrderBy.add(attributeName);
                    }
                    return this;
                }
                join(entityName, fromAttribute, toAttribute, alias, isOuterJoin) {
                    var exp = new QueryProvider(entityName);
                    var join = exp.Query;
                    exp.RootQuery = this.RootQuery || this;
                    join.JoinAlias = alias || entityName;
                    join.JoinFromAttributeName = fromAttribute;
                    join.JoinToAttributeName = toAttribute || this.EntityName + 'id';
                    join.IsOuterJoin = isOuterJoin;
                    this.Query.Joins.push(join);
                    return exp;
                }
                flatten(values) {
                    return [].concat(...values);
                }
            };
        }
    };
});
System.register("Query/QueryXml", ["Query/Query"], function (exports_2, context_2) {
    "use strict";
    var Query_1;
    var __moduleName = context_2 && context_2.id;
    function GetQueryXml(query, maxRowCount = 0, format = false) {
        const dataQuery = Query_1.GetRootQuery(query);
        if (format) {
            return formatXml(GetDataQueryXml(dataQuery, maxRowCount));
        }
        else {
            return GetDataQueryXml(dataQuery, maxRowCount);
        }
    }
    exports_2("default", GetQueryXml);
    function GetDataQueryXml(query, maxRowCount) {
        var xml = [];
        xml.push('<fetch mapping="logical"');
        if (maxRowCount > 0) {
            xml.push(` count="${maxRowCount}"`);
        }
        xml.push('>');
        xml.push(`<entity name="${query.EntityName}" >`);
        xml.push(getQueryXml(query));
        xml.push('</entity>');
        xml.push('</fetch>');
        return xml.join('');
    }
    function getQueryXml(query) {
        const xml = [];
        query.Attributes.forEach(attribute => {
            if (query.Alias[attribute]) {
                xml.push(`<attribute name="${attribute}" alias="${query.Alias[attribute]}" />`);
            }
            else {
                xml.push(`<attribute name="${attribute}" />`);
            }
        });
        query.OrderBy.forEach(attribute => {
            if (attribute.indexOf('_') === 0) {
                xml.push(`<order attribute="${attribute.slice(1)}" descending="true" />`);
            }
            else {
                xml.push(`<order attribute="${attribute}" />`);
            }
        });
        if (query.Conditions.length > 0) {
            var hasOrCondition = false;
            var filters = [];
            filters.push('<filter type="and">');
            for (var filter of query.Conditions) {
                if (filter && filter.hasOwnProperty('length')) {
                    hasOrCondition = true;
                    var conditions = filter;
                    filters.push('</filter>');
                    filters.push('<filter type="or">');
                    for (var condition of conditions) {
                        filters.push(getConditionXml(condition));
                    }
                    filters.push('</filter>');
                    filters.push('<filter type="and">');
                }
                else {
                    filters.push(getConditionXml(filter));
                }
            }
            filters.push('</filter>');
            if (hasOrCondition) {
                filters.unshift('<filter type="and">');
                filters.push('</filter>');
            }
            var skipNextFilter;
            for (var i = 0; i < filters.length; i++) {
                if (filters[i] && filters[i + 1] && filters[i].indexOf('<filter') > -1 && filters[i + 1].indexOf('/filter>') > -1) {
                    skipNextFilter = true;
                }
                else if (!skipNextFilter) {
                    xml.push(filters[i]);
                }
                else {
                    skipNextFilter = false;
                }
            }
        }
        if (query.Joins) {
            for (var join of query.Joins) {
                xml.push(`<link-entity name="${join.EntityName}" alias="${join.JoinAlias}" from="${join.JoinFromAttributeName}" to="${join.JoinToAttributeName}" link-type="${join.IsOuterJoin ? 'outer' : 'inner'}">`);
                xml.push(getQueryXml(join));
                xml.push('</link-entity>');
            }
        }
        return xml.join('\n');
    }
    function getConditionXml(condition) {
        var xml = [];
        if (condition.AttributeName.indexOf('.') > -1) {
            condition.AttributeName = `${condition.AttributeName.split('.')[1]}" entityname="${condition.AttributeName.split('.')[0]}`;
        }
        if (condition.Values && condition.Values.length > 0) {
            if (condition.Values.length > 1) {
                xml.push(`<condition attribute="${condition.AttributeName}" operator="${condition.Operator}">`);
                for (var value of condition.Values) {
                    xml.push(`<value>${encodeValue(value)}</value>`);
                }
                xml.push('</condition>');
            }
            else {
                xml.push(`<condition attribute="${condition.AttributeName}" operator="${condition.Operator}" value="${encodeValue(condition.Values[0])}" />`);
            }
        }
        else {
            xml.push(`<condition attribute="${condition.AttributeName}" operator="${condition.Operator}" />`);
        }
        return xml.join('\n');
    }
    function encodeValue(value) {
        if (value === 0) {
            return '0';
        }
        if (value === true) {
            return 'true';
        }
        if (value === false) {
            return 'false';
        }
        if (!value) {
            return '';
        }
        if (typeof (value.toISOString) === 'function') {
            return value.toISOString();
        }
        return xmlEncode(value.toString());
    }
    function xmlEncode(text) {
        if (text && typeof (text) === 'string') {
            text = text.replace(/&/g, '&amp;');
            text = text.replace(/\"/g, '&quot;');
            text = text.replace(/\'/g, '&apos;');
            text = text.replace(/</g, '&lt;');
            text = text.replace(/>/g, '&gt;');
        }
        return text;
    }
    function formatXml(xmlString) {
        var indent = "\t";
        var tabs = ""; //store the current indentation
        return xmlString.replace(/\s*<[^>\/]*>[^<>]*<\/[^>]*>|\s*<.+?>|\s*[^<]+/g, //pattern to match nodes (angled brackets or text)
        function (m, i) {
            m = m.replace(/^\s+|\s+$/g, ""); //trim the match just in case
            if (i < 38 && /^<[?]xml/.test(m)) {
                return m + "\n";
            } //if the match is a header, ignore it
            if (/^<[/]/.test(m)) //if the match is a closing tag
             {
                tabs = tabs.replace(indent, ""); //remove one indent from the store
                m = tabs + m; //add the tabs at the beginning of the match
            }
            else if (/<.*>.*<\/.*>|<.*[^>]\/>/.test(m)) //if the match contains an entire node
             {
                //leave the store as is or
                m = m.replace(/(<[^\/>]*)><[\/][^>]*>/g, "$1 />"); //join opening with closing tags of the same node to one entire node if no content is between them
                m = tabs + m; //add the tabs at the beginning of the match
            }
            else if (/<.*>/.test(m)) //if the match starts with an opening tag and does not contain an entire node
             {
                m = tabs + m; //add the tabs at the beginning of the match
                tabs += indent; //and add one indent to the store
            }
            else //if the match contain a text node
             {
                m = tabs + m; // add the tabs at the beginning of the match
            }
            //return m+"\n";
            return "\n" + m; //content has additional space(match) from header
        });
    }
    return {
        setters: [
            function (Query_1_1) {
                Query_1 = Query_1_1;
            }
        ],
        execute: function () {
        }
    };
});
System.register("Dynamics/DynamicsRequest", ["Query/Query", "Query/QueryXml", "Dynamics/Dynamics", "httpntlm", "node-fetch"], function (exports_3, context_3) {
    "use strict";
    var Query_2, QueryXml_1, Dynamics_1, httpntlm, node_fetch_1, AuthenticationType, ConnectionOptions;
    var __moduleName = context_3 && context_3.id;
    function dynamicsQuery(connectionOptions, query, maxRowCount, headers) {
        return __awaiter(this, void 0, void 0, function* () {
            const dataQuery = Query_2.GetRootQuery(query);
            if (!dataQuery.EntityPath) {
                throw new Error('dynamicsQuery requires a Query object with an EntityPath');
            }
            return yield dynamicsQueryUrl(connectionOptions, `/api/data/${connectionOptions.webApiVersion}/${dataQuery.EntityPath}`, query, maxRowCount, headers);
        });
    }
    exports_3("dynamicsQuery", dynamicsQuery);
    function dynamicsQueryUrl(connectionOptions, dynamicsEntitySetUrl, query, maxRowCount, headers) {
        return __awaiter(this, void 0, void 0, function* () {
            const querySeparator = (dynamicsEntitySetUrl.indexOf('?') > -1 ? '&' : '?');
            return yield request(connectionOptions, `${dynamicsEntitySetUrl}${querySeparator}fetchXml=${escape(QueryXml_1.default(query, maxRowCount))}`, 'GET', undefined, headers);
        });
    }
    exports_3("dynamicsQueryUrl", dynamicsQueryUrl);
    function dynamicsRequest(connectionOptions, dynamicsEntitySetUrl, headers) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield request(connectionOptions, dynamicsEntitySetUrl, 'GET', undefined, headers);
        });
    }
    exports_3("dynamicsRequest", dynamicsRequest);
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
    exports_3("dynamicsSave", dynamicsSave);
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
    exports_3("formatDynamicsResponse", formatDynamicsResponse);
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
    return {
        setters: [
            function (Query_2_1) {
                Query_2 = Query_2_1;
            },
            function (QueryXml_1_1) {
                QueryXml_1 = QueryXml_1_1;
            },
            function (Dynamics_1_1) {
                Dynamics_1 = Dynamics_1_1;
            },
            function (httpntlm_1) {
                httpntlm = httpntlm_1;
            },
            function (node_fetch_1_1) {
                node_fetch_1 = node_fetch_1_1;
            }
        ],
        execute: function () {
            (function (AuthenticationType) {
                AuthenticationType[AuthenticationType["Windows"] = 1] = "Windows";
                AuthenticationType[AuthenticationType["OAuth"] = 2] = "OAuth";
            })(AuthenticationType || (AuthenticationType = {}));
            exports_3("AuthenticationType", AuthenticationType);
            ConnectionOptions = class ConnectionOptions {
                constructor() {
                    this.authType = AuthenticationType.OAuth;
                    this.serverUrl = "";
                    this.webApiVersion = Dynamics_1.DefaultWebApiVersion;
                }
            };
            exports_3("ConnectionOptions", ConnectionOptions);
        }
    };
});
System.register("Dynamics/DynamicsBatch", ["Query/Query", "Query/QueryXml", "Dynamics/Dynamics", "Dynamics/DynamicsRequest", "httpntlm", "node-fetch"], function (exports_4, context_4) {
    "use strict";
    var Query_3, QueryXml_2, Dynamics_2, DynamicsRequest_1, httpntlm, node_fetch_2, Batch;
    var __moduleName = context_4 && context_4.id;
    function dynamicsBatch(connectionOptions, headers) {
        return new Batch(connectionOptions, headers);
    }
    exports_4("dynamicsBatch", dynamicsBatch);
    function dynamicsBatchRequest(connectionOptions, ...url) {
        const batch = new Batch(connectionOptions);
        batch.requestAllUrls(url);
        return batch.execute();
    }
    exports_4("dynamicsBatchRequest", dynamicsBatchRequest);
    function dynamicsBatchQuery(connectionOptions, ...query) {
        const batch = new Batch(connectionOptions);
        batch.requestAll(query);
        return batch.execute();
    }
    exports_4("dynamicsBatchQuery", dynamicsBatchQuery);
    return {
        setters: [
            function (Query_3_1) {
                Query_3 = Query_3_1;
            },
            function (QueryXml_2_1) {
                QueryXml_2 = QueryXml_2_1;
            },
            function (Dynamics_2_1) {
                Dynamics_2 = Dynamics_2_1;
            },
            function (DynamicsRequest_1_1) {
                DynamicsRequest_1 = DynamicsRequest_1_1;
            },
            function (httpntlm_2) {
                httpntlm = httpntlm_2;
            },
            function (node_fetch_2_1) {
                node_fetch_2 = node_fetch_2_1;
            }
        ],
        execute: function () {
            Batch = class Batch {
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
                        const dataQuery = Query_3.GetRootQuery(query);
                        this.request(query);
                        return {
                            entitySetName: dataQuery.EntityPath,
                            entitySetQuery: `fetchXml=${escape(QueryXml_2.default(query))}`
                        };
                    }));
                    return this;
                }
                request(query, maxRowCount = Dynamics_2.DefaultMaxRecords) {
                    const dataQuery = Query_3.GetRootQuery(query);
                    if (!dataQuery.EntityPath) {
                        throw new Error('dynamicsBatch request requires a Query object with an EntityPath');
                    }
                    this.Changes.push({
                        entitySetName: dataQuery.EntityPath,
                        entitySetQuery: `fetchXml=${escape(QueryXml_2.default(query, maxRowCount))}`
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
                                headers: Object.assign(Object.assign({ 'Content-Type': `multipart/mixed;boundary=batch_${batchId}` }, Dynamics_2.DynamicsHeaders), headers)
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
                        return node_fetch_2.default(callUrl, {
                            method: 'POST',
                            headers: Object.assign(Object.assign({ 'Content-Type': `multipart/mixed;boundary=batch_${batchId}`, 'Authorization': connectionOptions.accessToken }, Dynamics_2.DynamicsHeaders), headers),
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
            };
        }
    };
});
System.register("Dynamics/Dynamics", ["Query/Query", "Dynamics/DynamicsBatch", "Dynamics/DynamicsRequest"], function (exports_5, context_5) {
    "use strict";
    var Query_4, DynamicsBatch_1, DynamicsRequest_2, DefaultWebApiVersion, DefaultMaxRecords, DynamicsHeaders, DynamicsClient;
    var __moduleName = context_5 && context_5.id;
    function dynamics(connectionOptions) {
        return new DynamicsClient(connectionOptions);
    }
    exports_5("default", dynamics);
    return {
        setters: [
            function (Query_4_1) {
                Query_4 = Query_4_1;
            },
            function (DynamicsBatch_1_1) {
                DynamicsBatch_1 = DynamicsBatch_1_1;
            },
            function (DynamicsRequest_2_1) {
                DynamicsRequest_2 = DynamicsRequest_2_1;
            }
        ],
        execute: function () {
            exports_5("DefaultWebApiVersion", DefaultWebApiVersion = 'v9.1');
            exports_5("DefaultMaxRecords", DefaultMaxRecords = 100);
            exports_5("DynamicsHeaders", DynamicsHeaders = {
                'OData-MaxVersion': '4.0',
                'OData-Version': '4.0',
                'Prefer': 'odata.include-annotations=OData.Community.Display.V1.FormattedValue'
            });
            DynamicsClient = class DynamicsClient {
                constructor(options) {
                    if (options) {
                        this.connectionOptions = options;
                    }
                }
                batch() {
                    return DynamicsBatch_1.dynamicsBatch(this.connectionOptions, this.dynamicsHeaders);
                }
                fetch(query, maxRowCount = DefaultMaxRecords) {
                    return DynamicsRequest_2.dynamicsQuery(this.connectionOptions, query, maxRowCount, this.dynamicsHeaders);
                }
                optionset(entityName, attributeName) {
                    return DynamicsRequest_2.dynamicsRequest(this.connectionOptions, `/api/data/${this.connectionOptions.webApiVersion}/EntityDefinitions(LogicalName='${entityName}')/Attributes(LogicalName='${attributeName}')/Microsoft.Dynamics.CRM.PicklistAttributeMetadata?$select=LogicalName&$expand=OptionSet($select=Options),GlobalOptionSet($select=Options)`, this.dynamicsHeaders)
                        .then(attribute => (attribute.OptionSet || attribute.GlobalOptionSet).Options.map((option) => ({
                        label: (option.Label && option.Label.UserLocalizedLabel && option.Label.UserLocalizedLabel.Label),
                        value: option.Value
                    })));
                }
                query(entityLogicalName, entitySetName) {
                    return Query_4.default(entityLogicalName).path(entitySetName);
                }
                save(entitySetName, data, id) {
                    return DynamicsRequest_2.dynamicsSave(this.connectionOptions, entitySetName, data, id, this.dynamicsHeaders);
                }
            };
        }
    };
});
System.register("Dynamics/Model/OrganizationMetadata", [], function (exports_6, context_6) {
    "use strict";
    var __moduleName = context_6 && context_6.id;
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("Dynamics/DynamicsDiscovery", ["Dynamics/DynamicsRequest"], function (exports_7, context_7) {
    "use strict";
    var DynamicsRequest_3, DefaultDiscoveryApiVersion, DynamicsDiscoveryClient;
    var __moduleName = context_7 && context_7.id;
    function dynamicsDiscovery(connectionOptions) {
        return new DynamicsDiscoveryClient(connectionOptions);
    }
    exports_7("default", dynamicsDiscovery);
    return {
        setters: [
            function (DynamicsRequest_3_1) {
                DynamicsRequest_3 = DynamicsRequest_3_1;
            }
        ],
        execute: function () {
            exports_7("DefaultDiscoveryApiVersion", DefaultDiscoveryApiVersion = 'v9.1');
            DynamicsDiscoveryClient = class DynamicsDiscoveryClient {
                constructor(options) {
                    if (options) {
                        this.connectionOptions = options;
                        if (!options.webApiVersion) {
                            this.connectionOptions.webApiVersion = DefaultDiscoveryApiVersion;
                        }
                    }
                }
                discover() {
                    return DynamicsRequest_3.dynamicsRequest(this.connectionOptions, `/api/discovery/${this.connectionOptions.webApiVersion}/Instances`, this.dynamicsHeaders);
                }
            };
        }
    };
});
System.register("Dynamics/Model/EntityMetadata", [], function (exports_8, context_8) {
    "use strict";
    var __moduleName = context_8 && context_8.id;
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("Dynamics/Model/AttributeMetadata", [], function (exports_9, context_9) {
    "use strict";
    var AttributeTypeCodes;
    var __moduleName = context_9 && context_9.id;
    return {
        setters: [],
        execute: function () {
            exports_9("AttributeTypeCodes", AttributeTypeCodes = [
                'BigInt',
                'Boolean',
                'Customer',
                'DateTime',
                'Decimal',
                'Double',
                'Integer',
                'Lookup',
                'Memo',
                'Money',
                'PartyList',
                'Picklist',
                'State',
                'Status',
                'String'
            ]);
        }
    };
});
System.register("Dynamics/Model/OptionSetMetadata", [], function (exports_10, context_10) {
    "use strict";
    var __moduleName = context_10 && context_10.id;
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("Dynamics/DynamicsMetadata", ["Dynamics/DynamicsBatch", "Dynamics/DynamicsRequest"], function (exports_11, context_11) {
    "use strict";
    var DynamicsBatch_2, DynamicsRequest_4, entityProperties, attributeProperties, ExcludedAttributeTypeFilters, ExcludedAttributeNameFilters, DynamicsMetadataClient, DynamicsMetadataMapper;
    var __moduleName = context_11 && context_11.id;
    function dynamicsmetdata(connectionOptions) {
        return new DynamicsMetadataClient(connectionOptions);
    }
    exports_11("default", dynamicsmetdata);
    function isLookupAttribute(attribute) {
        return attribute.Type === 'Lookup' && attribute['LookupEntityName'];
    }
    exports_11("isLookupAttribute", isLookupAttribute);
    function isOptionSetAttribute(attribute) {
        return (attribute.Type === 'Picklist' || attribute.Type === 'State' || attribute.Type === 'Status') && attribute['PicklistOptions'];
    }
    exports_11("isOptionSetAttribute", isOptionSetAttribute);
    function isLookup(attribute) {
        return Array.isArray(attribute['Targets']);
    }
    function isOptionSet(attribute) {
        return attribute['OptionSet'] && Array.isArray(attribute['OptionSet'].Options);
    }
    return {
        setters: [
            function (DynamicsBatch_2_1) {
                DynamicsBatch_2 = DynamicsBatch_2_1;
            },
            function (DynamicsRequest_4_1) {
                DynamicsRequest_4 = DynamicsRequest_4_1;
            }
        ],
        execute: function () {
            entityProperties = [
                "Description", "DisplayName", "EntitySetName",
                "IconSmallName", "IsActivity", "IsCustomEntity",
                "LogicalName", "PrimaryIdAttribute", "PrimaryNameAttribute"
            ];
            attributeProperties = [
                "AttributeType", "DisplayName", "IsCustomAttribute",
                "LogicalName", "SchemaName"
            ];
            ExcludedAttributeTypeFilters = [
                'Uniqueidentifier',
                'CalendarRules',
                'EntityName',
                'ManagedProperty',
                'Owner',
                'Virtual',
                'Lookup',
                'Picklist',
                'Status',
                'State'
            ];
            ExcludedAttributeNameFilters = [
                'exchangerate',
                'utcconversiontimezonecode',
                'timezoneruleversionnumber',
                'importsequencenumber',
                'organizationid',
                'transactioncurrencyid',
                'versionnumber',
                'createdonbehalfby',
                'modifiedonbehalfby',
                'overriddencreatedon',
                'entityimage_timestamp'
            ];
            DynamicsMetadataClient = class DynamicsMetadataClient {
                constructor(options) {
                    if (options) {
                        this.connectionOptions = options;
                    }
                }
                attributes(entityName) {
                    return DynamicsBatch_2.dynamicsBatch(this.connectionOptions, this.dynamicsHeaders)
                        .requestAllUrls(this.getMetadataUrls(entityName, false))
                        .execute()
                        .then(data => this.flatten(data)
                        .filter((attribute) => attribute.LogicalName.indexOf('yomi') === -1 || attribute.LogicalName.indexOf('base') !== attribute.LogicalName.length - 4)
                        .map(DynamicsMetadataMapper.MapAttribute));
                }
                entities() {
                    return DynamicsRequest_4.dynamicsRequest(this.connectionOptions, `/api/data/${this.connectionOptions.webApiVersion}/EntityDefinitions?$select=EntitySetName,Description,DisplayName,LogicalName,PrimaryIdAttribute,PrimaryNameAttribute,IconSmallName,IsActivity,IsCustomEntity`, this.dynamicsHeaders)
                        .then(data => data
                        .map(entity => DynamicsMetadataMapper.MapEntity(entity)));
                }
                entity(entityName) {
                    return DynamicsRequest_4.dynamicsRequest(this.connectionOptions, `/api/data/${this.connectionOptions.webApiVersion}/EntityDefinitions(LogicalName='${entityName}')?$select=EntitySetName,Description,DisplayName,LogicalName,PrimaryIdAttribute,PrimaryNameAttribute,IconSmallName,IsActivity,IsCustomEntity`, this.dynamicsHeaders)
                        .then(entity => this.attributes(entityName)
                        .then(attributes => DynamicsMetadataMapper.MapEntity(entity, attributes)));
                }
                entityAttributes(...entityNames) {
                    return DynamicsBatch_2.dynamicsBatch(this.connectionOptions, this.dynamicsHeaders)
                        .requestAllUrls(this.flatten(entityNames.map(e => this.getMetadataUrls(e, true))))
                        .execute()
                        .then(data => {
                        const entities = [];
                        const items = this.flatten(data);
                        let currentEntity;
                        for (const item of items) {
                            if (item.EntitySetName) {
                                currentEntity = DynamicsMetadataMapper.MapEntity(item);
                                entities.push(currentEntity);
                            }
                            else if (item.LogicalName.indexOf('yomi') === -1 && item.LogicalName.indexOf('base') !== item.LogicalName.length - 4) {
                                currentEntity.Attributes.push(DynamicsMetadataMapper.MapAttribute(item));
                            }
                        }
                        return entities;
                    });
                }
                getMetadataUrls(entityName, includeEntity = false) {
                    const attributeTypeFilter = ExcludedAttributeTypeFilters.map(v => `AttributeType ne Microsoft.Dynamics.CRM.AttributeTypeCode'${v}'`).join(' and ');
                    const attributeNameFilter = ExcludedAttributeNameFilters.map(v => `LogicalName ne '${v}'`).join(' and ');
                    return [
                        `/api/data/${this.connectionOptions.webApiVersion}/EntityDefinitions(LogicalName='${entityName}')?$select=${entityProperties}`,
                        `/api/data/${this.connectionOptions.webApiVersion}/EntityDefinitions(LogicalName='${entityName}')/Attributes?$select=${attributeProperties}&$filter=${attributeTypeFilter} and ${attributeNameFilter}`,
                        `/api/data/${this.connectionOptions.webApiVersion}/EntityDefinitions(LogicalName='${entityName}')/Attributes/Microsoft.Dynamics.CRM.LookupAttributeMetadata?$select=${attributeProperties},Targets`,
                        `/api/data/${this.connectionOptions.webApiVersion}/EntityDefinitions(LogicalName='${entityName}')/Attributes/Microsoft.Dynamics.CRM.PicklistAttributeMetadata?$select=${attributeProperties}&$expand=OptionSet($select=Options)`,
                        `/api/data/${this.connectionOptions.webApiVersion}/EntityDefinitions(LogicalName='${entityName}')/Attributes/Microsoft.Dynamics.CRM.StatusAttributeMetadata?$select=${attributeProperties}&$expand=OptionSet($select=Options)`,
                        `/api/data/${this.connectionOptions.webApiVersion}/EntityDefinitions(LogicalName='${entityName}')/Attributes/Microsoft.Dynamics.CRM.StateAttributeMetadata?$select=${attributeProperties}&$expand=OptionSet($select=Options)`
                    ].slice(includeEntity ? 0 : 1);
                }
                flatten(values) {
                    return [].concat(...values);
                }
            };
            DynamicsMetadataMapper = class DynamicsMetadataMapper {
                static MapAttribute(attribute) {
                    return {
                        LogicalName: attribute.LogicalName,
                        DisplayName: (attribute.DisplayName && attribute.DisplayName.UserLocalizedLabel && attribute.DisplayName.UserLocalizedLabel.Label) || attribute.LogicalName,
                        Type: attribute.AttributeType,
                        IsCustomAttribute: attribute.IsCustomAttribute,
                        LookupEntityName: isLookup(attribute) && attribute.Targets[0],
                        LookupSchemaName: isLookup(attribute) && attribute.SchemaName,
                        PicklistOptions: isOptionSet(attribute) && attribute.OptionSet.Options.map((opt) => ({
                            Label: (opt.Label && opt.Label.UserLocalizedLabel && opt.Label.UserLocalizedLabel.Label),
                            Value: opt.Value
                        }))
                    };
                }
                static MapEntity(entity, attributes) {
                    return {
                        Description: (entity.Description && entity.Description.UserLocalizedLabel && entity.Description.UserLocalizedLabel.Label) || '',
                        DisplayName: (entity.DisplayName && entity.DisplayName.UserLocalizedLabel && entity.DisplayName.UserLocalizedLabel.Label) || entity.LogicalName,
                        EntitySetName: entity.EntitySetName,
                        IconSmallName: entity.IconSmallName,
                        IsActivity: entity.IsActivity,
                        IsCustomEntity: entity.IsCustomEntity,
                        LogicalName: entity.LogicalName,
                        PrimaryIdAttribute: entity.PrimaryIdAttribute,
                        PrimaryNameAttribute: entity.PrimaryNameAttribute,
                        Attributes: attributes || []
                    };
                }
            };
        }
    };
});
System.register("ntlm/ntlm.flags", [], function (exports_12, context_12) {
    'use strict';
    var NtlmFlags;
    var __moduleName = context_12 && context_12.id;
    return {
        setters: [],
        execute: function () {
            (function (NtlmFlags) {
                /* Indicates that Unicode strings are supported for use in security buffer
                   data. */
                NtlmFlags[NtlmFlags["NEGOTIATE_UNICODE"] = 1] = "NEGOTIATE_UNICODE";
                /* Indicates that OEM strings are supported for use in security buffer data. */
                NtlmFlags[NtlmFlags["NEGOTIATE_OEM"] = 2] = "NEGOTIATE_OEM";
                /* Requests that the server's authentication realm be included in the Type 2
                   message. */
                NtlmFlags[NtlmFlags["REQUEST_TARGET"] = 4] = "REQUEST_TARGET";
                /* unknown (1<<3) */
                /* Specifies that authenticated communication between the client and server
                   should carry a digital signature (message integrity). */
                NtlmFlags[NtlmFlags["NEGOTIATE_SIGN"] = 16] = "NEGOTIATE_SIGN";
                /* Specifies that authenticated communication between the client and server
                   should be encrypted (message confidentiality). */
                NtlmFlags[NtlmFlags["NEGOTIATE_SEAL"] = 32] = "NEGOTIATE_SEAL";
                /* Indicates that datagram authentication is being used. */
                NtlmFlags[NtlmFlags["NEGOTIATE_DATAGRAM_STYLE"] = 64] = "NEGOTIATE_DATAGRAM_STYLE";
                /* Indicates that the LAN Manager session key should be used for signing and
                   sealing authenticated communications. */
                NtlmFlags[NtlmFlags["NEGOTIATE_LM_KEY"] = 128] = "NEGOTIATE_LM_KEY";
                /* unknown purpose */
                NtlmFlags[NtlmFlags["NEGOTIATE_NETWARE"] = 256] = "NEGOTIATE_NETWARE";
                /* Indicates that NTLM authentication is being used. */
                NtlmFlags[NtlmFlags["NEGOTIATE_NTLM_KEY"] = 512] = "NEGOTIATE_NTLM_KEY";
                /* unknown (1<<10) */
                /* Sent by the client in the Type 3 message to indicate that an anonymous
                   context has been established. This also affects the response fields. */
                NtlmFlags[NtlmFlags["NEGOTIATE_ANONYMOUS"] = 2048] = "NEGOTIATE_ANONYMOUS";
                /* Sent by the client in the Type 1 message to indicate that a desired
                   authentication realm is included in the message. */
                NtlmFlags[NtlmFlags["NEGOTIATE_DOMAIN_SUPPLIED"] = 4096] = "NEGOTIATE_DOMAIN_SUPPLIED";
                /* Sent by the client in the Type 1 message to indicate that the client
                   workstation's name is included in the message. */
                NtlmFlags[NtlmFlags["NEGOTIATE_WORKSTATION_SUPPLIED"] = 8192] = "NEGOTIATE_WORKSTATION_SUPPLIED";
                /* Sent by the server to indicate that the server and client are on the same
                   machine. Implies that the client may use a pre-established local security
                   context rather than responding to the challenge. */
                NtlmFlags[NtlmFlags["NEGOTIATE_LOCAL_CALL"] = 16384] = "NEGOTIATE_LOCAL_CALL";
                /* Indicates that authenticated communication between the client and server
                   should be signed with a "dummy" signature. */
                NtlmFlags[NtlmFlags["NEGOTIATE_ALWAYS_SIGN"] = 32768] = "NEGOTIATE_ALWAYS_SIGN";
                /* Sent by the server in the Type 2 message to indicate that the target
                   authentication realm is a domain. */
                NtlmFlags[NtlmFlags["TARGET_TYPE_DOMAIN"] = 65536] = "TARGET_TYPE_DOMAIN";
                /* Sent by the server in the Type 2 message to indicate that the target
                   authentication realm is a server. */
                NtlmFlags[NtlmFlags["TARGET_TYPE_SERVER"] = 131072] = "TARGET_TYPE_SERVER";
                /* Sent by the server in the Type 2 message to indicate that the target
                   authentication realm is a share. Presumably, this is for share-level
                   authentication. Usage is unclear. */
                NtlmFlags[NtlmFlags["TARGET_TYPE_SHARE"] = 262144] = "TARGET_TYPE_SHARE";
                /* Indicates that the NTLM2 signing and sealing scheme should be used for
                   protecting authenticated communications. */
                NtlmFlags[NtlmFlags["NEGOTIATE_NTLM2_KEY"] = 524288] = "NEGOTIATE_NTLM2_KEY";
                /* unknown purpose */
                NtlmFlags[NtlmFlags["REQUEST_INIT_RESPONSE"] = 1048576] = "REQUEST_INIT_RESPONSE";
                /* unknown purpose */
                NtlmFlags[NtlmFlags["REQUEST_ACCEPT_RESPONSE"] = 2097152] = "REQUEST_ACCEPT_RESPONSE";
                /* unknown purpose */
                NtlmFlags[NtlmFlags["REQUEST_NONNT_SESSION_KEY"] = 4194304] = "REQUEST_NONNT_SESSION_KEY";
                /* Sent by the client in the Type 1 message to request Target info block from server.
                   Sent by the server in the Type 2 message to indicate that it is including a
                   Target Information block in the message. */
                NtlmFlags[NtlmFlags["NEGOTIATE_TARGET_INFO"] = 8388608] = "NEGOTIATE_TARGET_INFO";
                /* unknown (1<24) */
                /* Indicates that the version info block is included in the message */
                NtlmFlags[NtlmFlags["NEGOTIATE_VERSION"] = 33554432] = "NEGOTIATE_VERSION";
                /* unknown (1<26) */
                /* unknown (1<27) */
                /* unknown (1<28) */
                /* Indicates that 128-bit encryption is supported. */
                NtlmFlags[NtlmFlags["NEGOTIATE_128"] = 536870912] = "NEGOTIATE_128";
                /* Indicates that the client will provide an encrypted master key in
                   the "Session Key" field of the Type 3 message. */
                NtlmFlags[NtlmFlags["NEGOTIATE_KEY_EXCHANGE"] = 1073741824] = "NEGOTIATE_KEY_EXCHANGE";
                /* Indicates that 56-bit encryption is supported. */
                NtlmFlags[NtlmFlags["NEGOTIATE_56"] = -2147483648] = "NEGOTIATE_56";
            })(NtlmFlags || (NtlmFlags = {}));
            exports_12("NtlmFlags", NtlmFlags);
        }
    };
});
System.register("ntlm/ntlm.constants", [], function (exports_13, context_13) {
    "use strict";
    var NtlmConstants;
    var __moduleName = context_13 && context_13.id;
    return {
        setters: [],
        execute: function () {
            NtlmConstants = class NtlmConstants {
            };
            exports_13("NtlmConstants", NtlmConstants);
            NtlmConstants.NTLM_SIGNATURE = 'NTLMSSP\0';
        }
    };
});
System.register("ntlm/type2.message", ["ntlm/ntlm.flags", "ntlm/ntlm.constants"], function (exports_14, context_14) {
    "use strict";
    var ntlm_flags_1, ntlm_constants_1, Type2Message;
    var __moduleName = context_14 && context_14.id;
    return {
        setters: [
            function (ntlm_flags_1_1) {
                ntlm_flags_1 = ntlm_flags_1_1;
            },
            function (ntlm_constants_1_1) {
                ntlm_constants_1 = ntlm_constants_1_1;
            }
        ],
        execute: function () {
            Type2Message = class Type2Message {
                constructor(buf) {
                    this.raw = buf;
                    //check signature
                    if (buf.toString('ascii', 0, ntlm_constants_1.NtlmConstants.NTLM_SIGNATURE.length) !== ntlm_constants_1.NtlmConstants.NTLM_SIGNATURE) {
                        throw new Error('Invalid message signature');
                    }
                    //check message type
                    if (buf.readUInt32LE(ntlm_constants_1.NtlmConstants.NTLM_SIGNATURE.length) !== 2) {
                        throw new Error('Invalid message type (no type 2)');
                    }
                    //read flags
                    this.flags = buf.readUInt32LE(20);
                    this.encoding = (this.flags & ntlm_flags_1.NtlmFlags.NEGOTIATE_OEM) ? 'ascii' : 'ucs2';
                    this.version = (this.flags & ntlm_flags_1.NtlmFlags.NEGOTIATE_NTLM2_KEY) ? 2 : 1;
                    this.challenge = buf.slice(24, 32);
                    //read target name
                    this.targetName = this.readTargetName();
                    //read target info
                    if (this.flags & ntlm_flags_1.NtlmFlags.NEGOTIATE_TARGET_INFO) {
                        this.targetInfo = this.parseTargetInfo();
                    }
                }
                readTargetName() {
                    let length = this.raw.readUInt16LE(12);
                    //skipping allocated space
                    let offset = this.raw.readUInt32LE(16);
                    if (length === 0) {
                        return '';
                    }
                    if ((offset + length) > this.raw.length || offset < 32) {
                        throw new Error('Bad type 2 message');
                    }
                    return this.raw.toString(this.encoding, offset, offset + length);
                }
                parseTargetInfo() {
                    let info = {};
                    let length = this.raw.readUInt16LE(40);
                    //skipping allocated space
                    let offset = this.raw.readUInt32LE(44);
                    let targetInfoBuffer = Buffer.alloc(length);
                    this.raw.copy(targetInfoBuffer, 0, offset, offset + length);
                    if (length === 0) {
                        return info;
                    }
                    if ((offset + length) > this.raw.length || offset < 32) {
                        throw new Error('Bad type 2 message');
                    }
                    let pos = offset;
                    while (pos < (offset + length)) {
                        let blockType = this.raw.readUInt16LE(pos);
                        pos += 2;
                        let blockLength = this.raw.readUInt16LE(pos);
                        pos += 2;
                        if (blockType === 0) {
                            //reached the terminator subblock
                            break;
                        }
                        let blockTypeStr;
                        let blockTypeOutput = 'string';
                        switch (blockType) {
                            case 0x01:
                                blockTypeStr = 'SERVER';
                                break;
                            case 0x02:
                                blockTypeStr = 'DOMAIN';
                                break;
                            case 0x03:
                                blockTypeStr = 'FQDN';
                                break;
                            case 0x04:
                                blockTypeStr = 'DNS';
                                break;
                            case 0x05:
                                blockTypeStr = 'PARENT_DNS';
                                break;
                            case 0x06:
                                blockTypeStr = 'FLAGS';
                                blockTypeOutput = 'hex';
                                break;
                            case 0x07:
                                blockTypeStr = 'SERVER_TIMESTAMP';
                                blockTypeOutput = 'hex';
                                break;
                            case 0x08:
                                blockTypeStr = 'SINGLE_HOST';
                                blockTypeOutput = 'hex';
                                break;
                            case 0x09:
                                blockTypeStr = 'TARGET_NAME';
                                break;
                            case 0x0A:
                                blockTypeStr = 'CHANNEL_BINDING';
                                blockTypeOutput = 'hex';
                                break;
                            default:
                                blockTypeStr = '';
                                break;
                        }
                        if (blockTypeStr) {
                            if (blockTypeOutput === 'string') {
                                info[blockTypeStr] = this.raw.toString('ucs2', pos, pos + blockLength);
                            }
                            else {
                                // Output as hex in little endian order
                                let twoCharBlocks = this.raw.toString('hex', pos, pos + blockLength).match(/.{2}/g);
                                if (twoCharBlocks) {
                                    info[blockTypeStr] = twoCharBlocks.reverse().join("");
                                }
                                else {
                                    info[blockTypeStr] = null;
                                }
                            }
                        }
                        pos += blockLength;
                    }
                    return {
                        parsed: info,
                        buffer: targetInfoBuffer
                    };
                }
            };
            exports_14("Type2Message", Type2Message);
        }
    };
});
System.register("ntlm/hash", ["crypto"], function (exports_15, context_15) {
    'use strict';
    var crypto, Hash;
    var __moduleName = context_15 && context_15.id;
    return {
        setters: [
            function (crypto_1) {
                crypto = crypto_1;
            }
        ],
        execute: function () {
            Hash = class Hash {
                static createLMResponse(challenge, lmhash) {
                    let buf = Buffer.alloc(24);
                    let pwBuffer = Buffer.alloc(21).fill(0);
                    lmhash.copy(pwBuffer);
                    Hash.calculateDES(pwBuffer.slice(0, 7), challenge).copy(buf);
                    Hash.calculateDES(pwBuffer.slice(7, 14), challenge).copy(buf, 8);
                    Hash.calculateDES(pwBuffer.slice(14), challenge).copy(buf, 16);
                    return buf;
                }
                static createLMHash(password) {
                    let buf = Buffer.alloc(16), pwBuffer = Buffer.alloc(14), magicKey = Buffer.from('KGS!@#$%', 'ascii');
                    if (password.length > 14) {
                        buf.fill(0);
                        return buf;
                    }
                    pwBuffer.fill(0);
                    pwBuffer.write(password.toUpperCase(), 0, 'ascii');
                    return Buffer.concat([
                        Hash.calculateDES(pwBuffer.slice(0, 7), magicKey),
                        Hash.calculateDES(pwBuffer.slice(7), magicKey)
                    ]);
                }
                static calculateDES(key, message) {
                    let desKey = Buffer.alloc(8);
                    desKey[0] = key[0] & 0xFE;
                    desKey[1] = ((key[0] << 7) & 0xFF) | (key[1] >> 1);
                    desKey[2] = ((key[1] << 6) & 0xFF) | (key[2] >> 2);
                    desKey[3] = ((key[2] << 5) & 0xFF) | (key[3] >> 3);
                    desKey[4] = ((key[3] << 4) & 0xFF) | (key[4] >> 4);
                    desKey[5] = ((key[4] << 3) & 0xFF) | (key[5] >> 5);
                    desKey[6] = ((key[5] << 2) & 0xFF) | (key[6] >> 6);
                    desKey[7] = (key[6] << 1) & 0xFF;
                    for (let i = 0; i < 8; i++) {
                        let parity = 0;
                        for (let j = 1; j < 8; j++) {
                            parity += (desKey[i] >> j) % 2;
                        }
                        desKey[i] |= (parity % 2) === 0 ? 1 : 0;
                    }
                    let des = crypto.createCipheriv('DES-ECB', desKey, '');
                    return des.update(message);
                }
                static createNTLMResponse(challenge, ntlmhash) {
                    let buf = Buffer.alloc(24), ntlmBuffer = Buffer.alloc(21).fill(0);
                    ntlmhash.copy(ntlmBuffer);
                    Hash.calculateDES(ntlmBuffer.slice(0, 7), challenge).copy(buf);
                    Hash.calculateDES(ntlmBuffer.slice(7, 14), challenge).copy(buf, 8);
                    Hash.calculateDES(ntlmBuffer.slice(14), challenge).copy(buf, 16);
                    return buf;
                }
                static createNTLMHash(password) {
                    let md4sum = crypto.createHash('md4');
                    md4sum.update(Buffer.from(password, 'ucs2')); // lgtm[js/insufficient-password-hash]
                    return md4sum.digest();
                }
                static createNTLMv2Hash(ntlmhash, username, authTargetName) {
                    let hmac = crypto.createHmac('md5', ntlmhash);
                    hmac.update(Buffer.from(username.toUpperCase() + authTargetName, 'ucs2')); // lgtm[js/weak-cryptographic-algorithm]
                    return hmac.digest();
                }
                static createLMv2Response(type2message, username, authTargetName, ntlmhash, nonce) {
                    let buf = Buffer.alloc(24);
                    let ntlm2hash = Hash.createNTLMv2Hash(ntlmhash, username, authTargetName);
                    let hmac = crypto.createHmac('md5', ntlm2hash);
                    //server challenge
                    type2message.challenge.copy(buf, 8);
                    //client nonce
                    buf.write(nonce, 16, 'hex');
                    //create hash
                    hmac.update(buf.slice(8));
                    let hashedBuffer = hmac.digest();
                    hashedBuffer.copy(buf);
                    return buf;
                }
                static createNTLMv2Response(type2message, username, authTargetName, ntlmhash, nonce, timestamp, withMic) {
                    let bufferSize = 48 + type2message.targetInfo.buffer.length;
                    if (withMic) {
                        bufferSize += 8;
                    }
                    let buf = Buffer.alloc(bufferSize), ntlm2hash = Hash.createNTLMv2Hash(ntlmhash, username, authTargetName), hmac = crypto.createHmac('md5', ntlm2hash);
                    //the first 8 bytes are spare to store the hashed value before the blob
                    //server challenge
                    type2message.challenge.copy(buf, 8);
                    //blob signature
                    buf.writeUInt32BE(0x01010000, 16);
                    //reserved
                    buf.writeUInt32LE(0, 20);
                    //timestamp
                    let timestampLow = Number('0x' + timestamp.substring(Math.max(0, timestamp.length - 8)));
                    let timestampHigh = Number('0x' + timestamp.substring(0, Math.max(0, timestamp.length - 8)));
                    buf.writeUInt32LE(timestampLow, 24);
                    buf.writeUInt32LE(timestampHigh, 28);
                    //random client nonce
                    buf.write(nonce, 32, 'hex');
                    //zero
                    buf.writeUInt32LE(0, 40);
                    //complete target information block from type 2 message
                    type2message.targetInfo.buffer.copy(buf, 44);
                    let bufferPos = 44 + type2message.targetInfo.buffer.length;
                    if (withMic) {
                        // Should include MIC in response, indicate it in AV_FLAGS
                        buf.writeUInt16LE(0x06, bufferPos - 4);
                        buf.writeUInt16LE(0x04, bufferPos - 2);
                        buf.writeUInt32LE(0x02, bufferPos);
                        // Write new endblock
                        buf.writeUInt32LE(0, bufferPos + 4);
                        bufferPos += 8;
                    }
                    //zero
                    buf.writeUInt32LE(0, bufferPos);
                    hmac.update(buf.slice(8));
                    let hashedBuffer = hmac.digest();
                    hashedBuffer.copy(buf);
                    return buf;
                }
                static createMIC(type1message, type2message, type3message, username, authTargetName, ntlmhash, nonce, timestamp) {
                    let ntlm2hash = Hash.createNTLMv2Hash(ntlmhash, username, authTargetName);
                    let ntlm2response = Hash.createNTLMv2Response(type2message, username, authTargetName, ntlmhash, nonce, timestamp, true);
                    let hmac = crypto.createHmac('md5', ntlm2hash);
                    let session_base_key = hmac.update(ntlm2response.slice(0, 16)).digest();
                    let key_exchange_key = session_base_key;
                    //create MIC hash
                    hmac = crypto.createHmac('md5', key_exchange_key);
                    hmac.update(type1message);
                    hmac.update(type2message.raw);
                    hmac.update(type3message);
                    let hashedBuffer = hmac.digest();
                    return hashedBuffer;
                }
                static createRandomSessionKey(type2message, username, authTargetName, ntlmhash, nonce, timestamp, withMic) {
                    let ntlm2hash = Hash.createNTLMv2Hash(ntlmhash, username, authTargetName);
                    let ntlm2response = Hash.createNTLMv2Response(type2message, username, authTargetName, ntlmhash, nonce, timestamp, withMic);
                    let hmac = crypto.createHmac('md5', ntlm2hash);
                    let session_base_key = hmac.update(ntlm2response.slice(0, 16)).digest();
                    let key_exchange_key = session_base_key;
                    let exported_session_key_hex = Hash.createPseudoRandomValue(32);
                    let exported_session_key = Buffer.from(exported_session_key_hex, 'hex');
                    let rc4 = crypto.createCipheriv('rc4', key_exchange_key, '');
                    let encrypted_random_session_key = rc4.update(exported_session_key);
                    return encrypted_random_session_key;
                }
                static createPseudoRandomValue(length) {
                    let str = '';
                    while (str.length < length) {
                        str += Math.floor(Math.random() * 16).toString(16);
                    }
                    return str;
                }
                static createTimestamp() {
                    //TODO: we are loosing precision here since js is not able to handle those large integers
                    // maybe think about a different solution here
                    // 11644473600000 = diff between 1970 and 1601
                    return ((Date.now() + 11644473600000) * 10000).toString(16);
                }
            };
            exports_15("Hash", Hash);
        }
    };
});
System.register("ntlm/ntlm.message", [], function (exports_16, context_16) {
    "use strict";
    var NtlmMessage;
    var __moduleName = context_16 && context_16.id;
    return {
        setters: [],
        execute: function () {
            NtlmMessage = class NtlmMessage {
                constructor(buf) {
                    this.raw = buf;
                }
                header() {
                    return 'NTLM ' + this.raw.toString('base64');
                }
            };
            exports_16("NtlmMessage", NtlmMessage);
        }
    };
});
System.register("ntlm/interfaces/i.ntlm", [], function (exports_17, context_17) {
    "use strict";
    var __moduleName = context_17 && context_17.id;
    return {
        setters: [],
        execute: function () {
        }
    };
});
// All code in this folder is heavily based on the node project ntlm-client.
// https://github.com/clncln1/node-ntlm-client
// ----------------------------------------------------------------------------
// Original license statement:
System.register("ntlm/ntlm", ["ntlm/ntlm.flags", "ntlm/ntlm.constants", "ntlm/hash", "os", "ntlm/type2.message", "ntlm/ntlm.message"], function (exports_18, context_18) {
    // Copyright (c) 2015 Nico Haller
    // Permission is hereby granted, free of charge, to any person obtaining a copy
    // of this software and associated documentation files (the "Software"), to deal
    // in the Software without restriction, including without limitation the rights
    // to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    // copies of the Software, and to permit persons to whom the Software is
    // furnished to do so, subject to the following conditions:
    // The above copyright notice and this permission notice shall be included in
    // all copies or substantial portions of the Software.
    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    // IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    // FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
    // AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    // LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    // OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    // THE SOFTWARE.
    // ----------------------------------------------------------------------------
    'use strict';
    var ntlm_flags_2, ntlm_constants_2, hash_1, os, type2_message_1, ntlm_message_1, Ntlm;
    var __moduleName = context_18 && context_18.id;
    function ntlm() {
        return new Ntlm();
    }
    exports_18("default", ntlm);
    return {
        setters: [
            function (ntlm_flags_2_1) {
                ntlm_flags_2 = ntlm_flags_2_1;
            },
            function (ntlm_constants_2_1) {
                ntlm_constants_2 = ntlm_constants_2_1;
            },
            function (hash_1_1) {
                hash_1 = hash_1_1;
            },
            function (os_1) {
                os = os_1;
            },
            function (type2_message_1_1) {
                type2_message_1 = type2_message_1_1;
            },
            function (ntlm_message_1_1) {
                ntlm_message_1 = ntlm_message_1_1;
            }
        ],
        execute: function () {
            Ntlm = class Ntlm {
                createType1Message(ntlm_version, workstation, target) {
                    let dataPos = 40;
                    let pos = 0;
                    let buf = Buffer.alloc(256);
                    if (target === undefined) {
                        target = '';
                    }
                    if (workstation === undefined) {
                        workstation = os.hostname().toUpperCase();
                    }
                    //signature
                    buf.write(ntlm_constants_2.NtlmConstants.NTLM_SIGNATURE, pos, ntlm_constants_2.NtlmConstants.NTLM_SIGNATURE.length, 'ascii');
                    pos += ntlm_constants_2.NtlmConstants.NTLM_SIGNATURE.length;
                    //message type
                    buf.writeUInt32LE(1, pos);
                    pos += 4;
                    //flags
                    let messageFlags = ntlm_flags_2.NtlmFlags.NEGOTIATE_OEM |
                        ntlm_flags_2.NtlmFlags.NEGOTIATE_ALWAYS_SIGN |
                        ntlm_flags_2.NtlmFlags.NEGOTIATE_VERSION;
                    if (ntlm_version == 1) {
                        messageFlags |= ntlm_flags_2.NtlmFlags.NEGOTIATE_NTLM_KEY |
                            ntlm_flags_2.NtlmFlags.NEGOTIATE_LM_KEY;
                    }
                    else {
                        messageFlags |= ntlm_flags_2.NtlmFlags.NEGOTIATE_NTLM2_KEY;
                    }
                    if (target.length > 0) {
                        messageFlags |= ntlm_flags_2.NtlmFlags.NEGOTIATE_DOMAIN_SUPPLIED;
                    }
                    if (workstation.length > 0) {
                        messageFlags |= ntlm_flags_2.NtlmFlags.NEGOTIATE_WORKSTATION_SUPPLIED;
                    }
                    // special operator to force conversion to unsigned
                    buf.writeUInt32LE(messageFlags >>> 0, pos);
                    pos += 4;
                    //domain security buffer
                    buf.writeUInt16LE(target.length, pos);
                    pos += 2;
                    buf.writeUInt16LE(target.length, pos);
                    pos += 2;
                    buf.writeUInt32LE(dataPos, pos);
                    pos += 4;
                    if (target.length > 0) {
                        dataPos += buf.write(target, dataPos, 'ascii');
                    }
                    //workstation security buffer
                    buf.writeUInt16LE(workstation.length, pos);
                    pos += 2;
                    buf.writeUInt16LE(workstation.length, pos);
                    pos += 2;
                    buf.writeUInt32LE(dataPos, pos);
                    pos += 4;
                    if (workstation.length > 0) {
                        dataPos += buf.write(workstation, dataPos, 'ascii');
                    }
                    this.addVersionStruct(buf, pos);
                    return new ntlm_message_1.NtlmMessage(buf.slice(0, dataPos));
                }
                // Version - hard-coded to
                // Major version 10, minor version 0 (Windows 10)
                // build number 18362 (1903 update), NTLM revision 15
                addVersionStruct(buf, pos) {
                    buf.writeUInt8(10, pos);
                    pos++;
                    buf.writeUInt8(0, pos);
                    pos++;
                    buf.writeUInt16LE(18362, pos);
                    pos += 2;
                    buf.writeUInt32LE(0x0F000000, pos);
                    pos += 4;
                    return pos;
                }
                decodeType2Message(str) {
                    if (str === undefined) {
                        throw new Error('Invalid argument');
                    }
                    let ntlmMatch = /^NTLM ([^,\s]+)/.exec(str);
                    if (ntlmMatch) {
                        str = ntlmMatch[1];
                    }
                    let buf = Buffer.from(str, 'base64');
                    let type2message = new type2_message_1.Type2Message(buf);
                    return type2message;
                }
                createType3Message(type1message, type2message, username, password, workstation, target, client_nonce_override, timestamp_override) {
                    let dataPos = 72;
                    let buf = Buffer.alloc(1024);
                    if (workstation === undefined) {
                        workstation = os.hostname().toUpperCase();
                    }
                    if (target === undefined) {
                        target = type2message.targetName;
                    }
                    //signature
                    buf.write(ntlm_constants_2.NtlmConstants.NTLM_SIGNATURE, 0, ntlm_constants_2.NtlmConstants.NTLM_SIGNATURE.length, 'ascii');
                    //message type
                    buf.writeUInt32LE(3, 8);
                    let targetLen = type2message.encoding === 'ascii' ? target.length : target.length * 2;
                    let usernameLen = type2message.encoding === 'ascii' ? username.length : username.length * 2;
                    let workstationLen = type2message.encoding === 'ascii' ? workstation.length : workstation.length * 2;
                    let dataPosOffset = targetLen + usernameLen + workstationLen;
                    let timestamp = '';
                    let client_nonce = '';
                    let withMic = false;
                    let withServerTimestamp = false;
                    if (type2message.version === 2 &&
                        type2message.targetInfo &&
                        type2message.targetInfo.parsed['SERVER_TIMESTAMP']) { // Must include MIC, add room for it
                        withServerTimestamp = true;
                        withMic = true;
                        dataPos += 16;
                    }
                    let hashDataPos = dataPos + dataPosOffset;
                    let ntlmHash = hash_1.Hash.createNTLMHash(password);
                    if (type2message.version === 2) {
                        client_nonce = client_nonce_override || hash_1.Hash.createPseudoRandomValue(16);
                        if (withServerTimestamp) { // Use server timestamp if provided
                            timestamp = type2message.targetInfo.parsed['SERVER_TIMESTAMP'];
                        }
                        else {
                            timestamp = timestamp_override || hash_1.Hash.createTimestamp();
                        }
                        let lmv2;
                        if (withServerTimestamp) {
                            lmv2 = Buffer.alloc(24); // zero-filled
                        }
                        else {
                            lmv2 = hash_1.Hash.createLMv2Response(type2message, username, target, ntlmHash, client_nonce);
                        }
                        //lmv2 security buffer
                        buf.writeUInt16LE(lmv2.length, 12);
                        buf.writeUInt16LE(lmv2.length, 14);
                        buf.writeUInt32LE(hashDataPos, 16);
                        lmv2.copy(buf, hashDataPos);
                        hashDataPos += lmv2.length;
                        let ntlmv2 = hash_1.Hash.createNTLMv2Response(type2message, username, target, ntlmHash, client_nonce, timestamp, withMic);
                        //ntlmv2 security buffer
                        buf.writeUInt16LE(ntlmv2.length, 20);
                        buf.writeUInt16LE(ntlmv2.length, 22);
                        buf.writeUInt32LE(hashDataPos, 24);
                        ntlmv2.copy(buf, hashDataPos);
                        hashDataPos += ntlmv2.length;
                    }
                    else {
                        let lmHash = hash_1.Hash.createLMHash(password);
                        let lm = hash_1.Hash.createLMResponse(type2message.challenge, lmHash);
                        let ntlm = hash_1.Hash.createNTLMResponse(type2message.challenge, ntlmHash);
                        //lm security buffer
                        buf.writeUInt16LE(lm.length, 12);
                        buf.writeUInt16LE(lm.length, 14);
                        buf.writeUInt32LE(hashDataPos, 16);
                        lm.copy(buf, hashDataPos);
                        hashDataPos += lm.length;
                        //ntlm security buffer
                        buf.writeUInt16LE(ntlm.length, 20);
                        buf.writeUInt16LE(ntlm.length, 22);
                        buf.writeUInt32LE(hashDataPos, 24);
                        ntlm.copy(buf, hashDataPos);
                        hashDataPos += ntlm.length;
                    }
                    //target name security buffer
                    buf.writeUInt16LE(targetLen, 28);
                    buf.writeUInt16LE(targetLen, 30);
                    buf.writeUInt32LE(dataPos, 32);
                    dataPos += buf.write(target, dataPos, type2message.encoding);
                    //user name security buffer
                    buf.writeUInt16LE(usernameLen, 36);
                    buf.writeUInt16LE(usernameLen, 38);
                    buf.writeUInt32LE(dataPos, 40);
                    dataPos += buf.write(username, dataPos, type2message.encoding);
                    //workstation name security buffer
                    buf.writeUInt16LE(workstationLen, 44);
                    buf.writeUInt16LE(workstationLen, 46);
                    buf.writeUInt32LE(dataPos, 48);
                    dataPos += buf.write(workstation, dataPos, type2message.encoding);
                    //session key security buffer
                    let session_key = Buffer.alloc(0);
                    // if (type2message.flags & NtlmFlags.NEGOTIATE_KEY_EXCHANGE) {
                    //   session_key = hash.createRandomSessionKey(type2message, username, target, ntlmHash, client_nonce, timestamp, withMic);
                    // }
                    buf.writeUInt16LE(session_key.length, 52);
                    buf.writeUInt16LE(session_key.length, 54);
                    buf.writeUInt32LE(hashDataPos, 56);
                    session_key.copy(buf, hashDataPos);
                    hashDataPos += session_key.length;
                    //flags
                    buf.writeUInt32LE(type2message.flags, 60);
                    this.addVersionStruct(buf, 64);
                    if (withMic) {
                        // Calculate and add MIC
                        let mic = hash_1.Hash.createMIC(type1message.raw, type2message, buf.slice(0, hashDataPos), username, target, ntlmHash, client_nonce, timestamp);
                        mic.copy(buf, 72);
                    }
                    return new ntlm_message_1.NtlmMessage(buf.slice(0, hashDataPos));
                    //return 'NTLM ' + buf.toString('base64', 0, hashDataPos);
                }
            };
            exports_18("Ntlm", Ntlm);
        }
    };
});
System.register("tests/dynamicsMetadataTests", ["Dynamics/DynamicsMetadata"], function (exports_19, context_19) {
    "use strict";
    var DynamicsMetadata_1;
    var __moduleName = context_19 && context_19.id;
    function dynamicsMetadataRetrieveAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const meta = DynamicsMetadata_1.default();
            const entities = yield meta.entities();
            const findAccount = entities.filter(e => e.LogicalName === 'account')[0];
            const accountEntity = yield meta.entity('account');
            const matchingAccount = findAccount.DisplayName === accountEntity.DisplayName;
            if (!matchingAccount) {
                throw new Error('Account metadata was not found!');
            }
            const attributes = yield meta.attributes('account');
            const findAccountName = attributes.filter(a => a.LogicalName === 'name')[0];
            if (!findAccountName) {
                throw new Error('Account name attribute was not found!');
            }
        });
    }
    exports_19("dynamicsMetadataRetrieveAll", dynamicsMetadataRetrieveAll);
    return {
        setters: [
            function (DynamicsMetadata_1_1) {
                DynamicsMetadata_1 = DynamicsMetadata_1_1;
            }
        ],
        execute: function () {
        }
    };
});
System.register("tests/dynamicsTests", ["Dynamics/Dynamics", "Query/Query", "Dynamics/DynamicsRequest"], function (exports_20, context_20) {
    "use strict";
    var Dynamics_3, Query_5, DynamicsRequest_5;
    var __moduleName = context_20 && context_20.id;
    function dynamicsTestAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const options = new DynamicsRequest_5.ConnectionOptions();
            options.authType = DynamicsRequest_5.AuthenticationType.Windows;
            options.username = "Administrator";
            options.domain = "CONTOSO";
            options.password = "{password}";
            options.serverUrl = "http://{server}/{org}/";
            options.webApiVersion = "v9.0";
            const dyn = Dynamics_3.default(options);
            /* Batch Request */
            const allAccounts = yield dyn.batch()
                .requestAllUrls(['/api/data/v9.1/accounts'])
                .execute();
            if (allAccounts.length == 0) {
                throw new Error('No Accounts found!');
            }
            /* Create Entity */
            const id = yield dyn.save('accounts', { name: 'xrmtest1' });
            if (!id) {
                throw new Error('Account could not be created!');
            }
            /* Update Entity */
            const uid = yield dyn.save('accounts', { name: 'xrmtest2' }, id);
            if (id !== uid) {
                throw new Error('Account could not be updated!');
            }
            /* Fetch Query */
            const xrmAccount = yield dyn.fetch(dyn.query('account', 'accounts')
                .where('name', Query_5.QueryOperator.StartsWith, 'xrm')
                .orderBy('name')
                .select('name'))[0];
            if (!xrmAccount) {
                throw new Error('Account could not be found!');
            }
            /* Optionset Items */
            const statusOptions = yield dyn.optionset('account', 'statuscode');
            if (statusOptions.length == 0) {
                throw new Error('Optionset items could not be found!');
            }
        });
    }
    exports_20("dynamicsTestAll", dynamicsTestAll);
    return {
        setters: [
            function (Dynamics_3_1) {
                Dynamics_3 = Dynamics_3_1;
            },
            function (Query_5_1) {
                Query_5 = Query_5_1;
            },
            function (DynamicsRequest_5_1) {
                DynamicsRequest_5 = DynamicsRequest_5_1;
            }
        ],
        execute: function () {
        }
    };
});
System.register("tests/queryTests", ["Query/Query", "Query/QueryXml"], function (exports_21, context_21) {
    "use strict";
    var Query_6, QueryXml_3;
    var __moduleName = context_21 && context_21.id;
    function createQueryWithAllExpressions() {
        const thisQuery = Query_6.default('account');
        thisQuery
            .select('accountid', 'name')
            .alias('accountid', 'Id')
            .orderBy('name')
            .orderBy('accountid', true)
            .path('accounts')
            .where('name', Query_6.QueryOperator.Contains, 'abc')
            .where('accountnumber', Query_6.QueryOperator.In, 1, 2, 3, 4)
            .whereAny(or => {
            or('name', Query_6.QueryOperator.Equals, 'a');
            or('name', Query_6.QueryOperator.Equals, 'b');
            or('name', Query_6.QueryOperator.Equals, 'c');
        })
            .join('contact', 'customerid');
        const fetchXml = QueryXml_3.default(thisQuery, 999, true);
        if (!fetchXml) {
            throw new Error('QueryXml could not be generated!');
        }
    }
    exports_21("createQueryWithAllExpressions", createQueryWithAllExpressions);
    return {
        setters: [
            function (Query_6_1) {
                Query_6 = Query_6_1;
            },
            function (QueryXml_3_1) {
                QueryXml_3 = QueryXml_3_1;
            }
        ],
        execute: function () {
        }
    };
});
//# sourceMappingURL=more-xrm.js.map