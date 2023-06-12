/**
 * Login listener to inject Monastery data into logins.
 * (C) 2023 TekMonks. All rights reserved.
 */

const login = require(`${LOGINAPP_CONSTANTS.API_DIR}/login.js`);
const register = require(`${LOGINAPP_CONSTANTS.API_DIR}/register.js`);
const APIBOSS_CONSTANTS = LOGINAPP_CONSTANTS.ENV.APIBOSSAPP_CONSTANTS;
const dblayer = require(`${APIBOSS_CONSTANTS.LIB_DIR}/dblayer.js`);

exports.init = _ => {
    dblayer.initDB(); 

    login.addLoginListener(`${APIBOSS_CONSTANTS.LIB_DIR}/loginhandler.js`, "viewInjector");
    register.addNewUserListener(`${APIBOSS_CONSTANTS.LIB_DIR}/loginhandler.js`, "viewInjector");
}

exports.viewInjector = async function(result) {
    if (result.tokenflag) try { result.views = await dblayer.getViewsForDomain(result.domain); }
    catch (err) {return false;}
    return true;
}