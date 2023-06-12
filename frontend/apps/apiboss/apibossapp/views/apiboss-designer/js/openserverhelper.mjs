/** 
 * Opens files from the server.
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
import {i18n} from "/framework/js/i18n.mjs";
import {util} from "/framework/js/util.mjs";
import {serverManager} from "./serverManager.js";
import {blackboard} from "/framework/js/blackboard.mjs";
import { password_box } from "../../../components/password-box/password-box.mjs";

const MODULE_PATH = util.getModulePath(import.meta), DIALOG = window.monkshu_env.components["dialog-box"],
    MSG_FILE_UPLOADED = "FILE_UPLOADED",DEFAULT_HOST_ID = "__org_monkshu_dialog_box";

function init() {
    window.monkshu_env["OPEN_SERVER_HELPER"] = openserverhelper;
}

async function connectServerClicked(element) {
    const name = DIALOG.getElementValue("name"), server = DIALOG.getElementValue("server"), port = DIALOG.getElementValue("port"),
    adminid = DIALOG.getElementValue("adminid"); let adminpassword = DIALOG.getElementValue("adminpassword");
    adminpassword = password_box.getShadowRootByHostId("adminpassword").querySelector("#pwinput").value;
    if (!_validate()) return false;
    _disableButton(element);
    const metaDataResult = await serverManager.getMetaData(name,server, port, adminid,adminpassword);
    if (!metaDataResult.result) {
         _enableButton(element);
        DIALOG.showError(null, await i18n.get(metaDataResult.key)); LOG.error("MetaData fetch failed"); return;}
    else{
         _enableButton(element);
         DIALOG.hideError();
        blackboard.broadcastMessage(MSG_FILE_UPLOADED, {name: name, data: JSON.stringify(metaDataResult.model)});
        DIALOG.hideDialog();
    }
   
}

function _validate() {
    const shadowRoot =  DIALOG.getShadowRootByHostId( DEFAULT_HOST_ID);
    const toValidateList = shadowRoot.querySelectorAll('.validate'); 
    for (const validate of toValidateList) {
        if (!validate.checkValidity()) { validate.reportValidity(); return false; }
    }
    return true;
}

function _disableButton(element){ element.style["pointer-events"]="none"; element.style["opacity"]=0.4; }
function _enableButton(element){ element.style["pointer-events"]=""; element.style["opacity"]=""; }

export const openserverhelper = {init, connectServerClicked};