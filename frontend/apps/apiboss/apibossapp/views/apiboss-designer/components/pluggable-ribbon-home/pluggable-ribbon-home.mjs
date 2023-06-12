/** 
 * (C) 2019 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
import {util} from "/framework/js/util.mjs";
import {session} from "/framework/js/session.mjs";
import {monkshu_component} from "/framework/js/monkshu_component.mjs";
import {blackboard} from "/framework/js/blackboard.mjs";
const ORG_METADATA = "__org_metadata";


const MSG_FILE_UPLOADED = "FILE_UPLOADED";
import { loader } from "../../../../js/loader.mjs";

const COMPONENT_PATH = util.getModulePath(import.meta);

async function elementConnected(element) {
	await loader.beforeLoading(); _disableButton(element);
    const data = await _instantiatePlugins(element);
	if(data) await loader.afterLoading(); _enableButton(element);

	if (element.getAttribute("styleBody")) data.styleBody = `<style>${element.getAttribute("styleBody")}</style>`;

	if (element.getAttribute("ribbonTitle")) data.ribbonTitle = element.getAttribute("ribbonTitle");
	if (element.getAttribute("ribbonLogo")) data.ribbonLogo = element.getAttribute("ribbonLogo");
	
	pluggable_ribbon_home.setData(element.id, data);
}

async function elementRendered(element) {
	const shadowRoot = pluggable_ribbon_home.getShadowRootByHostId(element.id);
	for (const pluginName in pluggable_ribbon_home.extensions[element.id||"null"]) // attach shadowRoots to the plugins
		pluggable_ribbon_home.extensions[element.id||"null"][pluginName].shadowRoot = shadowRoot;
	}

async function _instantiatePlugins(element) {
	let plugins; try{plugins = await $$.requireJSON(`${COMPONENT_PATH}/${element.id}/pluginreg.json`);} catch (err) {LOG.error(`Can't read plugin registry, error is ${err}`); return {};};
	const data = {plugins:[]}; pluggable_ribbon_home.extensions = pluggable_ribbon_home.extensions||{}; pluggable_ribbon_home.extensions[element.id||"null"] = {};
	
	for (const plugin of plugins) {
		const moduleSrc = `${COMPONENT_PATH}/${element.id}/${plugin}/${plugin}.mjs`;
		const pluginModule = (await import(moduleSrc))[plugin]; 
		if (pluginModule && await pluginModule.init(`${COMPONENT_PATH}/${element.id}/${plugin}`)) {
			pluggable_ribbon_home.extensions[element.id][plugin] = pluginModule;
			const pluginObj = {img: pluginModule.getImage(), title: pluginModule.getHelpText(session.get($$.MONKSHU_CONSTANTS.LANG_ID)), 
				id: element.id||"null", pluginName: plugin, name: pluginModule.getDescriptiveName(session.get($$.MONKSHU_CONSTANTS.LANG_ID)),
				pluginCursor: pluginModule.getCursor?pluginModule.getCursor():"pointer"};
			if (pluginModule.customEvents) {	// plug in custom event handlers if the plugin supports it
				pluginObj.customEvents = []; for (const event of pluginModule.customEvents) 
					pluginObj.customEvents.push({event, id: element.id||"null", pluginName: plugin}); 
			}
			data.plugins.push(pluginObj);
		} else LOG.error(`Can't initialize plugin - ${plugin}`);
	}
	return data;
}

function _disableButton(element){ element.style["pointer-events"]="none"; element.style["opacity"]=0.4; }
function _enableButton(element){ element.style["pointer-events"]=""; element.style["opacity"]=""; }

async function loadDefaultMeta(){
	setTimeout(_=>{
    const serverDetails = JSON.parse(session.get("__org_server_details"));
    const metadata = session.get(ORG_METADATA);
    if (metadata) blackboard.broadcastMessage(MSG_FILE_UPLOADED, {name: serverDetails.name, data: JSON.stringify(metadata)});
	},100)
}

// convert this all into a WebComponent so we can use it
export const pluggable_ribbon_home = {trueWebComponentMode: true, elementConnected, elementRendered, loadDefaultMeta}
monkshu_component.register("pluggable-ribbon-home", `${COMPONENT_PATH}/pluggable-ribbon-home.html`, pluggable_ribbon_home);