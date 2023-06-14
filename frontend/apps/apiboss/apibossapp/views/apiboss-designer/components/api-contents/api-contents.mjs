/**
 * (C) 2022 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
 import { util } from "/framework/js/util.mjs";
 import { monkshu_component } from "/framework/js/monkshu_component.mjs";
//  import { APP_CONSTANTS } from "../../../../js/constants.mjs";
 import { code_snippet_window } from "../code-snippet-window/code-snippet-window.mjs";
 import { session } from "/framework/js/session.mjs";
import { apibossmodel } from "../../model/apibossmodel.mjs";
 
//  const COMPONENT_PATH = util.getModulePath(import.meta),VIEW_PATH=APP_CONSTANTS.CONF_PATH,ORG_DEV_METADATA = "__org_dev_metadata";
const COMPONENT_PATH = util.getModulePath(import.meta),ORG_DEV_METADATA = "__org_dev_metadata";
 let docData,model,serverDetails, exposedpath;
 
 
 const elementConnected = async (element) => {
  model = session.get(ORG_DEV_METADATA),serverDetails = JSON.parse(session.get("__org_server_details"));
 }
 
 function traverseObject(target, t, callback) {
 
   callback(target, t);
   if (typeof target === 'object') {
     for (let key in target) {
       traverseObject(target[key], key, callback);
     }
   }
 }
 
 async function bindApiContents(elementid) {
   const data = {}
  //  let userid = session.get(APP_CONSTANTS.USERID);
  let domain = apibossmodel.getRootDomain((session.get(APP_CONSTANTS.USERORGDOMAIN).toString()));

   model = session.get(ORG_DEV_METADATA),serverDetails =JSON.parse(session.get("__org_server_details"));;
   for (const api of model.apis) {
     let inputParams = [], outputParams = [];
 
     let IdsOfPolicies = api.dependencies, apikeys = [], jwtText = false, securityData = [];
 
     for (const policy of model.policies) {
       IdsOfPolicies.forEach(id => {
         if (policy.id == id) {
           apikeys.push(policy["apikey"]);
           if (policy.isjwttokenneeded == "YES") jwtText = "This api needs a valid JWT token"
         }
       })
     }
 
     if(jwtText) securityData.push({"index":securityData.length + 1,"value": jwtText})
     if(apikeys && apikeys.length>0) securityData.push({"index":securityData.length + 1,"value": `This api needs an API Key.`});
 
     traverseObject(JSON.parse(JSON.parse(api["input-output"])[0])["requestBody"]["content"]["application/json"]["schema"]["properties"], false, function (node, key) { if (node && typeof node == "object") if (node.type) { inputParams.push({ "name": key, "type": node.type, "desc": node.desc ? node.desc : "", "index": inputParams.length + 1 }); } });
     traverseObject(JSON.parse(JSON.parse(api["input-output"])[1])["responses"]["200"]["content"]["application/json"]["schema"]["properties"], false, function (node, key) { if (node && typeof node == "object") if (node.type) { outputParams.push({ "name": key, "type": node.type, "desc": node.desc ? node.desc : "", "index": outputParams.length + 1 }); } });
     if (api["apiname"] == elementid) {
       data["description"] = api["apidescription"];
       data["exposedpath"] = `${serverDetails.secure ?"https":"http"}://${serverDetails.host}:${serverDetails.port}/${domain}${api["exposedpath"]}`;
       data["exposedmethod"] = api["exposedmethod"];
       if (api["isrestapi"] == "YES") data["standard"] = "REST";
       else data["standard"] = "NOT REST";
       data["inputparams"] = inputParams;
       data["outputparams"] = outputParams;
       data["securitydata"] = securityData;
       data["apiname"] = api["apiname"]
       break;
     }
   }
 
   api_contents.bindData(data, "apicontent");
   docData = data;
   exposedpath = data["exposedpath"];
   code_snippet_window.setExposedPathAndMethod(exposedpath, `${data["exposedmethod"]}`);
 }

 function downloadWord() {
  let element = api_contents.getHostElementByID("apicontent");
  const shadowRoot = api_contents.getShadowRootByHost(element);
  var header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML To Doc</title></head>
  <style>.input-headers, .output-headers, .security-headers{font-size: 25px; margin-bottom: 10px;} .apidata-header{font-size:25px; background-color: white;} .output-headers, .security-headers{margin-top: 10px;} td{word-wrap: break-word;}</style>
  <body><div style="font-size:30px; font-weight:bold; text-decoration: underline; margin-bottom: 10px;">${docData.apiname}</div>`
  var footer = "</body></html>";

  const innerData = shadowRoot.querySelector("#container").innerHTML.replace(/<img[^>]*src="([^"]+)"[^>]*>/gm, "");
  var sourceHTML = header + innerData.replace(/background-color:#98CCFD;/gmi, "text-decoration: underline; font-weight: bold;") + footer;
  var source = 'data:application/msword;charset=utf-8,' + encodeURIComponent(sourceHTML);
  var fileDownload = document.createElement("a");
  document.body.appendChild(fileDownload);
  fileDownload.href = source;
  fileDownload.download = `${docData.apiname}.doc`;
  fileDownload.click();
  document.body.removeChild(fileDownload);
 }
 
 async function downloadPDF(){
   await $$.require(`${COMPONENT_PATH}/dist/jspdf.debug.js`);
   await $$.require(`${COMPONENT_PATH}/dist/jspdf.plugin.autotable.min.js`);
   let inputdata = [];
   let outputdata = [];
   let securitydata = [];
 
   docData.inputparams.forEach((data) => {
     inputdata.push([`${data.index}`, `${data.name}`, `${data.type}`, `${data.desc}`])
   })
 
   docData.outputparams.forEach((data) => {
     outputdata.push([`${data.index}`, `${data.name}`, `${data.type}`, `${data.desc}`])
   })
 
   docData.securitydata.forEach((data) => {
     securitydata.push([`${data.index}`, `${data.value}`])
   })
   let doc = new jsPDF();
   doc.autoTable({
     styles: {fontStyle: 'bold', fontSize: '15'},
     head:[{content: docData.apiname}]
   })
   doc.autoTable({
     body: [{ content: `${docData.description}` }]
   })
   doc.autoTable({
     head: [{ content: "Calling this API" }],
     body: [[`URL to call this API is ${docData.exposedpath}`], [`The HTTP action to call this API is ${docData.exposedmethod}`], [`The API request and response is in ${docData.standard} standard`]]
   })
   doc.autoTable({
     head: [{ content: "The input parameters are" }],
   })
   doc.autoTable({
     columnStyles: {
         0: { cellWidth: 5 },
         1: { cellWidth: 20 },
         2: { cellWidth: 15 },
         3: { cellWidth: 60 }
       },
     body: inputdata
   });
   doc.autoTable({
     head: [{ content: "The output parameters are" }]
   })
   doc.autoTable({
     columnStyles: {
         0: { cellWidth: 5 },
         1: { cellWidth: 20 },
         2: { cellWidth: 15 },
         3: { cellWidth: 60 }
       },
     body: outputdata
   });
 
   doc.autoTable({
     head: [{ content: "Security" }],
   })
   doc.autoTable({
     columnStyles: {
         0: { cellWidth: 5 },
         1: { cellWidth: 95 },
       },
     body: securitydata
   });
   doc.save(`${docData.apiname}.pdf`);
 }
 
 export const api_contents = {
   trueWebComponentMode: true, elementConnected, bindApiContents, downloadPDF, downloadWord,
   EXPOSED_PATH: exposedpath
 }
 
 monkshu_component.register(
   "api-contents", `${COMPONENT_PATH}/api-contents.html`, api_contents
 );