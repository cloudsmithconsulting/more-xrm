"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Query_1 = require("../Query/Query");
const DynamicsBatch_1 = require("./DynamicsBatch");
const DynamicsRequest_1 = require("./DynamicsRequest");
exports.DefaultWebApiVersion = 'v9.1';
exports.DefaultMaxRecords = 100;
exports.DynamicsHeaders = {
    'OData-MaxVersion': '4.0',
    'OData-Version': '4.0',
    'Prefer': 'odata.include-annotations=OData.Community.Display.V1.FormattedValue'
};
function dynamics(connectionOptions) {
    return new DynamicsClient(connectionOptions);
}
exports.default = dynamics;
class DynamicsClient {
    constructor(options) {
        if (options) {
            this.connectionOptions = options;
        }
    }
    batch() {
        return DynamicsBatch_1.dynamicsBatch(this.connectionOptions, this.dynamicsHeaders);
    }
    fetch(query, maxRowCount = exports.DefaultMaxRecords) {
        return DynamicsRequest_1.dynamicsQuery(this.connectionOptions, query, maxRowCount, this.dynamicsHeaders);
    }
    optionset(entityName, attributeName) {
        return DynamicsRequest_1.dynamicsRequest(this.connectionOptions, `/api/data/${this.connectionOptions.webApiVersion}/EntityDefinitions(LogicalName='${entityName}')/Attributes(LogicalName='${attributeName}')/Microsoft.Dynamics.CRM.PicklistAttributeMetadata?$select=LogicalName&$expand=OptionSet($select=Options),GlobalOptionSet($select=Options)`, this.dynamicsHeaders)
            .then(attribute => (attribute.OptionSet || attribute.GlobalOptionSet).Options.map((option) => ({
            label: (option.Label && option.Label.UserLocalizedLabel && option.Label.UserLocalizedLabel.Label),
            value: option.Value
        })));
    }
    query(entityLogicalName, entitySetName) {
        return Query_1.default(entityLogicalName).path(entitySetName);
    }
    save(entitySetName, data, id) {
        return DynamicsRequest_1.dynamicsSave(this.connectionOptions, entitySetName, data, id, this.dynamicsHeaders);
    }
}
//# sourceMappingURL=Dynamics.js.map