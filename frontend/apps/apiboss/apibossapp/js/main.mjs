/**
 * For main.html file.
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
import {i18n} from "/framework/js/i18n.mjs";
import {loginmanager} from "./loginmanager.mjs"
import {router} from "/framework/js/router.mjs";
import {session} from "/framework/js/session.mjs";
import {securityguard} from "/framework/js/securityguard.mjs";
import {apimanager as apiman} from "/framework/js/apimanager.mjs";
import {blackboard} from "/framework/js/blackboard.mjs"; 
import { display_box } from "../components/display-box/display-box.mjs";



const dialog = display_box;


async function init(viewURL,viewPage) {
    window.monkshu_env.frameworklibs.blackboard = blackboard;
    const view = (await import(`${viewURL}/view.mjs`)).view; await view.init(); 

    // doing this here instead of adding pageGenerator directly to the HTML ensures any i18n or 
    // other changes that the view page needs, are incorporated into the application before 
    // the pageGenerator runs as we await view.init() in the previous line.
    await import ("/framework/components/page-generator/page-generator.mjs");
    const pageGenerator = document.createElement("page-generator"); 
    if(viewPage=="home")  pageGenerator.setAttribute("file", `${viewURL}/page/${viewPage}.page`);
    else if(viewPage=="developer") pageGenerator.setAttribute("file", `${viewURL}/page/${viewPage}.page`);
    else  pageGenerator.setAttribute("file", `${viewURL}/page/view.page`);
    document.body.appendChild(pageGenerator);
}



function toggleMenu() {
    const imgElement = document.querySelector("span#menubutton > img"), menuIsOpen = imgElement.src.indexOf("menu.svg") != -1;
    const menuDiv = document.querySelector("div#menu");

    if (menuIsOpen) {    
        menuDiv.classList.add("visible"); menuDiv.style.maxHeight = menuDiv.scrollHeight+"px"; 
        imgElement.src = "./img/menu_close.svg";
    } else {
        menuDiv.classList.remove("visible"); menuDiv.style.maxHeight = 0; 
        imgElement.src = "./img/menu.svg";
    }
}

async function changePassword(_element) {
    display_box().showDialog(`${APP_CONSTANTS.DIALOGS_PATH}/changepass.html`, true, true, {}, "dialog", ["p1","p2"], async result=>{
        const done = await loginmanager.changepassword(session.get(APP_CONSTANTS.USERID), result.p1);
        if (!done) display_box().error("dialog", await i18n.get("PWCHANGEFAILED"));
        else { display_box().hideDialog("dialog"); _showMessage(await i18n.get("PWCHANGED")); }
    });
}

async function showOTPQRCode(_element) {
    const id = session.get(APP_CONSTANTS.USERID).toString(); 
    const totpSec = await apiman.rest(APP_CONSTANTS.API_GETTOTPSEC, "GET", {id}, true, false); if (!totpSec || !totpSec.result) return;
    const qrcode = await _getTOTPQRCode(totpSec.totpsec);
    display_box().showDialog(`${APP_CONSTANTS.DIALOGS_PATH}/changephone.html`, true, true, {img:qrcode}, "dialog", ["otpcode"], async result => {
        const otpValidates = await apiman.rest(APP_CONSTANTS.API_VALIDATE_TOTP, "GET", {totpsec: totpSec.totpsec, otp:result.otpcode, id}, true, false);
        if (!otpValidates||!otpValidates.result) display_box().error("dialog", await i18n.get("PHONECHANGEFAILED"));
        else display_box().hideDialog("dialog");
    });
}

async function changeProfile(_element) {
    const sessionUser = loginmanager.getSessionUser();
    display_box().showDialog(`${APP_CONSTANTS.DIALOGS_PATH}/resetprofile.html`, true, true, sessionUser, "dialog", 
            ["name", "id", "org"], async result => {
        
        if (await loginmanager.registerOrUpdate(sessionUser.id, result.name, result.id, null, result.org)) display_box().hideDialog("dialog");
        else display_box().error("dialog", await i18n.get("PROFILECHANGEFAILED"));
    });
}

function showLoginMessages() {
    const data = router.getCurrentPageData();
    if (data.showDialog) { _showMessage(data.showDialog.message); delete data.showDialog; router.setCurrentPageData(data); }
}

const logoutClicked = _ => loginmanager.logout();

const interceptPageData = _ => router.addOnLoadPageData(APP_CONSTANTS.CHOOSER_HTML, async data => {   // set admin role if applicable
    if (securityguard.getCurrentRole()==APP_CONSTANTS.ADMIN_ROLE) data.admin = true; 
});

async function _getTOTPQRCode(key) {
	const title = await i18n.get("Title");
	await $$.require("./js/3p/qrcode.min.js");
	return new Promise(resolve => QRCode.toDataURL(
	    `otpauth://totp/${title}?secret=${key}&issuer=TekMonks&algorithm=sha1&digits=6&period=30`, (_, data_url) => resolve(data_url)));
}

const _showMessage = message => display_box().showMessage(`${APP_CONSTANTS.DIALOGS_PATH}/message.html`, {message}, "dialog");
export const main = {init,toggleMenu, changePassword, showOTPQRCode, showLoginMessages, changeProfile, logoutClicked, 
    interceptPageData}