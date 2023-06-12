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
import {i18n} from "./item-list.i18n.mjs";
import {util} from "/framework/js/util.mjs";
import {i18n as i18nFramework} from "/framework/js/i18n.mjs";
import {monkshu_component} from "/framework/js/monkshu_component.mjs";
import {router} from "/framework/js/router.mjs";
import { items } from "../../js/items.mjs";
import { loader } from "../../../../js/loader.mjs";
import { session } from "/framework/js/session.mjs";

const COMPONENT_PATH = util.getModulePath(import.meta),CURRENT_API = "_selected_api",ORG_DEV_METADATA = "__org_dev_metadata",ORG_METADATA = "__org_metadata";

async function elementConnected(element) {
	session.remove(ORG_METADATA); session.remove(ORG_DEV_METADATA);
	const itemList = await items.getItemList(element.parentElement.parentElement)
	Object.defineProperty(element, "value", {get: _=>JSON.stringify(item_list.getData(element.id).items), 
		set: value=>{
			const newData = item_list.getData(element.id); newData.items = _addDBLClickHandlerToItems(JSON.parse(value), element.getAttribute("ondblclickHandler"));
			item_list.bindData(newData, element.id) } });
	const data = { items: _addDBLClickHandlerToItems(JSON.parse(element.getAttribute("value")||itemList ?itemList : "[]"), element.getAttribute("ondblclickHandler")), 
		styleBody: element.getAttribute("styleBody")?`<style>${element.getAttribute("styleBody")}</style>`:undefined,
		label: element.getAttribute("label")||i18n.DefaultLabel[i18nFramework.getSessionLang()] }
	item_list.setDataByHost(element, data);
}

function _addDBLClickHandlerToItems(items, ondblclick) {
	if (!ondblclick) return;
	for (const item of items) item.ondblclick = ondblclick;
	return items;
}
async function openClicked(element, elementid) {
	await loader.beforeLoading();_disableButton(element);
	router.loadPage(`${APP_CONSTANTS.MAIN_HTML}?view=apiboss-designer&page=developer`);
	window.monkshu_env.components["api-contents"].bindApiContents(elementid);
	window.monkshu_env.components["apiinput-apioutput"].bindApiInputOutputParameters(elementid);
	window.monkshu_env.components["api-details"].updateExposedpathandMethod(elementid);
	window.monkshu_env.components["api-list"].highlightApi(elementid);
	await loader.afterLoading();
	session.set(CURRENT_API,elementid)

}
function _disableButton(element){ element.style["pointer-events"]="none"; element.style["opacity"]=0.4; }
function _enableButton(element){ element.style["pointer-events"]=""; element.style["opacity"]=""; }
export const item_list = {trueWebComponentMode: true, elementConnected,openClicked};
monkshu_component.register("item-list", `${COMPONENT_PATH}/item-list.html`, item_list);