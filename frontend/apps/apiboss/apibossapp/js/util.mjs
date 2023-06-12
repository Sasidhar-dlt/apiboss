/**
 * Uploads a single file.
 * @param accept Optional: The MIME type to accept. Default is "*".
 * @param type Optional: Can be "text" or "binary". Default is "text".
 * @returns A promise which resolves to {name - filename, data - string or ArrayBuffer} or rejects with error
 */
function uploadAFile(accept = "*/*", type = "text") {
    const uploadFiles = _ => new Promise(resolve => {
        const uploader = document.createElement("input"); uploader.setAttribute("type", "file");
        uploader.style.display = "none"; uploader.setAttribute("accept", accept);

        document.body.appendChild(uploader); uploader.onchange = _ => { resolve(uploader.files); document.body.removeChild(uploader); };
        uploader.click();
    });

    return new Promise(async (resolve, reject) => {
        const file = (await uploadFiles())[0]; if (!file) { reject("User cancelled upload"); return; }
        if (accept == 'application/javascript') {
            if (file.type == 'application/x-javascript' || file.type == 'text/javascript') {
                try { resolve(await getFileData(file, type)); } catch (err) { reject(err); }
            } else { reject("Only JS files are allowed"); return; }
        }
        else { try { resolve(await getFileData(file, type)); } catch (err) { reject(err); } }
    });
}

/**
 * Reads the given file and returns its data.
 * @param file The File object
 * @param type Optional: Can be "text" or "binary". Default is "text".
 * @returns A promise which resolves to {name - filename, data - string or ArrayBuffer} or rejects with error
 */
function getFileData(file, type = "text") {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = event => resolve({ name: file.name, data: event.target.result });
        reader.onerror = _event => reject(reader.error);
        if (type.toLowerCase() == "text") reader.readAsText(file); else reader.readAsArrayBuffer(file);
    });
}

export const utilMonastery = { uploadAFile, getFileData }