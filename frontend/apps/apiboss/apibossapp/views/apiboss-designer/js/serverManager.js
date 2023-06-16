/** 
 * Manages all communication with Rules server.
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
// import { APP_CONSTANTS } from "../../../js/constants.mjs";
import {apimanager as apiman} from "/framework/js/apimanager.mjs";
import { session } from "/framework/js/session.mjs";
import {loader} from "../../../js/loader.mjs";

const API_KEYS = {"*":"jfiouf90iejw9ri32fewji910idj2fkvjdskljkeqjf"}, KEY_HEADER = "org_monkshu_apikey";
const org = new String(session.get(APP_CONSTANTS.USERORG)),userid = new String(session.get(APP_CONSTANTS.USERID));
/**
 * Returns the list of models present on the server
 * @param {string} server Server IP or Hostname
 * @param {string||number} port Server port
 * @param {string} adminid Server admin login ID
 * @param {string} adminpassword Server admin password
 * @returns {result: true|false, models: [array of model names on success], err: Error text on failure, raw_err: Raw error, key: Error i18n key}
 */
async function getModelList(server, port, adminid, adminpassword) {
    const API_ADMIN_URL_FRAGMENT = `://${server}:${port}/apps/monkruls/admin`;

    const loginResult = await loginToServer(server, port, adminid, adminpassword);
    if (!loginResult.result) return loginResult;    // failed to connect or login

    try {   // try to get the list now
        const result = await apiman.rest(loginResult.scheme+API_ADMIN_URL_FRAGMENT, "POST", 
        {op: "list"}, true);
        return {result: result.result, models: result.result?result.list:null, err: "List fetch failed at the server", 
            raw_err: "Model list fetch failed at the server", key: "ModelListServerIssue"};
    } catch (err)  {return {result: false, err: "Server connection issue", raw_err: err, key: "ConnectIssue"} }
}

/**
 * Returns the given model as an object
 * @param {string} name The model name
 * @param {string} server Server IP or Hostname
 * @param {string||number} port Server port
 * @param {string} adminid Server admin login ID
 * @param {string} adminpassword Server admin password
 * @returns {result: true|false, model: Model object on success, err: Error text on failure, raw_err: Raw error, key: Error i18n key}
 */
 async function getMetaData(name, server, port,adminid,adminpassword) {
    let isPublicServer = false;

    if(!server.length && !port.length && !adminid.length && !adminpassword.length && !name.length) {
        [server, port, adminid, adminpassword, name] = await getPublicApibossServerDetails();
        isPublicServer = true;
    }
    await loader.beforeLoading();
    if(server.length && port.length && adminid.length && adminpassword.length && name.length) {
    const loginResult = await loginToServer(server, port, adminid, adminpassword);
    if (!loginResult.result){ // failed to connect or login
        await loader.afterLoading();
        return loginResult; }   
    apiman.registerAPIKeys({"*":"fheiwu98237hjief8923ydewjidw834284hwqdnejwr79389"},"X-API-Key");

    try {   // try to read the model now
        const result = await apiman.rest(APP_CONSTANTS.API_GETMETADATA, "POST", { org, name, id: userid ,server,port, isPublicServer}, true, true);
       await loader.afterLoading();
        return {result: result.result, model: result.result?result.data:null, err: "Metadata read failed at the server", 
            name: result.result?result.name:null, raw_err: "Metadata read failed at the server", key: "MetaDataReadServerIssue"};
    } catch (err)  {await loader.afterLoading();return {result: false, err: "Server connection issue", raw_err: err, key: "ConnectIssue"} }
  } else { await loader.afterLoading(); return {result: false, err: "Server connection issue", raw_err: "InvalidDetails", key: "InvalidDetails"} }
}

/**
 * Unpublishes the given model at the server (deletes it)
 * @param {string} name The model name
 * @param {string} server Server IP or Hostname
 * @param {string||number} port Server port
 * @param {string} adminid Server admin login ID
 * @param {string} adminpassword Server admin password
 * @returns {result: true|false, err: Error text on failure, raw_err: Raw error, key: Error i18n key}
 */
 async function unpublishModel(name, server, port, adminid, adminpassword) {
    const API_ADMIN_URL_FRAGMENT = `://${server}:${port}/apps/monkruls/admin`;

    const loginResult = await loginToServer(server, port, adminid, adminpassword);
    if (!loginResult.result) return loginResult;    // failed to connect or login

    try {   // try to delete
        const result = await apiman.rest(loginResult.scheme+API_ADMIN_URL_FRAGMENT, "POST", 
        {op: "delete", name}, true);
        return {result: result.result, err: "Mode unpublish failed at the server", 
            raw_err: "Model unpublish failed at the server", key: "ModelUnpublishServerIssue"};
    } catch (err)  {return {result: false, err: "Server connection issue", raw_err: err, key: "ConnectIssue"} }
}

