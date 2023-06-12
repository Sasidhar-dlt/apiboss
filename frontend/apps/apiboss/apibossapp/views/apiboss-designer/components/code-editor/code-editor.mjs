/**
 * Text editor component
 * (C) 2022 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
import { util } from "/framework/js/util.mjs";
import { monkshu_component } from "/framework/js/monkshu_component.mjs";

const COMPONENT_PATH = util.getModulePath(import.meta), DIALOG = window.monkshu_env.components["dialog-box"],
  P3_LIBS = [
    `${COMPONENT_PATH}/3p/codemirror/lib/codemirror.js`,
    `${COMPONENT_PATH}/3p/codemirror/addon/selection/active-line.js`,
    `${COMPONENT_PATH}/3p/codemirror/addon/edit/matchbrackets.js`,
    `${COMPONENT_PATH}/3p/codemirror/addon/display/placeholder.js`,
  ],
  P3_LIBS_JAVASCRPT = [
    `${COMPONENT_PATH}/3p/codemirror/mode/javascript/javascript.js`,
    `${COMPONENT_PATH}/3p/codemirror/addon/lint/javascript-lint.js`,
    `${COMPONENT_PATH}/3p/jshint/jshint.js`,
    `${COMPONENT_PATH}/3p/codemirror/addon/lint/lint.js`
  ],
  P3_LIBS_JAVA = [
    `${COMPONENT_PATH}/3p/codemirror/mode/clike/clike.js`
  ],
  P3_LIBS_CURL = [`${COMPONENT_PATH}/3p/codemirror/mode/shell/shell.js`];

async function elementConnected(element) {
  Object.defineProperty(element, "value", {
    get: (_) => _getValue(element),
    set: (value) => _setValue(value, element),
  });

  const data = {
    componentPath: COMPONENT_PATH,
    styleBody: element.getAttribute("styleBody") ? `<style>${element.getAttribute("styleBody")}</style>` : undefined,
    showToolbar: element.getAttribute("showToolbar")?.toLowerCase() == "false" ? undefined : true
  };

  if (element.id)
    if (!code_editor.datas) {
      code_editor.datas = {};
      code_editor.datas[element.id] = data;
    } else code_editor.data = data;
}
/**
 * Element was rendered
 * @param element Host element
 */
async function elementRendered(element) {
  const MODE = element.getAttribute("mode");
  if (MODE == "javascript") {
    for (const p3lib of P3_LIBS) await $$.require(p3lib); // load all the comman libs we need
    for (const p3libJS of P3_LIBS_JAVASCRPT) await $$.require(p3libJS); // load all the JS related libs we need
    setTimeout((_) => {
      // apparently we need timeout for CM to load properly
      const editorElement = code_editor.getShadowRootByHost(element).querySelector("textarea#texteditor"),
        cm = CodeMirror((cmElement) => editorElement.parentNode.replaceChild(cmElement, editorElement),
          {
            lineNumbers: true,
            gutter: true,
            lineWrapping: true,
            styleActiveLine: true,
            styleActiveSelected: true,
            mode: "javascript",
            lint: { selfContain: true },
            gutters: ["CodeMirror-lint-markers"],
            matchBrackets: true,
            placeholder: "// JS script",
            theme: "ambiance",
            readOnly: true,
            className: "readOnly",
          }
        );
      const memory = code_editor.getMemoryByHost(element);
      memory.editor = cm;
      cm.setSize("100%", "100%");
      if (memory && memory["data"]) { cm.getDoc().setValue(memory["data"]); memory["data"] = false }
    }, 10);

  } else if (MODE == "java") {
    for (const p3lib of P3_LIBS) await $$.require(p3lib); // load all the comman libs we need
    for (const p3libJS of P3_LIBS_JAVA) await $$.require(p3libJS); // load all the JS related libs we need
    setTimeout((_) => {
      // apparently we need timeout for CM to load properly
      const editorElement = code_editor.getShadowRootByHost(element).querySelector("textarea#texteditor"),
        cm = CodeMirror((cmElement) => editorElement.parentNode.replaceChild(cmElement, editorElement),
          {
            lineNumbers: true,
            gutter: true,
            lineWrapping: true,
            styleActiveLine: true,
            styleActiveSelected: true,
            mode: "text/x-java",
            gutters: ["CodeMirror-lint-markers"],
            matchBrackets: true,
            theme: "ambiance",
            readOnly: true,
            className: "readOnly",
          }
        );
      const memory = code_editor.getMemoryByHost(element);
      memory.javaeditor = cm;
      cm.setSize("100%", "100%");
      if (memory && memory["data"]) { cm.getDoc().setValue(memory["data"]); memory["data"] = false }
    }, 10);
  }
  else if (MODE == "curl") {
    for (const p3lib of P3_LIBS) await $$.require(p3lib); // load all the comman libs we need
    for (const p3libJS of P3_LIBS_CURL) await $$.require(p3libJS); // load all the JS related libs we need
    setTimeout((_) => {
      // apparently we need timeout for CM to load properly
      const editorElement = code_editor.getShadowRootByHost(element).querySelector("textarea#texteditor"),
        cm = CodeMirror((cmElement) => editorElement.parentNode.replaceChild(cmElement, editorElement),
          {
            lineNumbers: true,
            gutter: true,
            lineWrapping: true,
            styleActiveLine: true,
            styleActiveSelected: true,
            mode: "text/x-sh",
            gutters: ["CodeMirror-lint-markers"],
            matchBrackets: true,
            theme: "ambiance",
            readOnly: true,
            className: "readOnly",
          }
        );
      const memory = code_editor.getMemoryByHost(element);
      memory.shelleditor = cm;
      cm.setSize("100%", "100%");
      if (memory && memory["data"]) { cm.getDoc().setValue(memory["data"]); memory["data"] = false }
    }, 10);
  }
}

async function setValue(value, host, mode) {

  const memory = await code_editor.getMemoryByHost(host);
  memory["data"] = value;
  if (memory.editor && mode == "javascript") {
    let cm = memory.editor
    cm.getDoc().setValue(memory["data"]); memory["data"] = false;
    return
  }
  else if (memory.javaeditor && mode == "java") {
    let cm = memory.javaeditor;
    cm.getDoc().setValue(memory["data"]); memory["data"] = false;
    return
  }
  else if (memory.shelleditor && mode == "curl") {
    let cm = memory.shelleditor;
    cm.getDoc().setValue(memory["data"]); memory["data"] = false;
    return
  }
}

export const code_editor = { trueWebComponentMode: true, elementConnected, elementRendered, setValue };

monkshu_component.register("code-editor", `${COMPONENT_PATH}/code-editor.html`, code_editor);
