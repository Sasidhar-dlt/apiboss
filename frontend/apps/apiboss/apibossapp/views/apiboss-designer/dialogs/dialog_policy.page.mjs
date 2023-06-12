/**
 * Returns the page to display for the object dialog.
 * (C) 2021 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */

import {util} from "/framework/js/util.mjs";


function getPage(viewPath, dialogProperties) {
    if (!('apikey' in dialogProperties))  dialogProperties.apikey = util.generateUUID();
    else if(dialogProperties?.apikey && dialogProperties.apikey=="") dialogProperties.apikey = util.generateUUID();
    return {page: `${viewPath}/dialogs/dialog_policy.page`, dialogProperties};
}



export const page = {getPage};