/**
 * Publishes the given model to the server
 * @param {object} model The model to publish or update
 * @param {string} name The name for the model
 * @param {string} server Server IP or Hostname
 * @param {string||number} port Server port
 * @param {string} adminid Server admin login ID
 * @param {string} adminpassword Server admin password
 * @returns {result: true|false, err: Error text on failure, raw_err: Raw error, key: Error i18n key}
 */
async function publishModel(parsedData, name, server, port, adminid, adminpassword) {
    if(!server.length && !port.length && !adminid.length && !adminpassword.length && !name.length) {
        [server, port, adminid, adminpassword, name] = await getPublicApibossServerDetails();
    }
    if(server.length && port.length && adminid.length && adminpassword.length && name.length) {
    const loginResult = await loginToServer(server, port, adminid, adminpassword);
    if (!loginResult.result) return loginResult;    // failed to connect or login
    try {   // try to publish now
        return {result: (await apiman.rest(`${loginResult.scheme}://${server}:${port}/apps/apiboss/admin/updateconf`, "POST", 
            { data: parsedData}, true,true)).result, err: "Publishing failed at the server", 
            raw_err: "Publishing failed at the server", key: "PublishServerIssue"};
    } catch (err)  {return {result: false, err: "Server connection issue", raw_err: err, key: "LoginIssue"} }
  } else { return {result: false, err: "Server connection issue", raw_err: "InvalidDetails", key: "InvalidDetails"} }
}

async function publishMetaData(metaData,org,userid,name,server, port) {
    let isPublicServer = false;

    if(!server.length && !port.length && !name.length) {
        const publicServerDetail = await getPublicApibossServerDetails();
        [server, port, name] = [publicServerDetail[0], publicServerDetail[1], publicServerDetail.pop()];
        isPublicServer = true;
    }
    apiman.registerAPIKeys({"*":"fheiwu98237hjief8923ydewjidw834284hwqdnejwr79389"},"X-API-Key");
    if(server.length && port.length && name.length) {
    try {   // try to publish now
        return {result: (await apiman.rest(APP_CONSTANTS.API_CREATEORUPDATEMETA, "POST", 
             {metadata: metaData,org,id:userid,server,port,name,isPublicServer}, true,true)).result, err: "Publishing failed at the server", 
            raw_err: "Publishing failed at the server", key: "PublishServerIssue"};
    } catch (err)  {return {result: false, err: "Server connection issue", raw_err: err, key: "ConnectIssue"} }
  } else { return {result: false, err: "Server connection issue", raw_err: "InvalidDetails", key: "InvalidDetails"} }
}

async function loginToServer(server, port, adminid, adminpassword) {
    apiman.registerAPIKeys(API_KEYS, KEY_HEADER);

    const API_LOGIN_SECURE = `https://${server}:${port}/apps/apiboss/admin/login`;
    const API_LOGIN_INSECURE = `http://${server}:${port}/apps/apiboss/admin/login`;

    try {   // try secure first
        const result = await apiman.rest(API_LOGIN_SECURE, "POST", {id: adminid, pw: adminpassword,op:"login"}, false,true);
        if (result.result) return {result: true, scheme:"https"};
        else throw `Server secure login failed, trying insecure, ${await i18n.get(SecureConnectFailed)}`;
    } catch (err)  {    // try insecure else give up
        try {
            LOG.debug(err);
            const result = await apiman.rest(API_LOGIN_INSECURE, "POST", {id: adminid, pw: adminpassword,op:"login"}, false,true);
            if (result.result) return {result: true, scheme:"http"};
            else return {result: false, err: "Login failed at the server", raw_err: "Login failed at the server", key: "LoginIssue"};
        } catch (err)  {return {result: false, err: "Server connection issue", raw_err: err, key: "ConnectIssue"} }
    }
}

async function getPublicApibossServerDetails() {
    const publicServerDetail = await $$.requireJSON(`${APP_CONSTANTS.APIBOSS_CONF_PATH}/serverDetails.json`);
    return Object.values(publicServerDetail);
}

async function setDefaultSettings(org,userid,server,port,packageName,apikey,isPublic,adminid,adminpassword) {
    apiman.registerAPIKeys({"*":"fheiwu98237hjief8923ydewjidw834284hwqdnejwr79389"},"X-API-Key");

    try {   // try to publish now
        return {result: (await apiman.rest(APP_CONSTANTS.API_SETDEFAULTSETTINGS, "POST", 
            { org,id:userid,server,port,package:packageName,apikey,isPublic,adminid,adminpassword}, true,true)).result, err: "Setting default server failed at the server", 
            raw_err: "Setting default server failed at the server", key: "SetDefaultServerIssue"};
    } catch (err)  {return {result: false, err: "Setting failed", raw_err: err, key: "SetDefaultServerIssue"} }
}

function _disableButton(element){ element.style["pointer-events"]="none"; element.style["opacity"]=0.4; }
function _enableButton(element){ element.style["pointer-events"]=""; element.style["opacity"]=""; }

export const serverManager = {publishModel, unpublishModel, getModelList, getMetaData,publishMetaData,loginToServer,setDefaultSettings};