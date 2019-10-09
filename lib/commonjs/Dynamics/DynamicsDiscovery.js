"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DynamicsRequest_1 = require("./DynamicsRequest");
exports.DefaultDiscoveryApiVersion = 'v9.1';
function dynamicsDiscovery(connectionOptions) {
    return new DynamicsDiscoveryClient(connectionOptions);
}
exports.default = dynamicsDiscovery;
class DynamicsDiscoveryClient {
    constructor(options) {
        if (options) {
            this.connectionOptions = options;
            if (!options.webApiVersion) {
                this.connectionOptions.webApiVersion = exports.DefaultDiscoveryApiVersion;
            }
        }
    }
    discover() {
        return DynamicsRequest_1.dynamicsRequest(this.connectionOptions, `/api/discovery/${this.connectionOptions.webApiVersion}/Instances`, this.dynamicsHeaders);
    }
}
//# sourceMappingURL=DynamicsDiscovery.js.map