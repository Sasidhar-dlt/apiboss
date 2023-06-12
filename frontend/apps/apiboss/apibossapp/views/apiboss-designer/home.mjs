/**
 * For home.html file.
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
import { serverManager } from "./js/serverManager.js"
import { session } from "/framework/js/session.mjs";
import {blackboard} from "/framework/js/blackboard.mjs";

const MSG_FILE_UPLOADED = "FILE_UPLOADED";

async function init(viewURL) {
 

    // doing this here instead of adding pageGenerator directly to the HTML ensures any i18n or 
    // other changes that the view page needs, are incorporated into the application before 
    // the pageGenerator runs as we await view.init() in the previous line.
    await import ("/framework/components/page-generator/page-generator.mjs");
    const pageGenerator = document.createElement("page-generator"); 
    pageGenerator.setAttribute("file", `${viewURL}/page/home.page`);
    document.body.appendChild(pageGenerator);

   
}

async function loadDefaultMeta(){
    const serverDetails = JSON.parse(session.get("__org_server_details"));
   const metaDataResult = await serverManager.getMetaData(serverDetails.name,serverDetails.host,serverDetails.port, serverDetails.adminid,serverDetails.adminpassword);
   if (metaDataResult.result) blackboard.broadcastMessage(MSG_FILE_UPLOADED, {name: serverDetails.name, data: JSON.stringify(metaDataResult.model)});
}


export const home = {init,loadDefaultMeta}
