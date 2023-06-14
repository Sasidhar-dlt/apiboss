/** 
 * Publish rules to the rules engine.
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
import {i18n} from "/framework/js/i18n.mjs";
import {util} from "/framework/js/util.mjs";
import {serverManager} from "./serverManager.js";
import {blackboard} from "/framework/js/blackboard.mjs";
import {apibossmodel} from "../model/apibossmodel.mjs";
import {page_generator} from "/framework/components/page-generator/page-generator.mjs";
import { session } from "/framework/js/session.mjs";
// import { password_box } from "../../../components/password-box/password-box.mjs";
import {password_box} from "../../../../loginappframework/components/password-box/password-box.mjs";
import {loader} from "../../../js/loader.mjs";

const MODULE_PATH = util.getModulePath(import.meta), VIEW_PATH=`${MODULE_PATH}/..`, MSG_GET_MODEL_NAME = "GET_MODEL_NAME", 
    MSG_RENAME_MODEL = "RENAME_MODEL", DIALOG_RET_PROPS = ["name", "server", "port", "adminid", "adminpassword"], 
    DIALOG = window.monkshu_env.components["dialog-box"];

let saved_props;

async function openDialog() {
    let pageFile =  `${VIEW_PATH}/dialogs/dialog_publish.page`;

    let html = await page_generator.getHTML(new URL(pageFile), null, {modelName: blackboard.getListeners(MSG_GET_MODEL_NAME)[0]({})||""});

    const dom = new DOMParser().parseFromString(html, "text/html");
    if (saved_props) for (const id in saved_props) dom.querySelector(`#${id}`).setAttribute("value", saved_props[id]);
    html = dom.documentElement.outerHTML;   // this creates HTML with default values set from the previous run

    // now show and run the dialog
    const dialogPropertiesPath = `${VIEW_PATH}/dialogs/dialogPropertiespublish.json`;
    const messageTheme = await $$.requireJSON(`${VIEW_PATH}/dialogs/dialogPropertiesPrompt.json`);
    DIALOG.showDialog(dialogPropertiesPath, html, null, DIALOG_RET_PROPS, 
        async (typeOfClose, result, dialogElement) => { if (typeOfClose == "submit") {
            saved_props = util.clone(result, ["adminpassword"]); // don't save password, for security
            const parsedData = apibossmodel.getparsedData();
            result.adminpassword = password_box.getShadowRootByHostId("adminpassword").querySelector("#pwinput").value; 
            if(!parsedData.result){ DIALOG.showError(dialogElement,parsedData.key);return false}
            const metadata = apibossmodel.getModel();
            const org = new String(session.get(APP_CONSTANTS.USERORG)); 
            const userid = new String(session.get(APP_CONSTANTS.USERID)); 
            await loader.beforeLoading();_disableButton(dialogElement);
            const pubResult = await serverManager.publishModel(parsedData.data, result.name, result.server, result.port, result.adminid, result.adminpassword);
            if (!pubResult.result) {
                await loader.afterLoading(); _enableButton(dialogElement);
                DIALOG.showError(dialogElement, await i18n.get(pubResult.key)); return ;}
            else{
                const pubMetaResult = await serverManager.publishMetaData(metadata,org,userid, result.name, result.server, result.port);
                blackboard.broadcastMessage(MSG_RENAME_MODEL, {name: result.name});
                await loader.afterLoading(); _enableButton(dialogElement);
                if ( !pubMetaResult.result) DIALOG.showError(dialogElement, await i18n.get(pubMetaResult.key)); 
                else {DIALOG.showMessage(await i18n.get("PublishSuccess"), null, null, messageTheme, "MSG_DIALOG");  return true;}
            }

        } });
}

function _disableButton(element){ element.style["pointer-events"]="none"; element.style["opacity"]=0.4; }
function _enableButton(element){ element.style["pointer-events"]=""; element.style["opacity"]=""; }

export const publish = {openDialog};