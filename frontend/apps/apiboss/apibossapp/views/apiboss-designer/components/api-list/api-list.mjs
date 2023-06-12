
/**
 * A component to hold and display a list of items.
 * Item format is {id, img, label}. 
 * 
 * Value attribute returns or expects an array of items in the format
 * listed above.
 *  
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
import { i18n } from "./api-list.i18n.mjs";
import { util } from "/framework/js/util.mjs";
import { i18n as i18nFramework } from "/framework/js/i18n.mjs";
import { monkshu_component } from "/framework/js/monkshu_component.mjs";
import { loader } from "../../../../js/loader.mjs";
import { items } from "../../js/items.mjs";
import { session } from "/framework/js/session.mjs";

const COMPONENT_PATH = util.getModulePath(import.meta),CURRENT_API = "_selected_api";
let apiname;


async function elementConnected(element) {
    const itemList = await items.getItemList(element.parentElement.parentElement)
    Object.defineProperty(element, "value", {
        get: _ => JSON.stringify(api_list.getData(element.id).items),
        set: value => {
            const newData = api_list.getData(element.id); newData.items = _addClickHandlerToItems(JSON.parse(value), element.getAttribute("onclickHandler"));
            api_list.bindData(newData, element.id)
        }
    });
    const data = {
        items: _addClickHandlerToItems(JSON.parse(element.getAttribute("value") || itemList ? itemList : "[]"), element.getAttribute("onclickHandler")),
        styleBody: element.getAttribute("styleBody") ? `<style>${element.getAttribute("styleBody")}</style>` : undefined,
        label: element.getAttribute("label") || i18n.DefaultLabel[i18nFramework.getSessionLang()]
    }
    api_list.setDataByHost(element, data);
}

async function elementRendered(element) {
const items = Array.from(api_list.getShadowRootByHostId(element.id).querySelector("div#container").children);
if(apiname==undefined && items.length>0 && session.get(CURRENT_API) ) {
    apiname = session.get(CURRENT_API).toString();
     await openClicked(api_list.getShadowRootByHostId(element.id).querySelector(`div#${apiname.replace(/\s/g, "\\ ")}`),apiname)

}

for(let i=0;i<items.length;i++){
    if(apiname == items[i].id){
        items[i].style.background = "#F8FCFF"
    } else items[i].style.background = "none"
}


}

function _addClickHandlerToItems(items, onclick) {
    if (!onclick) return;
    for (const item of items) item.onclick = onclick;
    return items;
}
function highlightApi(elementid){
    apiname = elementid;
}

async function openClicked(element, elementid) {
    if(document.querySelector("floating-window")) document.querySelector("floating-window").remove();
   let thisElement = api_list.getHostElementByID("packages");
    await loader.beforeLoading(); _disableButton(thisElement.parentElement.parentElement);
    const shadowRoot = api_list.getShadowRootByHost(thisElement);
    const containerArray = Array.from(shadowRoot.querySelector("#container").children);
    for(let i=0;i<containerArray.length;i++){
        if(element.id == containerArray[i].id){
            containerArray[i].style.background = "#F8FCFF"
        } else containerArray[i].style.background = "none"
    }
  window.monkshu_env.components["api-contents"].bindApiContents(elementid);
  window.monkshu_env.components["api-details"].updateExposedpathandMethod(elementid, "update");
  window.monkshu_env.components["apiinput-apioutput"].bindApiInputOutputParameters(elementid, "update");
  window.monkshu_env.components["text-editor"].updateResponseData();
  await loader.afterLoading(); _enableButton(thisElement.parentElement.parentElement);
  session.set(CURRENT_API,elementid)
// setTimeout(()=>{loader.afterLoading(); _enableButton(thisElement.parentElement.parentElement);}, 500);

}

function _disableButton(element){ element.style["pointer-events"]="none"; element.style["opacity"]=0.4; }
function _enableButton(element){ element.style["pointer-events"]=""; element.style["opacity"]=""; }

export const api_list = { trueWebComponentMode: true, elementConnected,elementRendered, openClicked, highlightApi };
monkshu_component.register("api-list", `${COMPONENT_PATH}/api-list.html`, api_list);