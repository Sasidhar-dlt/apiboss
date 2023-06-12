import { util } from "/framework/js/util.mjs";
import { i18n } from "/framework/js/i18n.mjs";
import { apimanager as apiman } from "/framework/js/apimanager.mjs";
import { APP_CONSTANTS } from "../../../js/constants.mjs";
import { loader } from "../../../js/loader.mjs";
import { session } from "/framework/js/session.mjs";
import { securityguard } from "/framework/js/securityguard.mjs";
import { serverManager } from "./serverManager.js";

import { dialog } from "../page/dialog.js";


const MODULE_PATH = util.getModulePath(import.meta), VIEW_PATH = `${MODULE_PATH}/..`, ORG_DEV_METADATA = "__org_dev_metadata",ORG_METADATA = "__org_metadata", DIALOG = window.monkshu_env.components["dialog-box"];

async function getItemList() {
    try {
        const messageTheme = await $$.requireJSON(`${VIEW_PATH}/dialogs/dialogPropertiesPrompt.json`);
        let serverDetails = { host: "", port: "", name: "", secure: false }
        let metadata, result;
        const org = new String(session.get(APP_CONSTANTS.USERORG));
        const userid = new String(session.get(APP_CONSTANTS.USERID));
        const role = securityguard.getCurrentRole();
        const domain = new String(session.get("__org_domain"));
        await loader.beforeLoading();
        apiman.registerAPIKeys({ "*": "fheiwu98237hjief8923ydewjidw834284hwqdnejwr79389" }, "X-API-Key");
        const defaultSeverDetails = await apiman.rest(APP_CONSTANTS.API_CREATEORGETSETTINGS, "POST", { org, id: userid }, true, true);
        const publicServerDetails = await getPublicApibossServerDetails();

        if (defaultSeverDetails.data.server && defaultSeverDetails.data.port) {
            const loginResult = await serverManager.loginToServer(defaultSeverDetails.data.server, defaultSeverDetails.data.port, defaultSeverDetails.data.adminid, defaultSeverDetails.data.adminpassword);
            if (loginResult.result) {
                try {
                    serverDetails.secure = loginResult.scheme == "https";
                    const listApiResponse =  await apiman.rest(`${loginResult.scheme}://${defaultSeverDetails.data.server}:${defaultSeverDetails.data.port}/apps/apiboss/admin/list`, "POST", 
                    { apikey:defaultSeverDetails.data.apikey,domain }, true,true);
                    const listApiResult = [];
                    listApiResponse.apis.forEach((apipath)=>{
                        if(_checkDomainAndSubdomain(apipath.split("/",2).join("/").substring(1), String(domain))) {listApiResult.push(apipath)}
                    })
                    apiman.registerAPIKeys({ "*": "fheiwu98237hjief8923ydewjidw834284hwqdnejwr79389" }, "X-API-Key");
                    result = await apiman.rest(APP_CONSTANTS.API_GETMETADATA, "POST", { org: org, name: defaultSeverDetails.data.package, id: userid, server: defaultSeverDetails.data.server, port: defaultSeverDetails.data.port }, true, true);
                    if(listApiResult.length&&result.result){
                    session.set(ORG_METADATA, result.data);
                    let listApis = listApiResult;
                    let apilist = [];   
                    listApis.forEach((eachapi)=>{
                        result.data.apis.forEach((api)=>{
                        if(eachapi.substring(eachapi.split("/",2).join("/").length) == api.exposedpath) {
                          apilist.push(api);
                        }
                      })
                    });                    
                    let policy = [];
                    apilist.forEach((api)=>{
                      result.data.policies.forEach((eachpolicy)=>{
                        if(api.dependencies.includes(eachpolicy.id)) { policy.push(eachpolicy) }
                      })
                    });                   
                    result.data.apis = apilist;
                    result.data.policies = policy;
                }
                } catch (error) {
                    DIALOG.showMessage(await i18n.get("ConnectIssue"), "error", null, messageTheme, "MSG_DIALOG");
                    await loader.afterLoading();
                    return "[]"
                }
            }
            else {
                DIALOG.showMessage(await i18n.get("ApibossConnectIssue"), "error", null, messageTheme, "MSG_DIALOG");
                await loader.afterLoading();
                return "[]"
            }
        }
        else {
            const loginResult = await serverManager.loginToServer(publicServerDetails.serverIP, publicServerDetails.port, publicServerDetails.adminid, publicServerDetails.adminpassword);
            if (loginResult.result) {
                try {
                    serverDetails.secure = loginResult.scheme == "https";
                    const listApiResponse =  await apiman.rest(`${loginResult.scheme}://${publicServerDetails.serverIP}:${publicServerDetails.port}/apps/apiboss/admin/list`, "POST", 
                    { apikey:defaultSeverDetails.data.publicapikey,domain}, true,true);
                    const listApiResult = [];
                    listApiResponse.apis.forEach((apipath)=>{
                        if(_checkDomainAndSubdomain(apipath.split("/",2).join("/").substring(1), String(domain))) {listApiResult.push(apipath)}
                    })
                    apiman.registerAPIKeys({ "*": "fheiwu98237hjief8923ydewjidw834284hwqdnejwr79389" }, "X-API-Key");
                    result = await apiman.rest(APP_CONSTANTS.API_GETMETADATA, "POST", { org: org, name: publicServerDetails.package, id: userid, server: publicServerDetails.serverIP, port: publicServerDetails.port, isPublicServer: true }, true, true);
                    if(listApiResult.length&&result.result){
                    session.set(ORG_METADATA, result.data);
                    if(!defaultSeverDetails.data.publicapikey.length) { 
                        await loader.afterLoading(); 
                        dialog.apiconfigureDialog();
                        serverDetails.host = defaultSeverDetails.data.server != "" ? defaultSeverDetails.data.server : publicServerDetails.serverIP;
                        serverDetails.port = defaultSeverDetails.data.port != "" ? defaultSeverDetails.data.port : publicServerDetails.port;
                        serverDetails.name = defaultSeverDetails.data.name != "" ? defaultSeverDetails.data.package : publicServerDetails.package;
                        session.set("__org_server_details", JSON.stringify(serverDetails));
                        return "[]";
                    };

                    let listApis = listApiResult;
                    let apilist = [];   
                    listApis.forEach((eachapi)=>{
                        result.data.apis.forEach((api)=>{
                        if(eachapi.substring(eachapi.split("/",2).join("/").length) == api.exposedpath) {
                          apilist.push(api);
                        }
                      })
                    });
                    let policy = [];
                    apilist.forEach((api)=>{
                      result.data.policies.forEach((eachpolicy)=>{
                        if(api.dependencies.includes(eachpolicy.id)) { policy.push(eachpolicy) }
                      })
                    });                    
                    result.data.apis = apilist;
                    result.data.policies = policy;
                }
                } catch (error) {
                    DIALOG.showMessage(await i18n.get("ConnectIssue"), "error", null, messageTheme, "MSG_DIALOG");
                    await loader.afterLoading();
                    return "[]"
                }
            } 
            else {
                DIALOG.showMessage(await i18n.get("ApibossConnectIssue"), "error", null, messageTheme, "MSG_DIALOG");
                await loader.afterLoading();
                return "[]"
            }   
        }    
                serverDetails.host = defaultSeverDetails.data.server != "" ? defaultSeverDetails.data.server : publicServerDetails.serverIP;
                serverDetails.port = defaultSeverDetails.data.port != "" ? defaultSeverDetails.data.port : publicServerDetails.port;
                serverDetails.name = defaultSeverDetails.data.name != "" ? defaultSeverDetails.data.package : publicServerDetails.package;

                session.set("__org_server_details", JSON.stringify(serverDetails));
                if (result.result && result.data && Object.keys(result.data).length > 0) {
                    metadata = result.data;
                    session.set(ORG_DEV_METADATA, metadata);
                }
                const items = [];
                if (metadata) {
                    for (const api of metadata.apis) {
                        items.push({
                            id: api["apiname"], img: util.resolveURL(`${MODULE_PATH}/../dialogs/model.svg`),
                            label: api["apiname"], exposedmethod: api["exposedmethod"]
                        })
                    }
                    await loader.afterLoading();
                    return JSON.stringify(items);
                }
                else {
                    await loader.afterLoading();
                    if (role == APP_CONSTANTS.ADMIN_ROLE) await dialog.adminDialog();
                    else if (role == APP_CONSTANTS.USER_ROLE) await dialog.userDialog();
                    return "[]";
                }     
        
    }
    catch (err) {
        LOG.error(`User apis list fetch failed and the error is ${err}`);
        if (document.querySelector('.spinner')) await loader.afterLoading();
        return "[]";
    }
}

async function getPublicApibossServerDetails() {
    let publicServerDetail = await $$.requireJSON(`${APP_CONSTANTS.APIBOSS_CONF_PATH}/serverDetails.json`);
    return publicServerDetail;
}

function _checkDomainAndSubdomain(str1, str2) {
	// check if both strings contain a period, indicating a domain or subdomain
	if (str1.includes(".") && str2.includes(".")) {
		// split the strings into an array using the period as a delimiter
		const arr1 = str1.split(".");
		const arr2 = str2.split(".");
		// check the length of the arrays to determine which string is the domain and which is the subdomain
		if (arr1.length > arr2.length) {
			if (str1.endsWith(str2)) {
				return true;
			}
		}
		else if (arr2.length > arr1.length) {
			if (str2.endsWith(str1)) { return true; }
		}
        else if (arr1.length == arr2.length) {
            if(str1 == str2) { return true; }
        }
		else return false

	} else return false;
}

export const items = { getItemList };