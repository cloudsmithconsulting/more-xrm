import { GetRootQuery, Query } from "../Query/Query";
import GetQueryXml from "../Query/QueryXml";
import { DynamicsHeaders, WebApiVersion } from "./Dynamics";
import { Ntlm } from "../ntlm/ntlm";
import { NtlmMessage } from "../ntlm/ntlm.message";

export enum AuthenticationType
{
    Windows = 1,
    OAuth = 2
}

export class AuthenticationOptions {
    authType: AuthenticationType;
    username?: string = "";
    password?: string = "";
    domain?: string = "";
    workstation?: string = "";
    accessToken?: string = "";
};

function getAuthHeader() {
    
}

export function authenticate(url:string, authenticationOptions: AuthenticationOptions): NtlmMessage
{
    let ntlm = new Ntlm();
    const type1Message = ntlm.createType1Message(2, authenticationOptions.workstation, url);

    fetch(url, {
        headers: {
          Connection: 'keep-alive',
          Authorization: type1Message.header(),
        }
      })
      .then(response => response.headers.get('www-authenticate'))
      .then((auth) => {
        if (!auth) {
          throw new Error('Stage 1 NTLM handshake failed.');
        }
      
        const type2Message = ntlm.decodeType2Message(auth);

        return ntlm.createType3Message(type1Message, type2Message, authenticationOptions.username, authenticationOptions.password, authenticationOptions.workstation, url, undefined, undefined);
      });

    return null;
}

export function dynamicsQuery<T>(query: Query, maxRowCount?: number, headers?: any): Promise<T[]> {
    const dataQuery = GetRootQuery(query);
    if (!dataQuery.EntityPath) {
        throw new Error('dynamicsQuery requires a Query object with an EntityPath');
    }
    return dynamicsQueryUrl<T>(`/api/data/${WebApiVersion}/${dataQuery.EntityPath}`, query, maxRowCount, headers);
}

export function dynamicsQueryUrl<T>(dynamicsEntitySetUrl: string, query: Query, maxRowCount?: number, headers?: any): Promise<T[]> {
    const querySeparator = (dynamicsEntitySetUrl.indexOf('?') > -1 ? '&' : '?');
    return request<T[]>(`${dynamicsEntitySetUrl}${querySeparator}fetchXml=${escape(GetQueryXml(query, maxRowCount))}`, 'GET', undefined, headers);
}

export function dynamicsRequest<T>(dynamicsEntitySetUrl: string, headers?: any): Promise<T> {
    return request<T>(dynamicsEntitySetUrl, 'GET', undefined, headers);
}

export function dynamicsSave(entitySetName: string, data: any, id?: string, headers?: any): Promise<string> {
    if (id) {
        return request(`/api/data/${WebApiVersion}/${entitySetName}(${trimId(id)})`, 'PATCH', data, headers);
    }
    else {
        return request(`/api/data/${WebApiVersion}/${entitySetName}()`, 'POST', data, headers);
    }
}

export function formatDynamicsResponse(data) {
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
            var row = {};
            for (var key in item) {
                var name: string = key;

                if (name.indexOf('@odata') == 0) {
                    continue;
                }

                if (name.indexOf('transactioncurrencyid') > -1) {
                    continue;
                }

                if (name.indexOf('@') > -1) {
                    name = name.substring(0, name.indexOf('@'))
                    if (name.indexOf('_') == 0) {
                        name = name.slice(1, -6);
                    }
                    name += "_formatted";
                }
                else if (name.indexOf('_') == 0) {
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

function request<T>(url: string, method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', body?: any, headers?: any): Promise<T> {
    return fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            ...DynamicsHeaders,
            ...headers
        },
        body: body
    })
        .then(response => response.json())
        .then(data => formatDynamicsResponse(data));
}

function trimId(id: string) {
    return (id || '').replace(/{|}/g, '');
}