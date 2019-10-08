import dynamics from "../Dynamics/Dynamics";
import query, { QueryOperator } from "../Query/Query";
import { ConnectionOptions, AuthenticationType } from "../Dynamics/DynamicsRequest";

export async function dynamicsTestAll() {
    const options = new ConnectionOptions();
    options.authType = AuthenticationType.Windows;
    options.username = "Administrator";
    options.domain = "CONTOSO";
    options.password = "p@ssw0rd1";
    options.serverUrl = "http://win-a6ljo0slrsh/test/";
    
    const dyn = dynamics(options);

    /* Batch Request */
    const allAccounts = await dyn.batch()
        .requestAllUrls(['/api/data/v9.1/accounts'])
        .execute();

    if (allAccounts.length == 0) {
        throw new Error('No Accounts found!');
    }

    /* Create Entity */
    const id = await dyn.save('accounts', { name: 'xrmtest1' });

    if (!id) {
        throw new Error('Account could not be created!');
    }

    /* Update Entity */
    const uid = await dyn.save('accounts', { name: 'xrmtest2' }, id);

    if (id !== uid) {
        throw new Error('Account could not be updated!');
    }

    /* Fetch Query */
    const xrmAccount = await dyn.fetch(

        dyn.query('account', 'accounts')
            .where('name', QueryOperator.StartsWith, 'xrm')
            .orderBy('name')
            .select('name')

    )[0];

    if (!xrmAccount) {
        throw new Error('Account could not be found!');
    }

    /* Optionset Items */
    const statusOptions = await dyn.optionset('account', 'statuscode');

    if (statusOptions.length == 0) {
        throw new Error('Optionset items could not be found!');
    }
}