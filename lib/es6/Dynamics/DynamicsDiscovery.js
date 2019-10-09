import { dynamicsRequest } from "./DynamicsRequest";
export const DefaultDiscoveryApiVersion = 'v9.1';
export default function dynamicsDiscovery(connectionOptions) {
    return new DynamicsDiscoveryClient(connectionOptions);
}
class DynamicsDiscoveryClient {
    constructor(options) {
        if (options) {
            this.connectionOptions = options;
            if (!options.webApiVersion) {
                this.connectionOptions.webApiVersion = DefaultDiscoveryApiVersion;
            }
        }
    }
    discover() {
        return dynamicsRequest(this.connectionOptions, `/api/discovery/${this.connectionOptions.webApiVersion}/Instances`, this.dynamicsHeaders);
    }
}
//# sourceMappingURL=DynamicsDiscovery.js.map