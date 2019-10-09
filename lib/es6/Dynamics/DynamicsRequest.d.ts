import { Query } from "../Query/Query";
export declare enum AuthenticationType {
    Windows = 1,
    OAuth = 2
}
export declare class ConnectionOptions {
    authType: AuthenticationType;
    username?: string;
    password?: string;
    domain?: string;
    workstation?: string;
    accessToken?: string;
    serverUrl: string;
    webApiVersion: string;
}
export declare function dynamicsQuery<T>(connectionOptions: ConnectionOptions, query: Query, maxRowCount?: number, headers?: any): Promise<T[]>;
export declare function dynamicsQueryUrl<T>(connectionOptions: ConnectionOptions, dynamicsEntitySetUrl: string, query: Query, maxRowCount?: number, headers?: any): Promise<T[]>;
export declare function dynamicsRequest<T>(connectionOptions: ConnectionOptions, dynamicsEntitySetUrl: string, headers?: any): Promise<T>;
export declare function dynamicsSave(connectionOptions: ConnectionOptions, entitySetName: string, data: any, id?: string, headers?: any): Promise<string>;
export declare function formatDynamicsResponse(data: any): any;
