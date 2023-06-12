/** 
 * (C) 2021 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
import {util} from "/framework/js/util.mjs";
import {monkshu_component} from "/framework/js/monkshu_component.mjs";
import { input_output_fields } from "../../../apiboss-designer/components/input-output-fields/input-output-fields.mjs";
import { dialog_box } from "../dialog-box/dialog-box.mjs";
import { input_table } from "../../../apiboss-designer/components/input-table/input-table.mjs";
import { drop_down } from "../../../apiboss-designer/components/drop-down/drop-down.mjs";
import {i18n} from "/framework/js/i18n.mjs";


const COMPONENT_PATH = util.getModulePath(import.meta), VIEW_PATH=`${COMPONENT_PATH}/../../../apiboss-designer`, DIALOG = window.monkshu_env.components["dialog-box"];

const elementConnected = async element => {
    const data = {img: element.getAttribute("img"), text: element.getAttribute("text"), 
		onclick: element.getAttribute("onclickHandler"), alt: element.getAttribute("alt"), title: element.getAttribute("title"),
		styleBody: element.getAttribute("styleBody")?`<style>${element.getAttribute("styleBody")}</style>`:undefined,
		column: element.getAttribute("type")=="column"?true:undefined, row: element.getAttribute("type")=="row"?true:undefined,
		color: element.getAttribute("color"), "background-color": element.getAttribute("background-color"), 
		"active-background-color": element.getAttribute("active-background-color"), border: element.getAttribute("border")
	};

	image_button.setData(element.id, data);
}

async function uploadOpenAPI(element, event) {
	try {
		let data = await uploadAFile("application/json");
		data = JSON.parse(data.data);
	let dialoghost = dialog_box.getHostElementByID("__org_monkshu_dialog_box");
	let dialogShadow = dialog_box.getShadowRootByHost(dialoghost);
	let input_output = input_output_fields.getHostElementByID("input-output");
	const shadowRoot_inputOuput = input_output_fields.getShadowRootByHost(input_output);
	dialogShadow.querySelector("#apiname").value = data.info.title; 
	dialogShadow.querySelector("#apidescription").value = data.info.description; 

    let path, method, injected=[], passthru=[];
    for(let property in data.paths) { path = property; break; }
    for(let property in data.paths[`${path}`]) { method = property; break; }

    let parameterArray = data.paths[`${path}`][`${method}`]["parameters"];
    for(let items of parameterArray) {
	    if(items.in == "passthrough") {
		passthru.push([items.name]);
	    } else if (items.in == "headers") {
		    injected.push([items.name, ""]);
	    }
    }
    let passthroughHost = input_table.getHostElementByID("passthrough");
    const injectedHost = input_table.getHostElementByID("injected");
    input_table._setValue(JSON.stringify(passthru), passthroughHost);
    input_table._setValue(JSON.stringify(injected), injectedHost);
    let exposedDropDown = drop_down.getHostElementByID("exposedmethod");
    drop_down._setValue(method.toUpperCase(), exposedDropDown);
    let backendMethodDropDown = drop_down.getHostElementByID("backendurlmethod");
    let backendMethod = data.paths[`${path}`][`${method}`]["backend"]["method"];
    drop_down._setValue(backendMethod.toUpperCase(), backendMethodDropDown);
    dialogShadow.querySelector("#exposedpath").value = path;
    dialogShadow.querySelector("#backendurl").value = data.paths[`${path}`][`${method}`]["backend"]["url"];
    let arr = [JSON.stringify({requestBody: data.paths[`${path}`][`${method}`]["requestBody"]}), JSON.stringify({responses: data.paths[`${path}`][`${method}`]["responses"]})]
	input_output_fields.create(JSON.parse(arr[0]), shadowRoot_inputOuput.querySelector("#newTree"));
	input_output_fields.create(JSON.parse(arr[1]), shadowRoot_inputOuput.querySelector("#output-childTree"));
	return data;
	} catch (error) {
		// const messageTheme = await $$.requireJSON(`${VIEW_PATH}/dialogs/dialogPropertiesPrompt.json`);
		// DIALOG.showMessage("Only JSON Files are allowed!", null, null, messageTheme, "MSG_DIALOG");
		let dialoghost = dialog_box.getHostElementByID("__org_monkshu_dialog_box");
	let dialogShadow = dialog_box.getShadowRootByHost(dialoghost);
	dialog_box.showError( dialogShadow.querySelector("#exposedpath"), "Only JSON Files are allowed!")
	// dialogShadow.querySelector("#error").innerText = "Only JSON Files are allowed!";
	// dialogShadow.querySelector("#error").style.visibilty = "visible";
	setTimeout(()=>{
		dialog_box.hideError( dialogShadow.querySelector("#exposedpath"))
	}, 4000)
	}
}

function uploadAFile(accept = "*/*", type = "text") {
    const uploadFiles = _ => new Promise(resolve => {
        const uploader = document.createElement("input"); uploader.setAttribute("type", "file");
        uploader.style.display = "none"; uploader.setAttribute("accept", accept);

        document.body.appendChild(uploader); uploader.onchange = _ => { resolve(uploader.files); document.body.removeChild(uploader); };
        uploader.click();
    });

    return new Promise(async (resolve, reject) => {
        const file = (await uploadFiles())[0]; if (!file) { reject("User cancelled upload"); return; }
        if (accept == 'application/json') {
            if (file.type == 'application/json') {
                try { resolve(await getFileData(file, type)); } catch (err) { reject(err); }
            } else { reject("Only JSON files are allowed"); return; }
        }
        else { try { resolve(await getFileData(file, type)); } catch (err) { reject(err); } }
    });
}

/**
 * Reads the given file and returns its data.
 * @param file The File object
 * @param type Optional: Can be "text" or "binary". Default is "text".
 * @returns A promise which resolves to {name - filename, data - string or ArrayBuffer} or rejects with error
 */
function getFileData(file, type = "text") {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = event => resolve({ name: file.name, data: event.target.result });
        reader.onerror = _event => reject(reader.error);
        if (type.toLowerCase() == "text") reader.readAsText(file); else reader.readAsArrayBuffer(file);
    });
}

// convert this all into a WebComponent so we can use it
export const image_button = {trueWebComponentMode: true, elementConnected, uploadOpenAPI}
monkshu_component.register("image-button", `${COMPONENT_PATH}/image-button.html`, image_button);
