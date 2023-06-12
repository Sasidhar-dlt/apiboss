/** 
 * (C) 2020 TekMonks. All rights reserved.
 */
import {util} from "/framework/js/util.mjs";
import {newRibbonButton} from "../../lib/ribbonButton.mjs";
import {settings as setSettings} from "../../../../js/settings.mjs"

const MODULE_PATH = util.getModulePath(import.meta);

const parentNode = newRibbonButton();
const init = async _ => { await parentNode.init("settings", MODULE_PATH,  {click: _=>setSettings.openDialog()}); return true; }
    
export const settings = {init, ...parentNode};