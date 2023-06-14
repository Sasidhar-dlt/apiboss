const fs = require("fs");
const userid = require(`${APP_CONSTANTS.LIB_DIR}/userid.js`);
const APIBOSS_CONSTANTS = LOGINAPP_CONSTANTS.ENV.APIBOSSAPP_CONSTANTS;


exports.doService = async jsonReq => {
    jsonReq = jsonReq.data;
   if (!validateRequest(jsonReq)) { LOG.error(`Bad metadata or request`); return { result:false }; }
   else{
    const userslist = await userid.getUsersForOrgOrSuborg(jsonReq.org);
    if(userslist.result&&userslist.users.length>0){
    const result = userslist.users.some(user=>user.id == jsonReq.id &&user.role=="admin")
    _generateMetadata(jsonReq);
    return { result:result };
    }
    else return { result:false };
   }
}

function _generateMetadata(jsonReq) {
    if(jsonReq.isPublicServer) {
    if(!fs.existsSync(APIBOSS_CONSTANTS.META_DIR)) fs.mkdirSync(APIBOSS_CONSTANTS.META_DIR);
    if(!fs.existsSync(`${APIBOSS_CONSTANTS.META_DIR}/public`)) fs.mkdirSync(`${APIBOSS_CONSTANTS.META_DIR}/public`)
    if(!fs.existsSync(`${APIBOSS_CONSTANTS.META_DIR}/public/${jsonReq.org}`)) fs.mkdirSync(`${APIBOSS_CONSTANTS.META_DIR}/public/${jsonReq.org}`)
    if(!fs.existsSync(`${APIBOSS_CONSTANTS.META_DIR}/public/${jsonReq.org}/${jsonReq.name}_${jsonReq.server}_${jsonReq.port}.json`)){
        fs.writeFileSync(`${APIBOSS_CONSTANTS.META_DIR}/public/${jsonReq.org}/${jsonReq.name}_${jsonReq.server}_${jsonReq.port}.json`, JSON.stringify({}));
        _writeFile(jsonReq);
    } else {
        _writeFile(jsonReq);
    }
    }
    else {
        if(!fs.existsSync(APIBOSS_CONSTANTS.META_DIR)) fs.mkdirSync(APIBOSS_CONSTANTS.META_DIR);
        if(!fs.existsSync(`${APIBOSS_CONSTANTS.META_DIR}/${jsonReq.org}`)) fs.mkdirSync(`${APIBOSS_CONSTANTS.META_DIR}/${jsonReq.org}`)
        if(!fs.existsSync(`${APIBOSS_CONSTANTS.META_DIR}/${jsonReq.org}/${jsonReq.name}_${jsonReq.server}_${jsonReq.port}.json`)){
        fs.writeFileSync(`${APIBOSS_CONSTANTS.META_DIR}/${jsonReq.org}/${jsonReq.name}_${jsonReq.server}_${jsonReq.port}.json`, JSON.stringify({}));
        _writeFile(jsonReq);
    } else {
        _writeFile(jsonReq);
    }
    }
}
 

 function _writeFile(jsonReq){
    if(jsonReq.isPublicServer){
        fs.writeFileSync(`${APIBOSS_CONSTANTS.META_DIR}/public/${jsonReq.org}/${jsonReq.name}_${jsonReq.server}_${jsonReq.port}.json`, JSON.stringify(jsonReq.metadata, null, 4));
    } else {
        fs.writeFileSync(`${APIBOSS_CONSTANTS.META_DIR}/${jsonReq.org}/${jsonReq.name}_${jsonReq.server}_${jsonReq.port}.json`, JSON.stringify(jsonReq.metadata, null, 4));
    }

 }

const validateRequest = jsonReq => jsonReq.metadata && jsonReq.org && jsonReq.name && jsonReq.id &&jsonReq.server && jsonReq.port? true : false;