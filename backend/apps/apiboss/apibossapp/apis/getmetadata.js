const fs = require("fs");
const userid = require(`${APP_CONSTANTS.LIB_DIR}/userid.js`);
const APIBOSS_CONSTANTS = LOGINAPP_CONSTANTS.ENV.APIBOSSAPP_CONSTANTS;

exports.doService = async jsonReq => {
  if (!validateRequest(jsonReq)) { LOG.error(`Bad Request`); return { result: false }; }
  else {
    const userslist = await userid.getUsersForOrgOrSuborg(jsonReq.org);
    if (userslist.result && userslist.users.length > 0) {
      const result = userslist.users.some(user => user.id == jsonReq.id);
      if(!jsonReq.isPublicServer) {
        if(!fs.existsSync(`${APIBOSS_CONSTANTS.META_DIR}/${jsonReq.org}/${jsonReq.name}_${jsonReq.server}_${jsonReq.port}.json`)) return { result: false }
      } else {
        if(!fs.existsSync(`${APIBOSS_CONSTANTS.META_DIR}/public/${jsonReq.org}/${jsonReq.name}_${jsonReq.server}_${jsonReq.port}.json`)) return { result: false }
      }
      if (result) return  { result: true, data: _getMetadata(jsonReq),name:jsonReq.org,isPublic:jsonReq.isPublicServer}
      else return { result: false};

    }
    else return { result: false };
  }
}

function _getMetadata(jsonReq) {
  let filedata;
  if(!jsonReq.isPublicServer) {
    filedata = fs.readFileSync(`${APIBOSS_CONSTANTS.META_DIR}/${jsonReq.org}/${jsonReq.name}_${jsonReq.server}_${jsonReq.port}.json`);
  } else {
    filedata = fs.readFileSync(`${APIBOSS_CONSTANTS.META_DIR}/public/${jsonReq.org}/${jsonReq.name}_${jsonReq.server}_${jsonReq.port}.json`);
  }
  return JSON.parse(filedata);
}

const validateRequest = jsonReq => jsonReq.org && jsonReq.id && jsonReq.name && jsonReq.server && jsonReq.port ? true : false;