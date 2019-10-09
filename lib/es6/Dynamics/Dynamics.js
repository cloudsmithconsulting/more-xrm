import query from "../Query/Query";
import { dynamicsBatch } from "./DynamicsBatch";
import { dynamicsQuery, dynamicsRequest, dynamicsSave } from "./DynamicsRequest";
export const DefaultWebApiVersion = 'v9.1';
export const DefaultMaxRecords = 100;
export const DynamicsHeaders = {
    'OData-MaxVersion': '4.0',
    'OData-Version': '4.0',
    'Prefer': 'odata.include-annotations=OData.Community.Display.V1.FormattedValue'
};
export default function dynamics(connectionOptions) {
    return new DynamicsClient(connectionOptions);
}
class DynamicsClient {
    constructor(options) {
        if (options) {
            this.connectionOptions = options;
        }
    }
    batch() {
        return dynamicsBatch(this.connectionOptions, this.dynamicsHeaders);
    }
    fetch(query, maxRowCount = DefaultMaxRecords) {
        return dynamicsQuery(this.connectionOptions, query, maxRowCount, this.dynamicsHeaders);
    }
    optionset(entityName, attributeName) {
        return dynamicsRequest(this.connectionOptions, `/api/data/${this.connectionOptions.webApiVersion}/EntityDefinitions(LogicalName='${entityName}')/Attributes(LogicalName='${attributeName}')/Microsoft.Dynamics.CRM.PicklistAttributeMetadata?$select=LogicalName&$expand=OptionSet($select=Options),GlobalOptionSet($select=Options)`, this.dynamicsHeaders)
            .then(attribute => (attribute.OptionSet || attribute.GlobalOptionSet).Options.map((option) => ({
            label: (option.Label && option.Label.UserLocalizedLabel && option.Label.UserLocalizedLabel.Label),
            value: option.Value
        })));
    }
    query(entityLogicalName, entitySetName) {
        return query(entityLogicalName).path(entitySetName);
    }
    save(entitySetName, data, id) {
        return dynamicsSave(this.connectionOptions, entitySetName, data, id, this.dynamicsHeaders);
    }
}
//# sourceMappingURL=Dynamics.js.map