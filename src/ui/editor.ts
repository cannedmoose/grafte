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
import { PaneerLeaf } from "./paneer/paneer";

export class Editor extends PaneerLeaf {
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
    super({element: div({}, [])}, sizing);
    this.editor = CodeMirror(this.pane.element, this.config);
    this.pane.element.style.height = "100%";
    this.pane.element.style.fontSize = "2em";
    this.pane.element.style.overflow = "scroll";
    (this.pane.element.firstElementChild as HTMLElement).style.height = "0px";
    this.editor.refresh();
  }

  resize() {
    super.resize();
    // TODO (P1) figure out why this isn't working
    // Without resetting height to 0 shit doesn't work :.
    (this.pane.element.firstElementChild as HTMLElement).style.height = "0px";
    window.requestAnimationFrame(() => {
      const rrr = this.element.getBoundingClientRect();
      (this.pane.element.firstElementChild as HTMLElement).style.height = `${rrr.height}px`;
      this.editor.refresh();
    });
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


export class DOMConsole extends PaneerLeaf {
  constructor(sizing: string) {
    const el =textArea({readonly: "true"});
    super({element: el}, sizing);
    this.pane.element.style.width = "100%";
    this.pane.element.style.height = "100%";
    this.pane.element.style.resize = "none";

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
      clear: () => { el.value = ""}
    }
  }
}