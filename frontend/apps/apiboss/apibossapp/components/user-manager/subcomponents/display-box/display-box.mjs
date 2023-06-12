/* 
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed license.txt file.
 */
import {router} from "/framework/js/router.mjs";
import {monkshu_component} from "/framework/js/monkshu_component.mjs";

async function showDialog(templatePath, showOK, showCancel, data, hostID, retValIDs, callback) {
    const templateHTML = await router.loadHTML(templatePath, data, false);
    if (callback) _showDialogInternal(templateHTML, showOK, showCancel, hostID, retValIDs, callback);
    else return new Promise(resolve => _showDialogInternal(templateHTML, showOK, showCancel, hostID, retValIDs, ret=>resolve(ret)));
}

function hideDialog(element) {
    const shadowRoot = element instanceof Element ? display_box.getShadowRootByContainedElement(element): 
        display_box.getShadowRootByHostId(element);
    const hostElement = shadowRoot.querySelector("div#dialogcontent");
    while (hostElement && hostElement.firstChild) hostElement.removeChild(hostElement.firstChild);  // deletes everything
    const modalCurtain = shadowRoot.querySelector("div#modalcurtain");
    const dialog = shadowRoot.querySelector("div#dialog");
    dialog.classList.remove("visible"); modalCurtain.classList.remove("visible");
    const memory = element instanceof Element ? display_box.getMemoryByContainedElement(element) : 
        display_box.getMemory(element); memory.isDialogOpen = false;
}

function isDialogOpen(hostID) {
    const memory = display_box.getMemory(hostID); return (memory.isDialogOpen == true);
}

function error(element, msg) {
    const shadowRoot = element instanceof Element ? display_box.getShadowRootByContainedElement(element): 
        display_box.getShadowRootByHostId(element);
    const divError = shadowRoot.querySelector("div#error");
    divError.innerHTML = msg; divError.style.visibility = "visible";
}

const showMessage = (templatePath, data, hostID) => monkshu_env.components['display-box'].showDialog(templatePath, true, 
    false, data, hostID, [], _=> monkshu_env.components['display-box'].hideDialog("dialog"));

function hideError(element) {
    const shadowRoot = display_box.getShadowRootByContainedElement(element);
    const divError = shadowRoot.querySelector("div#error");
    divError.style.visibility = "hidden";
}

function submit(element) {
    const memory = display_box.getMemoryByContainedElement(element);

    if (memory.dialogResult) {memory.callback(memory.dialogResult); return;} 
    else if (memory.retValIDs) {
        const ret = {}; const shadowRoot = display_box.getShadowRootByContainedElement(element);
        for (const retValId of memory.retValIDs) ret[retValId] = shadowRoot.querySelector(`#${retValId}`)?shadowRoot.querySelector(`#${retValId}`).value:null;
        memory.callback(ret);
        return;
    } else if (memory.callback) memory.callback();
} 

function _showDialogInternal(templateHTML, showOK, showCancel, hostID, retValIDs, callback) {
    const shadowRoot = display_box.getShadowRootByHostId(hostID); _resetUI(shadowRoot);
    const templateRoot = new DOMParser().parseFromString(templateHTML, "text/html").documentElement;
    router.runShadowJSScripts(templateRoot, shadowRoot);
    const hostElement = shadowRoot.querySelector("div#dialogcontent");
    hostElement.appendChild(templateRoot);
    const modalCurtain = shadowRoot.querySelector("div#modalcurtain");
    const dialog = shadowRoot.querySelector("div#dialog");
    modalCurtain.classList.add("visible"); dialog.classList.add("visible"); 
    if (!showOK) shadowRoot.querySelector("span#ok").style.display = "none";
    if (!showCancel) shadowRoot.querySelector("span#cancel").style.display = "none";
    
    const memory = display_box.getMemory(hostID); memory.retValIDs = retValIDs; memory.callback = callback; memory.isDialogOpen = true;
}

function _resetUI(shadowRoot) {
    shadowRoot.querySelector("div#error").style.visibility = "hidden";
    shadowRoot.querySelector("span#ok").style.display = "inline";
    shadowRoot.querySelector("span#cancel").style.display = "inline";
    shadowRoot.querySelector("html").style.height = "fit-content";
    shadowRoot.querySelector("body").style.height = "fit-content";
}

const trueWebComponentMode = true;	// making this false renders the component without using Shadow DOM
export const display_box = {showDialog, trueWebComponentMode, hideDialog, error, showMessage, hideError, submit, isDialogOpen}
monkshu_component.register("display-box", `${APP_CONSTANTS.APP_PATH}/components/display-box/display-box.html`, display_box);