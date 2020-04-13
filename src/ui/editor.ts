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

  config: CodeMirror.EditorConfiguration = {
    tabSize: 4,
    lineNumbers: true,
    // TODO(P3) expose paper for code hinting
    mode: {name: "javascript", globalVars: true},
    extraKeys: {"Ctrl-Space": "autocomplete"},
    theme: "neat",
    //viewportMargin: Infinity,
    
    // TODO(P3) maybe enable...
    //inputStyle: "contenteditable"
  };

  constructor(sizing: string) {
    super(div({}, []));
    this.editor = CodeMirror(this.element, this.config);
    this.element.style.height = "100%";
    this.element.style.fontSize = "2em";
    this.element.style.overflow = "scroll";
    (this.element.firstElementChild as HTMLElement).style.height = "0px";
    this.editor.refresh();
  }

  resize() {
    super.resize();
    // TODO (P1) figure out why this isn't working
    // Without resetting height to 0 shit doesn't work :.
    //(this.element.firstElementChild as HTMLElement).style.height = "0px";
    //window.requestAnimationFrame(() => {
      const rrr = this.element.getBoundingClientRect();
      (this.element.firstElementChild as HTMLElement).style.height = `${rrr.height}px`;
      this.editor.refresh();
    //});
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