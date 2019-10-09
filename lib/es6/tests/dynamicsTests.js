var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import dynamics from "../Dynamics/Dynamics";
import { QueryOperator } from "../Query/Query";
import { ConnectionOptions, AuthenticationType } from "../Dynamics/DynamicsRequest";
export function dynamicsTestAll() {
    return __awaiter(this, void 0, void 0, function* () {
        const options = new ConnectionOptions();
        options.authType = AuthenticationType.Windows;
        options.username = "Administrator";
        options.domain = "CONTOSO";
        options.password = "{password}";
        options.serverUrl = "http://{server}/{org}/";
        options.webApiVersion = "v9.0";
        const dyn = dynamics(options);
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
            .where('name', QueryOperator.StartsWith, 'xrm')
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
//# sourceMappingURL=dynamicsTests.js.map