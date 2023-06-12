/** 
 * Model file for API400 application.
 * (C) 2022 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
import { algos } from "./algos.mjs";
import { util } from "/framework/js/util.mjs";
import { blackboard } from "/framework/js/blackboard.mjs";
import { session } from "/framework/js/session.mjs";
import { APP_CONSTANTS } from "../../../js/constants.mjs";

const EMPTY_MODEL = { apis: [], policies: [] }, DEFAULT_BUNDLE = "apis";
let apibossmodelObj = EMPTY_MODEL, idCache = {}, current_command_bundle = DEFAULT_BUNDLE;
const MSG_NODES_MODIFIED = "NODES_MODIFIED", MSG_CONNECTORS_MODIFIED = "CONNECTORS_MODIFIED",
    MSG_NODE_DESCRIPTION_CHANGED = "NODE_DESCRIPTION_CHANGED", MSG_ARE_NODES_CONNECTABLE = "ARE_NODES_CONNECTABLE",
    MSG_GET_MODEL = "GET_MODEL", MSG_RESET = "RESET", MSG_LOAD_MODEL = "LOAD_MODEL",
    MSG_CONNECT_NODES = "CONNECT_NODES", MSG_ADD_NODE = "ADD_NODE";

function init() {
    blackboard.registerListener(MSG_NODES_MODIFIED, message => modelNodesModified(message.type, message.nodeName,
        message.id, message.properties), true);
    blackboard.registerListener(MSG_CONNECTORS_MODIFIED, message => {
        modelConnectorsModified(message.type,
            message.sourceNode, message.targetNode, message.sourceID, message.targetID)
    });
    blackboard.registerListener(MSG_NODE_DESCRIPTION_CHANGED, message => nodeDescriptionChanged(message.nodeName,
        message.id, message.description));
    blackboard.registerListener(MSG_ARE_NODES_CONNECTABLE, message => isConnectable(message.sourceName,
        message.targetName, message.sourceID, message.targetID), true);
    blackboard.registerListener(MSG_GET_MODEL, message => getModelAsFile(message.name), true);
    blackboard.registerListener(MSG_RESET, _ => { apibossmodelObj = EMPTY_MODEL, idCache = {}, current_command_bundle = DEFAULT_BUNDLE; }, true);
    blackboard.registerListener(MSG_LOAD_MODEL, message => loadModel(message.data));
}

function loadModel(jsonModel) {
    try {
        apibossmodelObj = JSON.parse(jsonModel);
    }
    catch (err) { LOG.error(`Bad APIBOSS model, error ${err}, skipping.`); return; }
    if (!(apibossmodelObj.apis)) { LOG.error(`Bad APIBOSS model, not in right format.`); return; }

    // first add all the commands
    for (const nodes in apibossmodelObj) for (const node of apibossmodelObj[nodes] ) {
        const id = node.id || _getUniqueID(); idCache[id] = node; const clone = util.clone(node);
        const nodeName = clone.nodeName;
        blackboard.broadcastMessage(MSG_ADD_NODE, { nodeName, id, description: clone.description, properties: { ...clone }, connectable: true });
    }


    const connectNodes = (sourceID, targetID) => {
        if ((!idCache[sourceID]) || (!idCache[targetID])) { LOG.error(`Bad dependency in the model ${sourceID}, skipping.`); return; }
        const sourceName = idCache[sourceID].nodeName, targetName = idCache[targetID].nodeName;
        blackboard.broadcastMessage(MSG_CONNECT_NODES, { sourceName, targetName, sourceID, targetID });
    }
    // add connections between commands
    for (const api of apibossmodelObj.apis)
        if (api.dependencies) for (const dependency of api.dependencies) connectNodes(dependency, api.id);

}

function modelNodesModified(type, nodeName, id, properties) {
    if (type == apibossmodel.ADDED) return _nodeAdded(nodeName, id, properties);
    if (type == apibossmodel.REMOVED) return _nodeRemoved(nodeName, id);
    if (type == apibossmodel.MODIFIED) return _nodeModified(nodeName, id, properties);
    return false;   // unknown modification
}

function modelConnectorsModified(type, sourceName, targetName, sourceID, targetID) {
    if ((!idCache[sourceID]) || (!idCache[targetID])) return;   // not connected

    const addOrRemoveDependencies = (sourceNode, targetNode, type) => {

        if (type == apibossmodel.ADDED) {
            if (!targetNode.dependencies) targetNode.dependencies = [];
            targetNode.dependencies.push(sourceNode.id);
        } else if (type == apibossmodel.REMOVED && targetNode) {
            const dependencies = targetNode.dependencies;
            if ((!dependencies) || (!dependencies.length) || dependencies.indexOf(sourceNode.id) == -1) return;
            else{const newD = _arrayDelete(dependencies, sourceNode.id)}
            if (dependencies.length == 0) delete targetNode.dependencies;    // no longer required
        }
    }

    addOrRemoveDependencies(idCache[sourceID], idCache[targetID], type);    // also visually connect the nodes  
}

function isConnectable(sourceName, targetName, sourceID, targetID) {    // are these nodes connectable
    if (sourceID == targetID) return false;
    if (targetName == "policy") return false;
    if (sourceName == targetName) return false;

    return true;
}

function nodeDescriptionChanged(_nodeName, id, description) {

    if (!idCache[id]) return;

    const oldNameTracksDescription = _getNameFromDescription(idCache[id].description) == idCache[id].name;
    if (idCache[id].name && oldNameTracksDescription) {
        idCache[id].name = _getNameFromDescription(description); idCache[id].description = description;
    } else idCache[id].description = description;

}

function getModel() {
    const retModel = util.clone(apibossmodelObj);
    retModel?.policies.forEach((policy)=> {if(policy.password.length) policy.password = ""});
    return retModel;

}

function getparsedData() {
    let domain = getRootDomain(session.get("__org_domain").toString());
    let parsedData = {},finalData = [], rateLimit = {}, inputoutput = {}, apiregistrydata = {};
    const retModel = util.clone(apibossmodelObj);
    if(!(retModel.apis.length>0 && retModel.policies.length>0)) return {result:false,key:"Require data is not available to publish"};
    for (const policy of retModel.policies){
        if(!("apikey" in policy)) return {result:false,key:`Please fill apikey in ${policy.description}`};
        if(policy.apikey!=""){
         if(policy.israteenforcementneeded!="NO" || policy.isauthenticationneeded=="YES") parsedData["ratelimitsdata"]= _ratelimits(policy);
         else parsedData["ratelimitsdata"]="";
        //  finalData.push({[policy.apikey]:parsedData});
            rateLimit[policy.apikey] = parsedData.ratelimitsdata;
        }
        else return {result:false,key:`Please fill apikey in ${policy.description}`};
    }
    finalData.push({rateLimit: rateLimit});
    parsedData = {};
    for (const api of retModel.apis) {
        if(!("dependencies" in api) ) return {result:false,key:`Please attach policy to the ${api.description}`};
        if(api.dependencies.length<1) return {result:false,key:`Please attach policy to the ${api.description}`};
        const keys = ["exposedpath", "backendurl","backendurlmethod","isrestapi","apiname","exposedmethod"];
        const hasAllKeys = keys.every(key => api.hasOwnProperty(key));
        if(!hasAllKeys) return {result:false,key:`Please fill required fields in ${api.description}`}
        parsedData["inputdata"] = JSON.parse(JSON.parse(api["input-output"])[0]);
        parsedData["outputdata"] = JSON.parse(JSON.parse(api["input-output"])[1]);
        inputoutput[api.exposedpath] = parsedData;
    }
    finalData.push({inputoutput: inputoutput});
    let i = 0;
    for(const api of retModel.apis) {
        let apikeys = [], jwtSub = [], addTokenSub = [];
        parsedData = {};
        if(JSON.parse(api.passthrough).length){
            let passthroughHeader = JSON.parse(api.passthrough);
            let passthrough = ''
            for(let item of passthroughHeader) {
                if(item == passthroughHeader[passthroughHeader.length-1]){
                    passthrough+=item[0];
                } else {
                    passthrough+= item[0]+',';
                }
            }
            parsedData["passthrough"] = passthrough;
        }

        if(JSON.parse(api.injected).length){
            let injectedHeader = JSON.parse(api.injected);
            let injected = {};
            for(let item of injectedHeader) {
                injected[item[0]] = item[1];
            }
            parsedData["injected"] = injected;
        }
        parsedData["exposedpath"] = `/${domain}${api.exposedpath}`;
        parsedData["backendurl"] = api.backendurl;
        parsedData["backendurlmethod"] = api.backendurlmethod;
        parsedData["exposedmethod"] = api.exposedmethod;
        parsedData["isrestapi"] = api.isrestapi;
        parsedData["customContentType"] = api.contentinput;
         for(const policy of retModel.policies) {
            if(api.dependencies.includes(policy.id)){
                apikeys.push(policy.apikey);
                policy.jwtsubject.replace(/\s/g,"").split(",").forEach((item)=>{jwtSub.push(item)});
                policy.tokensubject.replace(/\s/g,"").split(",").forEach((item)=>{addTokenSub.push(item)});
            parsedData["needsBasicAuth"] = policy.isauthenticationneeded;
            parsedData["needsToken"] = policy.isjwttokenneeded;
            parsedData["addsToken"] = policy.istokenneeded;  
         }
        }
        parsedData["apikey"] = [...new Set(apikeys)].join();
        parsedData["jwtsubject"] = [...new Set(jwtSub)].join();
        parsedData["tokensubject"] = [...new Set(addTokenSub)].join();
        apiregistrydata[parsedData["exposedpath"]] = parsedData;
    }
    finalData.push({ apiregistrydata: apiregistrydata });
    return {result:true,data:finalData};
}


function _ratelimits(policy) {
    if(policy.isauthenticationneeded == "YES") {
        return {  "persec": policy.persec,  "permin": policy.permin,  "perhour": policy.perhour,"perday": policy.perday, "permonth": policy.permonth,   "peryear": policy.peryear, "userid": policy.userid, "password": policy.password };
    }
    return {  "persec": policy.persec,  "permin": policy.permin,  "perhour": policy.perhour,"perday": policy.perday, "permonth": policy.permonth,   "peryear": policy.peryear };
}


const getModelAsFile = name => { return { data: JSON.stringify(getModel(), null, 4), mime: "application/json", filename: `${name || "api400api"}.apiboss` } }

const _getUniqueID = _ => `${Date.now()}${Math.random() * 100}`;


function _nodeAdded(nodeName, id, properties) {
    const node = idCache[id] ? idCache[id] : JSON.parse(JSON.stringify(properties)); node.nodeName = nodeName;
    if (idCache[id]) { _nodeModified(nodeName, id, properties); return; }  // node properties modified
    const name = _getNameFromDescription(node.description);
    node.name = name;
    if (nodeName == "api") { apibossmodelObj.apis.push(node); }
    else if (nodeName == "policy") { apibossmodelObj.policies.push(node); }
    node.id = id; idCache[id] = node;   // transfer ID and cache the node
    return true;
}

function _nodeRemoved(nodeName, id) {
    if (!idCache[id]) return;   // we don't know of this node
    const node = idCache[id];
    if (nodeName == "api") _arrayDelete(apibossmodelObj.apis, node);
    else if (nodeName == "policy") _arrayDelete(apibossmodelObj.policies, node);
    delete idCache[id]; // uncache
    return true;
}

function _nodeModified(nodeName, id, properties) {

    if (!idCache[id]) return false; // we don't know of this node
    for (const key in properties) { // transfer the new properties
        idCache[id][key] = properties[key];
    }
    return true;
}

const _arrayDelete = (array, element) => {
    if(element.nodeName == "policy"){
        for (const api of apibossmodelObj.apis)
        if (api.dependencies)  if (api.dependencies.includes(element.id)) api.dependencies.splice(api.dependencies.indexOf(element.id), 1);
    }
 
    if (array.includes(element)) array.splice(array.indexOf(element), 1); return element;
}

const _getNameFromDescription = description => description.split(" ")[0].split("\n")[0];

const _getDomain = (id) => { return id.indexOf("@") != -1 ? id.substring(id.indexOf("@")+1).toLowerCase() : "undefined" }

const getRootDomain = (domain) => {
    let lastIndexOfDot = domain.lastIndexOf(".");
    let indexOfDot = domain.indexOf(".");
    if(lastIndexOfDot == indexOfDot) { return domain; }
    else { return domain.substring(domain.split(".", 1).join(".").length + 1); }
}

export const apibossmodel = {
    init, loadModel, modelNodesModified, modelConnectorsModified, isConnectable,
    nodeDescriptionChanged, getModelAsFile, getModel,getparsedData,_getDomain, getRootDomain,  ADDED: "added", REMOVED: "removed", MODIFIED: "modified"
};
