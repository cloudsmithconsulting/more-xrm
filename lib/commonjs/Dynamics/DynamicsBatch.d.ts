import { Query } from "../Query/Query";
import { ConnectionOptions } from "./DynamicsRequest";
export interface DynamicsBatch {
    execute(): Promise<any[] | undefined>;
    request(query: Query, maxRowCount?: number): DynamicsBatch;
    requestAll(queries: Query[]): DynamicsBatch;
    requestAllUrls(urls: string[]): DynamicsBatch;
    saveEntity(entitySetName: string, data: any, id?: string): DynamicsBatch & {
        createRelatedEntity(entitySetName: string, data: any, navigationPropertyName: string): void;
    };
}
export declare function dynamicsBatch(connectionOptions: ConnectionOptions, headers?: any): DynamicsBatch;
export declare function dynamicsBatchRequest<T = any>(connectionOptions: ConnectionOptions, ...url: string[]): Promise<T[] | undefined>;
export declare function dynamicsBatchQuery<T = any>(connectionOptions: ConnectionOptions, ...query: Query[]): Promise<T[] | undefined>;
