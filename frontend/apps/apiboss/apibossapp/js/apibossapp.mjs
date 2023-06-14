/** 
 * Shows how to embed an app inside loginapp.
 * 
 * (C) 2023 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */

import {i18n} from "/framework/js/i18n.mjs";
import {util} from "/framework/js/util.mjs";
import {router} from "/framework/js/router.mjs";
import {session} from "/framework/js/session.mjs";

const MODULE_PATH = util.getModulePath(import.meta), 
    CHOOSE_PRODUCT_HTML = util.resolveURL(`${APP_CONSTANTS.EMBEDDED_APP_PATH}/chooseproduct.html`);

let loginappMain;

const main = async (data, mainLoginAppModule) => {
    window.monkshu_env.apps[APP_CONSTANTS.EMBEDDED_APP_NAME] = {main: apibossapp};
    loginappMain = mainLoginAppModule; loginappMain.addGoHomeListener(gohome);
    APP_CONSTANTS.VIEWS_PATH = util.resolveURL(`${APP_CONSTANTS.EMBEDDED_APP_PATH}/views`);
    await _createdata(data); 
    data.maincontent = await router.loadHTML(CHOOSE_PRODUCT_HTML, {...data}); 
}

async function _createdata(data) {   
    let viewPath, views; delete data.showhome;
    const viewsAllowed = (session.get(APP_CONSTANTS.LOGIN_RESPONSE))?.views||[];
    if (!session.get(APP_CONSTANTS.FORCE_LOAD_VIEW)) {
        viewPath = viewsAllowed.length == 1?`${APP_CONSTANTS.VIEWS_PATH}/${viewsAllowed[0]}` :
            `${APP_CONSTANTS.EMBEDDED_APP_PATH}`;
        views = []; for (const view of viewsAllowed) if (view != APP_CONSTANTS.VIEW_CHOOSER) views.push(  // views we can choose from
            {viewicon: `${APP_CONSTANTS.VIEWS_PATH}/${view}/page/logo.svg`, 
                viewlabel: await i18n.get(`ViewLabel_${view}`), viewname: view});
    } else {
        if (viewsAllowed.length > 1) data.showhome = true;
        viewPath = `${APP_CONSTANTS.EMBEDDED_APP_PATH}`;
    }
    
    const viewURL = `${viewPath}/../../main.html?view=apiboss-designer`, viewMainMJS = `${viewPath}/../../js/main.mjs`;
    data.viewpath = viewPath; 
    try { const viewMain = await import(viewMainMJS); await viewMain.main.initView(data, apibossapp); }    // init the view before loading it
    catch (err) { LOG.error(`Error in initializing view ${viewPath}.`); }
    data.viewcontent = await router.loadHTML(viewURL, {...data, views}); 
}

const gohome = _ => session.remove(APP_CONSTANTS.FORCE_LOAD_VIEW);

async function openView(viewname) {
    session.set(APP_CONSTANTS.FORCE_LOAD_VIEW, viewname);
    const {loginmanager} = await import (`${APP_CONSTANTS.LOGINFRAMEWORK_LIB_PATH}/loginmanager.mjs`);
    loginmanager.addLogoutListener(`${MODULE_PATH}/apibossapp.mjs`, "apibossapp", "onlogout");
    router.loadPage(`${APP_CONSTANTS.APIBOSS_MAIN_HTML}?view=${viewname}`);
    // router.navigate(APP_CONSTANTS.APIBOSS_MAIN_HTML);
}

function onlogout() {session.remove(APP_CONSTANTS.FORCE_LOAD_VIEW);}

const showMessage = message => loginappMain.showMessage(message);

const showError = error => {LOG.error(error); showMessage(error);}

export const apibossapp = {main, openView, gohome, onlogout, showMessage, showError};