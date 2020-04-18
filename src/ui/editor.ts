import * as paper from "paper";
import CodeMirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/addon/display/fullscreen.css";
import "codemirror/addon/hint/show-hint.js";
import "codemirror/addon/hint/show-hint.css";
import "codemirror/addon/hint/javascript-hint.js";
import "codemirror/theme/neat.css";
import "codemirror/mode/javascript/javascript.js";
import { div, textArea } from "./utils/dom";
import { PaneerDOM } from "./paneer/paneerdom";

export class Editor extends PaneerDOM {
  label = "Code";
  public editor: CodeMirror.Editor;
  editorDiv: HTMLElement;

  config: CodeMirror.EditorConfiguration = {
    tabSize: 4,
    lineNumbers: true,
    // TODO(P3) expose paper for code hinting
    mode: {name: "javascript", globalVars: true},
    extraKeys: {"Ctrl-Space": "autocomplete"},
    theme: "neat",
    viewportMargin: Infinity,
    
    // TODO(P3) maybe enable...
    //inputStyle: "contenteditable"
  };

  constructor(sizing: string) {
    super();
    this.editor = CodeMirror(this.element, this.config);
    this.style.fontSize = "2em";
    this.style.height = "100%";
    this.editorDiv = this.element.firstElementChild as HTMLElement;

    this.editor.setSize("100%","100%");
    this.editor.refresh();
  }

  resize() {
    super.resize();
    this.editor.refresh();
  }

  execute() {
    try {
      paper.execute(this.editor.getValue());
    } catch(error) {
      const e = error as Error;
      console.log(e.name, e.message);
    }
  }
}


export class DOMConsole extends PaneerDOM {
  label = "Console";

  constructor() {
    super(textArea({readonly: "true"}));
    const el = this.element as HTMLTextAreaElement; 
    this.element.style.width = "100%";
    this.element.style.height = "100%";
    this.element.style.border = "none";
    this.element.style.resize = "none";

    // @ts-ignore
    window.console = {
      log:(...optionalParams: any[]) => {
        el.value += ("> " + JSON.stringify(optionalParams) + "\n");
        el.scrollTop = el.scrollHeight;
      },
      error:(...optionalParams: any[]) => {
        el.value += ("> " + JSON.stringify(optionalParams) + "\n");
        el.scrollTop = el.scrollHeight;
      },
      clear: () => { el.value = ""},
      warn:(...optionalParams: any[]) => {
        el.value += ("> " + JSON.stringify(optionalParams) + "\n");
        el.scrollTop = el.scrollHeight;
      },
    }
  }
}