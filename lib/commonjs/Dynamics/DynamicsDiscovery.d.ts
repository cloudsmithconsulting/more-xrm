import { ConnectionOptions } from "./DynamicsRequest";
import { OrganizationMetadata } from "./Model/OrganizationMetadata";
export declare type OrganizationMetadata = OrganizationMetadata;
export declare const DefaultDiscoveryApiVersion = "v9.1";
export default function dynamicsDiscovery(connectionOptions?: ConnectionOptions): DynamicsDiscovery;
export interface DynamicsDiscovery {
    discover(): Promise<OrganizationMetadata[]>;
}
