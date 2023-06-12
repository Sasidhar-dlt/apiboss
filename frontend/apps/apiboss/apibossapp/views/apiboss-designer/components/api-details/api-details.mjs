/**
 * (C) 2022 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
import { util } from "/framework/js/util.mjs";
import { monkshu_component } from "/framework/js/monkshu_component.mjs";
import { text_editor } from "../text-editor/text-editor.mjs";
import { apimanager as apiman } from "/framework/js/apimanager.mjs";
import { APP_CONSTANTS } from "../../../../js/constants.mjs";
import { session } from "/framework/js/session.mjs";
import { code_snippet_window } from "../code-snippet-window/code-snippet-window.mjs";
import { loader } from "../../../../js/loader.mjs";
import {page_generator} from "/framework/components/page-generator/page-generator.mjs";
import { apibossmodel } from "../../model/apibossmodel.mjs";

const COMPONENT_PATH = util.getModulePath(import.meta), VIEW_PATH = APP_CONSTANTS.CONF_PATH,ORG_DEV_METADATA = "__org_dev_metadata", APIMANAGER_SESSIONKEY = "__org_monkshu_APIManager";

let model, target, apiname, serverDetails, method;

const elementConnected = async (element) => {
  const data = {
    componentPath: COMPONENT_PATH, styleBody: element.getAttribute("styleBody") ?
      `<style>${element.getAttribute("styleBody")}</style>` : undefined
  };
  api_details.setData(element.id, data);
  serverDetails = JSON.parse(session.get("__org_server_details"));
}

async function elementRendered(element, initialRender) {
  const shadowRoot = page_generator.getShadowRootByHost(document.querySelector('page-generator'));
  let totalSize =shadowRoot.querySelector('div.item2').offsetHeight+shadowRoot.querySelector('div.item3').offsetHeight+shadowRoot.querySelector('div.item5').offsetHeight+shadowRoot.querySelector('div.item8').offsetHeight + 30 ;
  shadowRoot.querySelector('div.item1').style.maxHeight=totalSize+'px';
  // let userid = session.get(APP_CONSTANTS.USERID);
  let domain = apibossmodel.getRootDomain((session.get("__org_domain").toString()));
  const data = {};
  if (initialRender) {
    model = session.get(ORG_DEV_METADATA);
    for (const api of model.apis) {
      if (api["apiname"] == apiname) {
        target = JSON.parse(JSON.parse(api["input-output"])[0])["requestBody"]["content"]["application/json"]["schema"]["properties"];
        data["exposedmethod"] = api["exposedmethod"];
        data["exposedpath"] = `/${domain}${api["exposedpath"]}`;
        method = api["exposedmethod"];
        let IdsOfPolicies = api.dependencies, apikeys = [], jwtText = false,userauths = false;;

        for (const policy of model.policies) {
          IdsOfPolicies.forEach(id => {
            if (policy.id == id) {
              if(policy["apikey"]!="")   apikeys.push(policy["apikey"]);
              if (policy.isjwttokenneeded == "YES") jwtText = true;
              if(policy.isauthenticationneeded == 'YES') userauths = true;

            }
          })
        }
        if(apikeys.length>0) data["isapineed"] = false; else data["isapineed"] = false;
        if (jwtText) data["isjwtneed"] = true; else data["isjwtneed"] = false;
        if (userauths) data["isuserauthsneed"] = true; else data["isuserauthsneed"] = false;

      }


    }
    api_details.bindData(data, element.id);
  }
  fetchBaseParameters(element, target);
}

function updateExposedpathandMethod(elementid, updateParam) {
  apiname = elementid;
  if (updateParam) {
    const data = {};
    let userid = session.get(APP_CONSTANTS.USERID);
    let domain = apibossmodel.getRootDomain((session.get("__org_domain").toString()));
    for (const api of model.apis) {
      if (api["apiname"] == elementid) {
        target = JSON.parse(JSON.parse(api["input-output"])[0])["requestBody"]["content"]["application/json"]["schema"]["properties"];
        data["exposedmethod"] = api["exposedmethod"];
        data["exposedpath"] = `/${domain}${api["exposedpath"]}`;
        method = api["exposedmethod"];
        let IdsOfPolicies = api.dependencies, apikeys = [], jwtText = false, userauths = false;

        for (const policy of model.policies) {
          IdsOfPolicies.forEach(id => {
            if (policy.id == id) {
              if(policy["apikey"]!="")   apikeys.push(policy["apikey"]);
              if (policy.isjwttokenneeded == "YES") jwtText = true ;
              if(policy.isauthenticationneeded == 'YES') userauths = true;
            }
          })
        }
        if(apikeys.length>0) data["isapineed"] = false; else data["isapineed"] = false;
        if (jwtText) data["isjwtneed"] = true; else data["isjwtneed"] = false;
        if (userauths) data["isuserauthsneed"] = true; else data["isuserauthsneed"] = false;

        fetchBaseParameters(api_details.getHostElementByID("apidetails"), target)
      }
    }
    const element = api_details.getHostElementByID("apidetails")
    api_details.bindData(data, element.id);
  }
}

function toggle(element, event) {
  if (event.target.classList == "label") {
    element.classList.toggle("active");
  }
}


function fetchBaseParameters(element, target) {
  const shadowRoot = api_details.getShadowRootByHostId(element.getAttribute("id"));
  const content = shadowRoot.querySelector('#content');
  content.innerHTML = '';

  for (let key in target) {
    let child = document.createElement('div');
    child.innerHTML = `<div class="input-fields" style="padding-right: 10px" id=${target[key].type}>
     <label for="My${target[key].type}" id="my${key}" style="text-align: center; color: #444444;
    margin-left: 1.2em; ">${key}</label>
    <sub class="dataType">${target[key].type}</sub>
     ${target[key].type == "array" && target[key].type !== "object" ? ` <image-button img="./img/add.svg" text=${target[key].items.type} style=" width:6em; height: 100%; margin :0px 10px;"
     class=${target[key].items.type} id=${key} type="row"
     styleBody="div#button.row {flex-direction: row; justify-content: flex-start;} div#button {padding: 3px 10px;} div#button>img.row {width: 1.5em;height: 100%;} div#button>span {color: #000000; font-weight: 700; margin-left:5px} div#button>span.row {width: 100%;}"
     color="#444444" border="0.5px solid #98CCFD" background-color="#DFF0FE" active-background-color="white" margin = "0px 10px"
     display="inline-block;" onclick='monkshu_env.components["api-details"].addMoreParameters(this, event);monkshu_env.components["api-details"].setAttrData();'></image-button>` : target[key].type !== "object" ? `<input type="text" oninput="monkshu_env.components['api-details'].setAttrData();" style="margin: 0px 5px" id="My${key}" class="input-text" />`:""}</div>`
    content.appendChild(child);
    target[key].type == "object" ? addObjParam(child, target[key].properties) : null;
  }
}

function addObjParam(element, data) {
  for(let key in data) {
    let child = document.createElement('div');
    child.classList.add('wrapper-div');
    child.style.marginBottom = "0px";
    child.innerHTML = `<div class="input-fields" style="padding-right: 10px" id=${data[key].type}>
     <label for="My${data[key].type}" id="my${key}" style="text-align: center; color: #444444;
    margin-left: 1.2em; ">${key}</label>
    <sub class="dataType">${data[key].type}</sub>
     ${data[key].type == "array" && data[key].type !== "object" ? `<image-button img="./img/add.svg" text=${data[key].items.type} style=" width:6em; height: 100%; margin :0px 10px;"
     class=${data[key].items.type} id=${key} type="row"
     styleBody="div#button.row {flex-direction: row; justify-content: flex-start;} div#button {padding: 3px 10px;} div#button>img.row {width: 1.5em;height: 100%;} div#button>span {color: #000000; font-weight: 700; margin-left:5px} div#button>span.row {width: 100%;}"
     color="#444444" border="0.5px solid #98CCFD" background-color="#DFF0FE" active-background-color="white" margin = "0px 10px"
     display="inline-block;" onclick='monkshu_env.components["api-details"].addMoreParameters(this, event);monkshu_env.components["api-details"].setAttrData()'></image-button>` : data[key].type !== "object" ? `<input type="text" oninput="monkshu_env.components['api-details'].setAttrData();" style="margin: 0px 5px" id="My${key}" class="input-text" />`:""}</div>`
    element.appendChild(child);
    data[key].type == "object" ? addObjParam(child, data[key].properties) : null;
  }
}


function findAllByKey(obj, keyToFind) {
  return Object.entries(obj)
    .reduce((acc, [key, value]) => (key === keyToFind)
      ? acc.concat(value)
      : (typeof value === 'object')
        ? acc.concat(findAllByKey(value, keyToFind))
        : acc
      , [])
}

function _serachParamInSchema(id) {
  const data = findAllByKey(target, id);
  return data[0];
}

function addMoreParameters(element, event) {
  if (event.composedPath()[5].classList == 'string' || event.composedPath()[5].classList == 'number') {
    let stringWrapper = document.createElement("div");
    stringWrapper.classList.add("wrapper-div");
    stringWrapper.style.paddingBottom = "0px";
    let inputContainer = document.createElement("div");
    inputContainer.classList.add("input-wrapper");
    inputContainer.innerHTML = `<input class="input-text" oninput="monkshu_env.components['api-details'].setAttrData();" style="padding:3px;" type=${event.composedPath()[5].classList == "number" ? "number" : "text"} placeholder=${event.composedPath()[5].classList} /> <img class="deleteBtn" onclick='monkshu_env.components["api-details"].deleteParameters(this, event);monkshu_env.components["api-details"].setAttrData();' src=${COMPONENT_PATH}/img/delete.svg/>`
    stringWrapper.appendChild(inputContainer);
    event.composedPath()[7].appendChild(stringWrapper);
  }
  else if (event.composedPath()[5].classList == "object") {
    let newData = _serachParamInSchema(event.composedPath()[5].id).items.properties;
    let wrapperDiv = document.createElement('div');
    wrapperDiv.classList.add("wrapper-div");
    let objectDiv = document.createElement("div");
    // objectDiv.style.borderBottom = "0.5px solid black";
    objectDiv.innerHTML = `<div class="array-object" style="padding-right: 15px">
     <label for="Object" style="text-align: center; color: #444444;
    margin-left: 1.2em;">Object</label>
    <img class="deleteBtn" src="${COMPONENT_PATH}/img/delete.svg" onclick='monkshu_env.components["api-details"].deleteParameters(this, event);monkshu_env.components["api-details"].setAttrData();'/>
    </div>`
    wrapperDiv.appendChild(objectDiv);
    for (let key in newData) {
      let child = document.createElement('div');
    child.innerHTML = `<div class="input-fields" style="padding-right: 10px" id=${newData[key].type}>
     <label for="My${newData[key].type}" id="my${key}" style="text-align: center; color: #444444;
    margin-left: 1.2em; ">${key}</label>
    <sub class="dataType">${newData[key].type}</sub>
     ${newData[key].type == "array" && newData[key].type !== "object" ? ` <image-button img="./img/add.svg" text=${newData[key].items.type} style=" width:6em; height: 100%; margin :0px 10px;"
     class=${newData[key].items.type} id=${key} type="row"
     styleBody="div#button.row {flex-direction: row; justify-content: flex-start;} div#button {padding: 3px 10px;} div#button>img.row {width: 1.5em;height: 100%;} div#button>span {color: #000000; font-weight: 700; margin-left:5px}"
     color="#444444" border="0.5px solid #98CCFD" background-color="#DFF0FE" active-background-color="white" margin = "0px 10px"
     display="inline-block;" onclick='monkshu_env.components["api-details"].addMoreParameters(this, event);monkshu_env.components["api-details"].setAttrData();'></image-button>` : newData[key].type !== "object" ? `<input type="text"  oninput="monkshu_env.components['api-details'].setAttrData();"style="margin: 0px 5px" id="My${key}" class="input-text" />`:""}</div>`
    wrapperDiv.appendChild(child);
    newData[key].type == "object" ? addObjParam(child, newData[key].properties) : null;
    }
    event.composedPath()[7].appendChild(wrapperDiv);
  }
}



function deleteParameters(element, event) {
  if (event.composedPath()[1].classList == "array-object") {
    event.composedPath()[3].remove();
  }
  else if (event.composedPath()[1].classList == "input-wrapper") {
    event.composedPath()[2].remove();
  }
}

function getParaVal(element, obj) {
  if (element.firstChild.querySelector(":scope>input")) {
    obj[element.firstChild.querySelector(":scope>label").innerText] = element.firstChild.querySelector(":scope>input").value;
  }
  else if (element.firstChild.querySelector("sub").innerText == "object") {
    let child = element.children;
    let target = child[0].querySelector("label").innerText;
    let newChild = Array.from(child);
    let resObj = {};
    newChild.shift();
    newChild.forEach((each)=>{
      // each.querySelectorAll(":scope>div").forEach((para)=>{
      //   console.log(para);
      //   console.log(para.querySelector(":scope>input"))
      // })
      getParaVal(each, resObj);
    })
    obj[`${target}`] = resObj;
  }
  else {
    let child = element.children;
    let target = child[0].querySelector("label").innerText;
    let type = child[0].querySelector("image-button").getAttribute("text");
    // if(child[0].id.includes("array")){
    obj[`${target}`] = [];
    // }
    let newChild = Array.from(child);
    newChild.shift();
    if (newChild.length && type == "object") {
      newChild.forEach((each) => {
        let arrayParams = {};
        each.querySelectorAll(":scope>div").forEach((para) => {
          if (para.firstChild.querySelector(":scope>input")) {
            arrayParams[para.firstChild.querySelector(":scope>label").innerText] = para.firstChild.querySelector(":scope>input").value;
          }
        })
        obj[`${target}`].push(arrayParams);
      })
    }
    else if (newChild.length && type !== "object") {
      newChild.forEach((each) => {
        each.querySelectorAll(":scope>div").forEach((para) => {
          if (para.firstChild.value) {
            obj[`${target}`].push(para.firstChild.value);
          }
        })
      })
    }
  }
}

async function tryIt(element, event) {
  let thisElement = api_details.getHostElementByID("apidetails");
  const shadowRoot = api_details.getShadowRootByHost(thisElement);

  if (!_validate(shadowRoot)) {
    const toValidateList = shadowRoot.querySelectorAll('.validate');

    for (const validate of toValidateList) {
        if (!validate.checkValidity()) { validate.reportValidity(); return false; }
    }
  };
  await loader.beforeLoading();

  let node = shadowRoot.querySelector("#content"),apikey;
  let targetNode = node;
  let reqBody = {}
  targetNode.querySelectorAll(":scope>div").forEach((para) => {
    getParaVal(para, reqBody);
  })
  let path = shadowRoot.querySelector("span#path").innerText, jwtToken;
  if(shadowRoot.querySelector("input#token-input")){
    jwtToken = shadowRoot.querySelector("input#token-input").value;
  }

  const org = new String(session.get(APP_CONSTANTS.USERORG));
  const userid = new String(session.get(APP_CONSTANTS.USERID));
  const settingDetails = (await apiman.rest(APP_CONSTANTS.API_CREATEORGETSETTINGS, "POST", { org, id: userid }, true, true)).data;
if(settingDetails.server.length && settingDetails.port.length && settingDetails.package.length) apikey = settingDetails.apikey;
else if(!settingDetails.publicapikey.length) {
  if(session.get(ORG_DEV_METADATA).policies.length)
apikey = session.get(ORG_DEV_METADATA).policies[0]["apikey"];

}
else apikey = settingDetails.publicapikey;
  let xapikey = {"*": apikey}
  apiman.registerAPIKeys(xapikey, "x-api-key");

  const host = new URL(`${serverDetails.secure ? `https` : `http`}://${serverDetails.host}:${serverDetails.port}`).host; // have to change the host for our dynamic case
  let sub = 'access'
  if(shadowRoot.querySelector("#userid") && shadowRoot.querySelector("#password")){
    const storage = _getAPIManagerStorage(); storage.tokenManager[`basic_auth`] = `Basic ${btoa(`${shadowRoot.querySelector("#MyInput").value}:${shadowRoot.querySelector("#Mypwd").value}`)}`; _setAPIManagerStorage(storage);
  }

  if (jwtToken) { const storage = _getAPIManagerStorage(); storage.tokenManager[`${host}_${sub}`] = jwtToken; _setAPIManagerStorage(storage); }
  let resp;
  try {
    resp = await apiman.rest(`${serverDetails.secure ? `https` : `http`}://${serverDetails.host}:${serverDetails.port}${path}`, `${method.toUpperCase()}`, reqBody, (jwtToken) ? true : false, false, false, false, true);
  } catch (error) {
    resp = {respErr: {status: "500", statusText: "Internal Server Error"}};
  }
  if (typeof resp == "string") resp = JSON.parse(resp);
  text_editor.getJsonData(resp);
  await loader.afterLoading();
  apiman.registerAPIKeys({"*":"fheiwu98237hjief8923ydewjidw834284hwqdnejwr79389"},"X-API-Key");
  const storage = _getAPIManagerStorage(); if(storage.tokenManager[`basic_auth`]) delete storage.tokenManager[`basic_auth`]; _setAPIManagerStorage(storage);
};

function setAuthorization(event){
  code_snippet_window.ifAuthSetAuth(`${event.target.value}`);
  code_snippet_window.setNodeJSValue();
  code_snippet_window.setJavaValue();
  code_snippet_window.setShellValue();

}

function setApiKey(event){
  code_snippet_window.ifKeySetKey(`${event.target.value}`);
  code_snippet_window.setNodeJSValue();
  code_snippet_window.setJavaValue();
  code_snippet_window.setShellValue();
}

function setAttrData(){
  code_snippet_window.setAttributeData(getAttributesData())
}

function setBasicAuthentication(){
  let thisElement = api_details.getHostElementByID("apidetails");
  const shadowRoot = api_details.getShadowRootByHost(thisElement);
  if(shadowRoot.querySelector("#userid") && shadowRoot.querySelector("#password")){
    code_snippet_window.ifBasicAuthSetAuth(`${btoa(`${shadowRoot.querySelector("#MyInput").value}:${shadowRoot.querySelector("#Mypwd").value}`)}`);
    code_snippet_window.setNodeJSValue();
    code_snippet_window.setJavaValue();
    code_snippet_window.setShellValue();
  }

}


function getAttributesData(){
  let thisElement = api_details.getHostElementByID("apidetails");
  const shadowRoot = api_details.getShadowRootByHost(thisElement);
  let node = shadowRoot.querySelector("#content");
  let targetNode = node;
  let reqBody = {}
  targetNode.querySelectorAll(":scope>div").forEach((para) => {
    getParaVal(para, reqBody);
  })
  return reqBody;
}

function _validate(shadowRoot) {

  const toValidateList = shadowRoot.querySelectorAll('.validate');
  for (const validate of toValidateList) {
    if (!validate.checkValidity()) { validate.reportValidity(); return false; }
  }
  return true;
}

function _getAPIManagerStorage() {
  if (!session.get(APIMANAGER_SESSIONKEY))
    session.set(APIMANAGER_SESSIONKEY, { tokenManager: {}, keys: {}, keyHeader: "org_monkshu_apikey", apiResponseCache: {} });
  return session.get(APIMANAGER_SESSIONKEY);
}

function _setAPIManagerStorage(storage) {
  session.set(APIMANAGER_SESSIONKEY, storage);
}

export const api_details = {
  trueWebComponentMode: true, elementConnected, elementRendered, addMoreParameters, toggle, deleteParameters, _serachParamInSchema, tryIt, getParaVal, updateExposedpathandMethod, _getAPIManagerStorage, _setAPIManagerStorage, setAuthorization, setApiKey, getAttributesData,setAttrData,setBasicAuthentication
}

monkshu_component.register(
  "api-details", `${COMPONENT_PATH}/api-details.html`, api_details
);
