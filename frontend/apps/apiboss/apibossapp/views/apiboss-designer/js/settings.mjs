/** 
 * Publish rules to the rules engine.
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
import { i18n } from "/framework/js/i18n.mjs";
import { util } from "/framework/js/util.mjs";
import { serverManager } from "./serverManager.js";
import { blackboard } from "/framework/js/blackboard.mjs";
import { page_generator } from "/framework/components/page-generator/page-generator.mjs";
import { session } from "/framework/js/session.mjs";
import { html_fragment } from "../../shared/components/html-fragment/html-fragment.mjs";
import { apimanager as apiman } from "/framework/js/apimanager.mjs";

import { loader } from "../../../js/loader.mjs";
// import { password_box } from "../../../components/password-box/password-box.mjs";
import {password_box} from "../../../../loginappframework/components/password-box/password-box.mjs";

const MODULE_PATH = util.getModulePath(import.meta), VIEW_PATH = `${MODULE_PATH}/..`, MSG_GET_MODEL_NAME = "GET_MODEL_NAME", MSG_FILE_UPLOADED = "FILE_UPLOADED",
    MSG_RENAME_MODEL = "RENAME_MODEL", DIALOG_RET_PROPS = ["apikey"], ORG_METADATA = "__org_metadata",
    DIALOG = window.monkshu_env.components["dialog-box"];

let saved_props;

async function openDialog() {
    let pageFile = `${VIEW_PATH}/dialogs/dialog_settings.page`;
    let html = await page_generator.getHTML(new URL(pageFile), null, { modelName: blackboard.getListeners(MSG_GET_MODEL_NAME)[0]({}) || "" });
    const dom = new DOMParser().parseFromString(html, "text/html");
    if (saved_props) for (const id in saved_props) dom.querySelector(`#${id}`).setAttribute("value", saved_props[id]);
    const org = new String(session.get(APP_CONSTANTS.USERORG));
    const userid = new String(session.get(APP_CONSTANTS.USERID));
    const defaultSeverDetails = await apiman.rest(APP_CONSTANTS.API_CREATEORGETSETTINGS, "POST", { org, id: userid }, true, true);
    if (!(defaultSeverDetails.data.server.length && defaultSeverDetails.data.port.length)) dom.querySelector("#apikey").setAttribute("value", defaultSeverDetails.data.publicapikey)
    else dom.querySelector("#apikey").setAttribute("value", defaultSeverDetails.data.apikey)
    let htmlFragment = dom.querySelector('html-fragment#output')
    let htmlContnet = htmlFragment.getAttribute("htmlcontent") ? decodeURIComponent(htmlFragment.getAttribute("htmlcontent")) :
        htmlFragment.getAttribute("htmlfile") ? await $$.requireText(htmlFragment.getAttribute("htmlfile")) : "";
    const tableDom = new DOMParser().parseFromString(htmlContnet, "text/html");
    tableDom.querySelector("textarea#server").textContent = defaultSeverDetails.data.server;
    tableDom.querySelector("textarea#port").textContent = defaultSeverDetails.data.port;
    tableDom.querySelector("textarea#package").textContent = defaultSeverDetails.data.package;

    let htmltext = tableDom.documentElement.outerHTML;
    htmlContnet = encodeURIComponent(htmltext);
    htmlFragment.setAttribute("htmlcontent", htmlContnet);
    html = dom.documentElement.outerHTML;   // this creates HTML with default values set from the previous run

    // now show and run the dialog
    const dialogPropertiesPath = `${VIEW_PATH}/dialogs/dialogPropertiessettings.json`;
    const messageTheme = await $$.requireJSON(`${VIEW_PATH}/dialogs/dialogPropertiesPrompt.json`);
    DIALOG.showDialog(dialogPropertiesPath, html, null, DIALOG_RET_PROPS,
        async (typeOfClose, result, dialogElement) => {
            if (typeOfClose == "submit") {
                const server = html_fragment.getShadowRootByHostId("output").querySelector("textarea#server").value;
                const port = html_fragment.getShadowRootByHostId("output").querySelector("textarea#port").value;
                const packageName = html_fragment.getShadowRootByHostId("output").querySelector("textarea#package").value;
                const adminid = html_fragment.getShadowRootByHostId("output").querySelector("textarea#adminid").value;
                const adminpassword = password_box.getShadowRootByHostId("adminpassword").querySelector("#pwinput").value;

                if (!server.length && !port.length && !packageName.length) {
                    if (!result.apikey) { DIALOG.showError(dialogElement, await i18n.get("FillKey")); return; }
                    const publicServerDetails = await getPublicApibossServerDetails();
                    const loginResult = await serverManager.loginToServer(publicServerDetails.serverIP, publicServerDetails.port, publicServerDetails.adminid, publicServerDetails.adminpassword);
                    if (loginResult.result) { // failed to connect or login
                        apiman.registerAPIKeys({"*":"fheiwu98237hjief8923ydewjidw834284hwqdnejwr79389"},"X-API-Key");
                        const publicMetaresult = await apiman.rest(APP_CONSTANTS.API_GETMETADATA, "POST", { org: org, name: publicServerDetails.package, id: userid, server: publicServerDetails.serverIP, port: publicServerDetails.port, isPublicServer: true }, true, true);
                        if (publicMetaresult.result && publicMetaresult?.data?.policies.length) {
                            if (publicMetaresult.data.policies.some(policy => policy.apikey == result.apikey)) {
                                blackboard.broadcastMessage(MSG_FILE_UPLOADED, { name: publicServerDetails.package, data: JSON.stringify(publicMetaresult.data) });
                                await serverManager.setDefaultSettings(org, userid, server, port, packageName, result.apikey, true);
                                session.set(ORG_METADATA, publicMetaresult.data);
                                DIALOG.showMessage(await i18n.get("SetSuccess"), null, null, messageTheme, "MSG_DIALOG"); return true;
                            }
                            else { DIALOG.showError(dialogElement, await i18n.get("IncorrectAPI")); return; }
                        }
                        else { DIALOG.showError(dialogElement, await i18n.get("APIsNotPublished")); return; }
 
                    }
                    else { DIALOG.showError(dialogElement, await i18n.get("ConnectIssue")); return; }
                }
                const privateLoginResult = await serverManager.loginToServer(server, port, adminid, adminpassword);
                if (privateLoginResult.result) { 
                    apiman.registerAPIKeys({"*":"fheiwu98237hjief8923ydewjidw834284hwqdnejwr79389"},"X-API-Key");
                    const localMetaResult = await apiman.rest(APP_CONSTANTS.API_GETMETADATA, "POST", { org: org, name: packageName, id: userid, server, port }, true, true);
                    if (localMetaResult.result && localMetaResult?.data?.policies.length) {
                        if (localMetaResult.data.policies.some(policy => policy.apikey == result.apikey)) {
                            const setResult = await serverManager.setDefaultSettings(org, userid, server, port, packageName, result.apikey,false,adminid,adminpassword);
                            if (!setResult.result) {
                                DIALOG.showError(dialogElement, await i18n.get("APIsNotPublished")); return;
                            }
                            else {
                                blackboard.broadcastMessage(MSG_FILE_UPLOADED, { name: packageName, data: JSON.stringify(localMetaResult.data) });
                                session.set(ORG_METADATA, localMetaResult.data);
                                DIALOG.showMessage(await i18n.get("SetSuccess"), null, null, messageTheme, "MSG_DIALOG"); return true;
                            }

                        }
                        else { DIALOG.showError(dialogElement, await i18n.get("IncorrectAPI")); return; }
                    }
                    else {
                        DIALOG.showError(dialogElement, await i18n.get("APIsNotPublished")
                        ); return;
                    }
                }
                else { DIALOG.showError(dialogElement, await i18n.get("ConnectIssue")); return; }
            }
        });
}


async function getPublicApibossServerDetails() {
    let publicServerDetail = await $$.requireJSON(`${APP_CONSTANTS.APIBOSS_CONF_PATH}/serverDetails.json`);
    return publicServerDetail;
}

export const settings = { openDialog };