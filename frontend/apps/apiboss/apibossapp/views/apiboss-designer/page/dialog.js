import {router} from "/framework/js/router.mjs";


const adminDialog = async () => {
    if (!document.querySelector('.admindialog')) {
        const div = document.createElement('div');
        div.classList.add("admindialog");
        div.innerHTML = `<div class="admincontainer"> <span id="orgtext">This organisation has published no API's yet</span>  <img  id="adminimg" src="${APP_CONSTANTS.IMG_SRC}/admin.svg" alt="SVG Icon"> <span id = "clicktext">click on icon to publish new API's</span> </div>`;
        document.body.appendChild(div);
     }

     let img = document.getElementById("adminimg");

     img.addEventListener("click", async function(){
        await router.navigate(`${APP_CONSTANTS.MAIN_HTML}?view=apiboss-designer&page=home`);
     });
 

}

const userDialog = async () => {
    if (!document.querySelector('.userdialog')) {
        const div = document.createElement('div');
        div.classList.add("userdialog");
        div.innerText = "This organisation has no published API's yet";
        document.body.appendChild(div);
    }
}

const apiconfigureDialog = async () => {
    if (!document.querySelector('.apiconfigureDialog')) {
        const div = document.createElement('div');
        div.classList.add("apiconfigureDialog");
        div.innerHTML = `<div class="apiconfigurecontainer"> <span id="orgtext">APIs are not yet configured</span>  <img  id="apiconfigureimg" src="${APP_CONSTANTS.IMG_SRC}/noapis.svg" alt="SVG Icon"></div>`;
        document.body.appendChild(div);
     }
}
export const dialog = { adminDialog, userDialog, apiconfigureDialog }