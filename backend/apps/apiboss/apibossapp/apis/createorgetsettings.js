const fs = require("fs");
const userid = require(`${APP_CONSTANTS.LIB_DIR}/userid.js`);
const APIBOSS_CONSTANTS = LOGINAPP_CONSTANTS.ENV.APIBOSSAPP_CONSTANTS;


 
exports.doService = async jsonReq => {
    jsonReq = jsonReq.data;
    if (!validateRequest(jsonReq)) { LOG.error(`Bad Data or request`); return { data: {result:false} }; }

    const userslist = await userid.getUsersForOrgOrSuborg(jsonReq.org);
    if(userslist.result&&userslist.users.length>0){
    const result = userslist.users.some(user=>user.id == jsonReq.id && user.role=="admin")
    if(!fs.existsSync(`${APIBOSS_CONSTANTS.CONFDIR}/settings.json`)) fs.writeFileSync(`${APIBOSS_CONSTANTS.CONFDIR}/settings.json`,JSON.stringify({}));
    const jsonData = fs.readFileSync(`${APIBOSS_CONSTANTS.CONFDIR}/settings.json`, 'utf8');
    const data = JSON.parse(jsonData);
    if (!data.hasOwnProperty(jsonReq.org)) {
        data[jsonReq.org] = {server:"",port:"",apikey:"",package:"",publicapikey:"",adminid:"",adminpassword:""};
        fs.writeFileSync(`${APIBOSS_CONSTANTS.CONFDIR}/settings.json`,JSON.stringify(data, null, 4))
        return { data: {result:result,data:{server:"",port:"",apikey:"",package:"",publicapikey:"",adminid:"",adminpassword:""}}};
    }
    else  return { data: {result:result,data:data[jsonReq.org]}};
    }
    else return{data: {result:false}}
 
}


const validateRequest = jsonReq =>  jsonReq.org && jsonReq.id ;