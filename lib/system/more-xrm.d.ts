/// <reference types="node" />
declare module "Query/Query" {
    export interface DataQuery {
        Alias: any;
        EntityName: string;
        EntityPath?: string;
        Attributes: Set<string>;
        OrderBy: Set<string>;
        Conditions: (DataQueryCondition | DataQueryCondition[])[];
        Joins: DataQueryJoin[];
    }
    export interface DataQueryCondition {
        AttributeName: string;
        Operator: QueryOperator;
        Values: any[];
    }
    export interface DataQueryJoin extends DataQuery {
        JoinAlias?: string;
        JoinFromAttributeName?: string;
        JoinToAttributeName?: string;
        IsOuterJoin?: boolean;
    }
    export interface Query {
        [key: string]: any;
        alias(attributeName: string, alias: string): Query;
        path(entityPath: string): Query;
        select(...attributeNames: string[]): Query;
        where(attributeName: string, operator: QueryOperatorParam, ...values: any[]): Query;
        whereAny(any: (or: (attributeName: string, operator: QueryOperatorParam, ...values: any[]) => void) => void): Query;
        orderBy(attributeName: string, isDescendingOrder?: boolean): Query;
        join(entityName: string, fromAttribute: string, toAttribute?: string, alias?: string, isOuterJoin?: boolean): Query;
        Query: DataQuery;
    }
    export type QueryOperatorParam = QueryOperator | QueryOperatorExpression;
    export enum QueryOperator {
        Contains = "like",
        NotContains = "not-like",
        StartsWith = "begins-with",
        Equals = "eq",
        NotEquals = "neq",
        GreaterThan = "gt",
        LessThan = "lt",
        In = "in",
        NotIn = "not-in",
        OnOrBefore = "on-or-before",
        OnOrAfter = "on-or-after",
        Null = "null",
        NotNull = "not-null",
        IsCurrentUser = "eq-userid",
        IsNotCurrentUser = "ne-userid",
        IsCurrentUserTeam = "eq-userteams"
    }
    export type QueryOperatorExpression = 'like' | 'not-like' | 'begins-with' | 'eq' | 'neq' | 'gt' | 'lt' | 'in' | 'not-in' | 'on-or-before' | 'on-or-after' | 'null' | 'not-null' | 'eq-userid' | 'ne-userid' | 'eq-userteams';
    export default function query(entityName: string, ...attributeNames: string[]): Query;
    export function GetRootQuery(query: Query): DataQuery;
}
declare module "Query/QueryXml" {
    import { Query } from "Query/Query";
    export default function GetQueryXml(query: Query, maxRowCount?: number, format?: boolean): any;
}
declare module "Dynamics/DynamicsRequest" {
    import { Query } from "Query/Query";
    export enum AuthenticationType {
        Windows = 1,
        OAuth = 2
    }
    export class ConnectionOptions {
        authType: AuthenticationType;
        username?: string;
        password?: string;
        domain?: string;
        workstation?: string;
        accessToken?: string;
        serverUrl: string;
        webApiVersion: string;
    }
    export function dynamicsQuery<T>(connectionOptions: ConnectionOptions, query: Query, maxRowCount?: number, headers?: any): Promise<T[]>;
    export function dynamicsQueryUrl<T>(connectionOptions: ConnectionOptions, dynamicsEntitySetUrl: string, query: Query, maxRowCount?: number, headers?: any): Promise<T[]>;
    export function dynamicsRequest<T>(connectionOptions: ConnectionOptions, dynamicsEntitySetUrl: string, headers?: any): Promise<T>;
    export function dynamicsSave(connectionOptions: ConnectionOptions, entitySetName: string, data: any, id?: string, headers?: any): Promise<string>;
    export function formatDynamicsResponse(data: any): any;
}
declare module "Dynamics/DynamicsBatch" {
    import { Query } from "Query/Query";
    import { ConnectionOptions } from "Dynamics/DynamicsRequest";
    export interface DynamicsBatch {
        execute(): Promise<any[] | undefined>;
        request(query: Query, maxRowCount?: number): DynamicsBatch;
        requestAll(queries: Query[]): DynamicsBatch;
        requestAllUrls(urls: string[]): DynamicsBatch;
        saveEntity(entitySetName: string, data: any, id?: string): DynamicsBatch & {
            createRelatedEntity(entitySetName: string, data: any, navigationPropertyName: string): void;
        };
    }
    export function dynamicsBatch(connectionOptions: ConnectionOptions, headers?: any): DynamicsBatch;
    export function dynamicsBatchRequest<T = any>(connectionOptions: ConnectionOptions, ...url: string[]): Promise<T[] | undefined>;
    export function dynamicsBatchQuery<T = any>(connectionOptions: ConnectionOptions, ...query: Query[]): Promise<T[] | undefined>;
}
declare module "Dynamics/Dynamics" {
    import { Query } from "Query/Query";
    import { DynamicsBatch } from "Dynamics/DynamicsBatch";
    import { ConnectionOptions } from "Dynamics/DynamicsRequest";
    export const DefaultWebApiVersion = "v9.1";
    export const DefaultMaxRecords = 100;
    export const DynamicsHeaders: {
        'OData-MaxVersion': string;
        'OData-Version': string;
        'Prefer': string;
    };
    export interface Dynamics {
        batch(): DynamicsBatch;
        fetch<T>(query: Query, maxRowCount?: number): Promise<T[]>;
        optionset(entityName: any, attributeName: any): Promise<{
            label: string;
            value: number;
        }[]>;
        query(entityLogicalName: string, entitySetName: string): Query;
        save(entitySetName: string, data: any, id?: string): Promise<string>;
    }
    export default function dynamics(connectionOptions?: ConnectionOptions): Dynamics;
}
declare module "Dynamics/Model/OrganizationMetadata" {
    export interface OrganizationMetadata {
        Id?: string;
        UniqueName?: string;
        UrlName?: string;
        FriendlyName?: string;
        State?: number;
        Version?: string;
        Uri?: string;
        AppUri?: string;
        LastUpdated?: Date;
    }
}
declare module "Dynamics/DynamicsDiscovery" {
    import { ConnectionOptions } from "Dynamics/DynamicsRequest";
    import { OrganizationMetadata } from "Dynamics/Model/OrganizationMetadata";
    export type OrganizationMetadata = OrganizationMetadata;
    export const DefaultDiscoveryApiVersion = "v9.1";
    export default function dynamicsDiscovery(connectionOptions?: ConnectionOptions): DynamicsDiscovery;
    export interface DynamicsDiscovery {
        discover(): Promise<OrganizationMetadata[]>;
    }
}
declare module "Dynamics/Model/EntityMetadata" {
    export interface EntityMetadata {
        Description?: string;
        DisplayName: string;
        EntitySetName: string;
        IconSmallName?: string;
        IsActivity?: boolean;
        IsCustomEntity?: boolean;
        LogicalName: string;
        PrimaryIdAttribute: string;
        PrimaryNameAttribute: string;
    }
}
declare module "Dynamics/Model/AttributeMetadata" {
    import { EntityMetadata } from "Dynamics/Model/EntityMetadata";
    export interface EntityAttributeMetadata extends EntityMetadata {
        Attributes: AttributeMetadata[];
    }
    export interface LookupAttributeMetadata extends AttributeMetadata {
        LookupAttributes?: AttributeMetadata[];
        LookupEntityName?: string;
        LookupSchemaName?: string;
    }
    export interface AttributeMetadata {
        LogicalName: string;
        DisplayName: string;
        Type: AttributeTypeCode;
        IsCustomAttribute?: boolean;
    }
    export type AttributeTypeCode = 'BigInt' | 'Boolean' | 'Customer' | 'DateTime' | 'Decimal' | 'Double' | 'Integer' | 'Lookup' | 'Memo' | 'Money' | 'PartyList' | 'Picklist' | 'State' | 'Status' | 'String';
    export const AttributeTypeCodes: string[];
}
declare module "Dynamics/Model/OptionSetMetadata" {
    import { AttributeMetadata } from "Dynamics/Model/AttributeMetadata";
    export interface OptionSetAttributeMetadata extends AttributeMetadata {
        PicklistOptions?: OptionSetMetadata[];
    }
    export interface OptionSetMetadata {
        Label: string;
        Value: number;
    }
}
declare module "Dynamics/DynamicsMetadata" {
    import { ConnectionOptions } from "Dynamics/DynamicsRequest";
    import { AttributeMetadata, EntityAttributeMetadata, LookupAttributeMetadata } from "Dynamics/Model/AttributeMetadata";
    import { EntityMetadata } from "Dynamics/Model/EntityMetadata";
    import { OptionSetAttributeMetadata, OptionSetMetadata } from "Dynamics/Model/OptionSetMetadata";
    export type DynamicsEntityMetadata = EntityAttributeMetadata;
    export type DynamicsAttributeMetadata = AnyAttributeMetadata;
    export type DynamicsOptionSetMetadata = OptionSetMetadata;
    export type DynamicsLookupAttributeMetadata = LookupAttributeMetadata;
    export type DynamicsOptionSetAttributeMetadata = OptionSetAttributeMetadata;
    export default function dynamicsmetdata(connectionOptions?: ConnectionOptions): DynamicsMetadata;
    export function isLookupAttribute(attribute: DynamicsAttributeMetadata): attribute is DynamicsLookupAttributeMetadata;
    export function isOptionSetAttribute(attribute: DynamicsAttributeMetadata): attribute is DynamicsOptionSetAttributeMetadata;
    export interface DynamicsMetadata {
        attributes(entityName: string): Promise<AttributeMetadata[]>;
        entities(): Promise<EntityMetadata[]>;
        entity(entityName: string): Promise<EntityAttributeMetadata>;
        entityAttributes(...entityNames: string[]): Promise<EntityAttributeMetadata[]>;
    }
    type AnyAttributeMetadata = AttributeMetadata | LookupAttributeMetadata | OptionSetAttributeMetadata;
}
declare module "ntlm/ntlm.flags" {
    export enum NtlmFlags {
        NEGOTIATE_UNICODE = 1,
        NEGOTIATE_OEM = 2,
        REQUEST_TARGET = 4,
        NEGOTIATE_SIGN = 16,
        NEGOTIATE_SEAL = 32,
        NEGOTIATE_DATAGRAM_STYLE = 64,
        NEGOTIATE_LM_KEY = 128,
        NEGOTIATE_NETWARE = 256,
        NEGOTIATE_NTLM_KEY = 512,
        NEGOTIATE_ANONYMOUS = 2048,
        NEGOTIATE_DOMAIN_SUPPLIED = 4096,
        NEGOTIATE_WORKSTATION_SUPPLIED = 8192,
        NEGOTIATE_LOCAL_CALL = 16384,
        NEGOTIATE_ALWAYS_SIGN = 32768,
        TARGET_TYPE_DOMAIN = 65536,
        TARGET_TYPE_SERVER = 131072,
        TARGET_TYPE_SHARE = 262144,
        NEGOTIATE_NTLM2_KEY = 524288,
        REQUEST_INIT_RESPONSE = 1048576,
        REQUEST_ACCEPT_RESPONSE = 2097152,
        REQUEST_NONNT_SESSION_KEY = 4194304,
        NEGOTIATE_TARGET_INFO = 8388608,
        NEGOTIATE_VERSION = 33554432,
        NEGOTIATE_128 = 536870912,
        NEGOTIATE_KEY_EXCHANGE = 1073741824,
        NEGOTIATE_56 = -2147483648
    }
}
declare module "ntlm/ntlm.constants" {
    export class NtlmConstants {
        static readonly NTLM_SIGNATURE = "NTLMSSP\0";
    }
}
declare module "ntlm/type2.message" {
    export class Type2Message {
        raw: Buffer;
        flags: number;
        encoding: 'ascii' | 'ucs2';
        version: number;
        challenge: Buffer;
        targetName: string;
        targetInfo: any;
        constructor(buf: Buffer);
        private readTargetName;
        private parseTargetInfo;
    }
}
declare module "ntlm/hash" {
    import { Type2Message } from "ntlm/type2.message";
    export class Hash {
        static createLMResponse(challenge: Buffer, lmhash: Buffer): Buffer;
        static createLMHash(password: string): Buffer;
        static calculateDES(key: Buffer, message: Buffer): Buffer;
        static createNTLMResponse(challenge: Buffer, ntlmhash: Buffer): Buffer;
        static createNTLMHash(password: string): Buffer;
        static createNTLMv2Hash(ntlmhash: Buffer, username: string, authTargetName: string): Buffer;
        static createLMv2Response(type2message: Type2Message, username: string, authTargetName: string, ntlmhash: Buffer, nonce: string): Buffer;
        static createNTLMv2Response(type2message: Type2Message, username: string, authTargetName: string, ntlmhash: Buffer, nonce: string, timestamp: string, withMic: boolean): Buffer;
        static createMIC(type1message: Buffer, type2message: Type2Message, type3message: Buffer, username: string, authTargetName: string, ntlmhash: Buffer, nonce: string, timestamp: string): Buffer;
        static createRandomSessionKey(type2message: Type2Message, username: string, authTargetName: string, ntlmhash: Buffer, nonce: string, timestamp: string, withMic: boolean): Buffer;
        static createPseudoRandomValue(length: number): string;
        static createTimestamp(): string;
    }
}
declare module "ntlm/ntlm.message" {
    export class NtlmMessage {
        raw: Buffer;
        constructor(buf: Buffer);
        header(): string;
    }
}
declare module "ntlm/interfaces/i.ntlm" {
    import { Type2Message } from "ntlm/type2.message";
    import { NtlmMessage } from "ntlm/ntlm.message";
    export interface INtlm {
        createType1Message(ntlm_version: number, workstation: string | undefined, target: string | undefined): NtlmMessage;
        decodeType2Message(str: string | undefined): Type2Message;
        createType3Message(type1message: NtlmMessage, type2Message: Type2Message, username: string, password: string, workstation: string | undefined, target: string | undefined, client_nonce: string | undefined, timestamp: string | undefined): NtlmMessage;
    }
}
declare module "ntlm/ntlm" {
    import { INtlm } from "ntlm/interfaces/i.ntlm";
    import { Type2Message } from "ntlm/type2.message";
    import { NtlmMessage } from "ntlm/ntlm.message";
    export default function ntlm(): INtlm;
    export class Ntlm implements INtlm {
        createType1Message(ntlm_version: number, workstation: string | undefined, target: string | undefined): NtlmMessage;
        private addVersionStruct;
        decodeType2Message(str: string | undefined): Type2Message;
        createType3Message(type1message: NtlmMessage, type2message: Type2Message, username: string, password: string, workstation: string | undefined, target: string | undefined, client_nonce_override: string | undefined, timestamp_override: string | undefined): NtlmMessage;
    }
}
declare module "tests/dynamicsMetadataTests" {
    export function dynamicsMetadataRetrieveAll(): Promise<void>;
}
declare module "tests/dynamicsTests" {
    export function dynamicsTestAll(): Promise<void>;
}
declare module "tests/queryTests" {
    export function createQueryWithAllExpressions(): void;
}
