/* 
 * (C) 2018 TekMonks. All rights reserved.
 * License: See enclosed license file.
 */
import {util} from "/framework/js/util.mjs";
import {router} from "/framework/js/router.mjs";
import {loginmanager} from "../../js/loginmanager.mjs";
import {monkshu_component} from "/framework/js/monkshu_component.mjs";
import { loader } from "../../js/loader.mjs";
import { password_box } from "../password-box/password-box.mjs";

const COMPONENT_PATH = util.getModulePath(import.meta);

async function elementConnected(element) {
	let data = {};

	if (element.getAttribute("styleBody")) data.styleBody = `<style>${element.getAttribute("styleBody")}</style>`;
	data.minlength = element.getAttribute("minlength");
	
	if (element.id) {
		if (!login_box.datas) login_box.datas = {}; login_box.datas[element.id] = data;
	} else login_box.data = data;
}

async function signin(signInButton) {	
	const shadowRoot = login_box.getShadowRootByContainedElement(signInButton); _hideErrors(shadowRoot);
	if (!_validateForm(shadowRoot)) return;	// HTML5 validation failed
	await loader.beforeLoading();_disableButton(signInButton);

	const userid = shadowRoot.querySelector("#userid").value.toLowerCase();
	const pass = password_box.getShadowRootByHostId("pass").querySelector("#pwinput").value;
	const otp = shadowRoot.querySelector("#otp").value;
	const routeOnSuccess = login_box.getHostElement(signInButton).getAttribute("routeOnSuccess");
	const routeOnNotApproved = login_box.getHostElement(signInButton).getAttribute("routeOnNotApproved");

	_handleLoginResult(await loginmanager.signin(userid, pass, otp), shadowRoot, routeOnSuccess, routeOnNotApproved,signInButton);
}

async function checkTotpFormat(event) {
	var charCode = (typeof event.which == "undefined") ? event.keyCode : event.which;
  	var charStr = String.fromCharCode(charCode);

  	if (!charStr.match(/^[0-9]+$/)) event.preventDefault();
}

async function resetAccount(element) {
	const shadowRoot = login_box.getShadowRootByContainedElement(element);
	shadowRoot.getElementById("notifier").style.display = "none";

	const result = await loginmanager.reset(shadowRoot.getElementById("userid").value);
	if ((!result) || (!result.result)) shadowRoot.getElementById("notifier3").style.display = "inline";
	else shadowRoot.getElementById("notifier2").style.display = "inline";
}

function _validateForm(shadowRoot) {
	const userid = shadowRoot.querySelector("input#userid"), pass = shadowRoot.querySelector("#pass"), otp = shadowRoot.querySelector("#otp");
	if (!userid.checkValidity()) {userid.reportValidity(); return false;}
	if (!pass.checkValidity()) {pass.reportValidity(); return false;}
	if (!otp.checkValidity()) {otp.reportValidity(); return false;}
	return true;
}

function _hideErrors(shadowRoot) {
	shadowRoot.getElementById("notifier").style.display = "none";
	shadowRoot.getElementById("notifier2").style.display = "none";
}

function _handleLoginResult(result, shadowRoot, routeOnSuccess, routeOnNotApproved,signInButton) {
	 loader.afterLoading();_enableButton(signInButton);

	switch (result) {
		case loginmanager.ID_OK: router.loadPage(routeOnSuccess); break;
		case loginmanager.ID_FAILED: shadowRoot.getElementById("notifier").style.display = "inline"; break;
		case loginmanager.ID_NOT_YET_APPROVED: router.loadPage(routeOnNotApproved); break;
		default: shadowRoot.getElementById("notifier").style.display = "inline"; break;
	}
}
function _disableButton(element){ element.style["pointer-events"]="none"; element.style["opacity"]=0.4; }
function _enableButton(element){ element.style["pointer-events"]=""; element.style["opacity"]=""; }

const trueWebComponentMode = true;	// making this false renders the component without using Shadow DOM
export const login_box = {signin, resetAccount, trueWebComponentMode, elementConnected, checkTotpFormat}
monkshu_component.register("login-box", `${APP_CONSTANTS.APP_PATH}/components/login-box/login-box.html`, login_box);
