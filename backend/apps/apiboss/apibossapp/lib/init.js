/**
 * Shows how to init apps embedded into the login app.
 * (C) 2023 TekMonks. All rights reserved.
 */

const fs = require("fs");
const mustache = require("mustache");
const APIBOSS_CONSTANTS = LOGINAPP_CONSTANTS.ENV.APIBOSSAPP_CONSTANTS;

exports.initSync = _ => {
    _readConfSync();    // the files below need constants to be setup properly so require them after conf is setup

    // const fileindexer = require(`${APIBOSS_CONSTANTS.LIBDIR}/fileindexer.js`);
    const loginhandler = require(`${APIBOSS_CONSTANTS.LIB_DIR}/loginhandler.js`);
    const apibossconstantshandler = require(`${APIBOSS_CONSTANTS.LIB_DIR}/app.js`);
    const apibossratelimithandler = require(`${APIBOSS_CONSTANTS.LIB_DIR}/apiregistry_extensions/apibossrateenforcer.js`);
    const apibosshttpbasichandler = require(`${APIBOSS_CONSTANTS.LIB_DIR}/apiregistry_extensions/apibosshttpbasicauth.js`);


    loginhandler.init(); 
    apibossconstantshandler.initSync();
    apibossratelimithandler.initSync();
    apibosshttpbasichandler.initSync();
    // fileindexer.init();
}

function _readConfSync() {
    // const confjson = mustache.render(fs.readFileSync(`${APIBOSS_CONSTANTS.CONFDIR}/neuranet.json`, "utf8"), 
    //     APIBOSS_CONSTANTS).replace(/\\/g, "\\\\");   // escape windows paths
    // APIBOSS_CONSTANTS.CONF = JSON.parse(confjson);
}