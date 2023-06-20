/**
 * Updates a user profile. User can update their name, email etc
 * but can not update their organization to prevent organizational
 * lateral attacks. An org change must be done via a new account.
 * (C) 2015 TekMonks. All rights reserved.
 */
const totp = require(`${APP_CONSTANTS.LIB_DIR}/totp.js`);
const login = require(`${APP_CONSTANTS.API_DIR}/login.js`);
const userid = require(`${APP_CONSTANTS.LIB_DIR}/userid.js`);
const register = require(`${APP_CONSTANTS.API_DIR}/register.js`);

const idChangeListeners = [], LOGIN_LISTENERS_MEMORY_KEY = "__org_monkshu_loginapp_login_listeners";

exports.addIDChangeListener = listener => idChangeListeners.push(listener);

exports.doService = async (jsonReq, _, headers) => {
	if (!validateRequest(jsonReq)) {LOG.error("Validation failure."); return CONSTANTS.FALSE_RESULT;}
	LOG.debug("Got update request for ID: " + jsonReq.old_id);

	if ((!login.isAdmin(headers)) && (jsonReq.id.toLowerCase() != jsonReq.old_id.toLowerCase())) {	// id is enforced by the server to be reliable
		LOG.error(`Unable to update: ID: ${jsonReq.old_id}, request submitted by ID: ${jsonReq.id}, to change to new ID: ${jsonReq.new_id}. The submitter is not admin and old ID and request ID are not the same.`);
		return {...CONSTANTS.FALSE_RESULT, reason: register.REASONS.DOMAIN_ERROR};
	}

	const idEntry = await userid.existsID(jsonReq.old_id); if (!idEntry.result) {
		LOG.error(`Unable to update ID ${jsonReq.old_id}, the old_id doesn't exist.`)
		return {...CONSTANTS.FALSE_RESULT, reason: register.REASONS.ID_DOESNT_EXIST};
	}

	if (jsonReq.new_id && (!(await register.shouldAllowDomain(jsonReq, "new_id")))) {	// new domain is not allowed
		LOG.error(`Unable to update: ${idEntry.name}, ID: ${jsonReq.old_id}, to new ID: ${jsonReq.new_id}. The new domain is not allowed.`);
		return {...CONSTANTS.FALSE_RESULT, reason: register.REASONS.DOMAIN_ERROR};
	}

	if (jsonReq.totpSecret && !totp.verifyTOTP(jsonReq.totpSecret, jsonReq.totpCode)) {	// totp check
		LOG.error(`Unable to update: ${idEntry.name}, ID: ${jsonReq.old_id}, wrong totp code for the new secret.`);
		return {...CONSTANTS.FALSE_RESULT, reason: register.REASONS.OTP_ERROR};
	}

	if ( (jsonReq.approved==undefined) || (!login.isAdmin(headers)) ) jsonReq.approved = idEntry.approved;	// only admin can approve

	const successfulListeners = [], rollback = async _ => {	
		for (const idChangeListener of successfulListeners) await idChangeListener(jsonReq.new_id, jsonReq.old_id, idEntry.org);}
	let userDomain = register.getRootDomain(jsonReq, "old_id");
	if (jsonReq.old_id.toLowerCase() != jsonReq.new_id.toLowerCase()) {	// domain check, account takeover check and tell ID change listeners the user is changing their ID
		const checkNewIDAlreadyExists = await userid.existsID(jsonReq.new_id); 
		if (checkNewIDAlreadyExists && checkNewIDAlreadyExists.result) {	// account takeover check
			LOG.error(`${idEntry.name}, ID: ${jsonReq.old_id} tried to update their ID/email to another registered user, blocked.`);
			return {...CONSTANTS.FALSE_RESULT, reason: register.REASONS.ID_EXISTS};
		} else LOG.info(`${jsonReq.name}, ID: ${jsonReq.old_id} is changing their ID to ${jsonReq.new_id}.`);

		if (!register.checkOrgAndDomainMatch(jsonReq, "new_id", true)) {	// domain check
			LOG.error(`Unable to update: ${idEntry.name}, ID: ${jsonReq.old_id}, org and domain security error.`);
			return {...CONSTANTS.FALSE_RESULT, reason: register.REASONS.DOMAIN_ERROR};
		}

		// listeners informed
		for (const idChangeListener of idChangeListeners) if (!await idChangeListener(jsonReq.old_id, jsonReq.new_id, idEntry.org)) {
			await rollback(); 
			LOG.error(`Unable to update: ${idEntry.name}, ID: ${jsonReq.old_id}, an ID change listener vetoed.`); 
			return {...CONSTANTS.FALSE_RESULT, reason: register.REASONS.INTERNAL_ERROR}; 
		} else successfulListeners.push(idChangeListener);

		userDomain = register.getRootDomain(jsonReq, "new_id");	// domain may have potentially changed too
	}

	const result = await userid.updateUser(jsonReq.old_id, jsonReq.new_id, jsonReq.name||idEntry.name, 
		idEntry.org, idEntry.pwph, jsonReq.pwph, jsonReq.totpSecret||idEntry.totpsec, 
		jsonReq.role||idEntry.role, (jsonReq.approved==true||jsonReq.approved==1)?1:0, userDomain);

	if (result.result) {	// update done successfully
		LOG.info(`User updated ${result.name}, old ID: ${jsonReq.old_id}, new ID: ${jsonReq.new_id}`); 
		result.tokenflag = result.approved==1?true:false;
		if (result.tokenflag && (!(await _informLoginListeners(result)))) {	// inform login listeners and give them a chance to veto the login
			tokenflag = false; result.result = false; 
			if (result.reason == REASONS.OK || (!result.reason)) result.reason = REASONS.UNKNOWN;	// if the listener didn't add a reason for veto, then make the reason unknown
		}
		return {...CONSTANTS.TRUE_RESULT, ...result, reason: undefined,domain:result.domain};
	}
	else {	// DB or internal error
		LOG.error(`Unable to update: ${idEntry.name}, ID: ${jsonReq.old_id}, DB error`);
		if (jsonReq.old_id.toLowerCase() != jsonReq.new_id.toLowerCase()) rollback();	// rollback ID change if applicable
		return {...CONSTANTS.FALSE_RESULT, reason: register.REASONS.INTERNAL_ERROR};
	}
}

exports.addLoginListener = (modulePath, functionName) => {
	const loginlisteners = CLUSTER_MEMORY.get(LOGIN_LISTENERS_MEMORY_KEY, []);
	loginlisteners.push({modulePath, functionName});
	CLUSTER_MEMORY.set(LOGIN_LISTENERS_MEMORY_KEY, loginlisteners);
}

const _informLoginListeners = async result => {
	const loginlisteners = CLUSTER_MEMORY.get(LOGIN_LISTENERS_MEMORY_KEY, []);
	for (const listener of loginlisteners) {
		const listenerFunction = require(listener.modulePath)[listener.functionName];
		if (!(await listenerFunction(result))) return false; return true; 
	}
}

const validateRequest = jsonReq => (jsonReq && jsonReq.id && jsonReq.old_id && jsonReq.new_id);
