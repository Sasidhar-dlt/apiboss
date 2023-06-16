/* 
 * (C) 2015 TekMonks. All rights reserved.
 * License: GPL2 - see enclosed LICENSE file.
 */

const path = require("path");

APP_ROOT = `${path.resolve(`${__dirname}/../`)}`;
LOGINAPP_CONSTANTS = require(`${__dirname}/../../loginappframework/apis/lib/loginappconstants.js`);

exports.APP_ROOT = APP_ROOT;
exports.LIB_DIR = `${APP_ROOT}/lib`;
exports.DB_DIR = path.resolve(LOGINAPP_CONSTANTS.DB_DIR);
exports.CONF_DIR = `${APP_ROOT}/conf`;
exports.APP_NAME = "apiboss";

const APPROOT = path.resolve(`${LOGINAPP_CONSTANTS.APP_ROOT}/${LOGINAPP_CONSTANTS.EMBEDDED_APP_NAME}`);
exports.APPROOT = path.resolve(APPROOT);
exports.APIDIR = path.resolve(`${APPROOT}/apis`);
exports.CONFDIR = path.resolve(`${APPROOT}/conf`);
exports.META_DIR = path.resolve(`${APPROOT}/conf/meta`);

exports.LIBDIR = path.resolve(`${APPROOT}/lib`);
exports.TRAININGPROMPTSDIR = path.resolve(`${APPROOT}/training_prompts`);
exports.RESPONSESDIR = path.resolve(`${APPROOT}/sample_responses`);
exports.TEMPDIR = path.resolve(`${APPROOT}/temp`);
exports.THIRDPARTYDIR = path.resolve(`${APPROOT}/3p`);
exports.DBDIR = path.resolve(LOGINAPP_CONSTANTS.DB_DIR);
exports.VECTORDBPATH = path.resolve(`${LOGINAPP_CONSTANTS.APP_ROOT}/db/vectordb`);
exports.MONASTERYEVENT = "__org_monkshu_monastery_event";
exports.EVENTS = Object.freeze({VECTORDB_FILE_PROCESSED: "vectordb_file_processed"});