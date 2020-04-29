import * as paper from "paper";
import CodeMirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/addon/display/fullscreen.css";
import "codemirror/addon/hint/show-hint.js";
import "codemirror/addon/hint/show-hint.css";
import "codemirror/addon/hint/javascript-hint.js";
import "codemirror/theme/neat.css";
import "codemirror/mode/javascript/javascript.js";
import { textArea } from "./utils/dom";
import { PaneerDOM } from "./paneer/paneerdom";
import { Serializable } from "./components/pane";
import { Keyboard } from "./keyboard";
import { GrafteHistory } from "../tools/history";

export class Editor extends PaneerDOM implements Serializable {
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

  constructor(keyboard: Keyboard, history: GrafteHistory) {
    super();
    this.editor = CodeMirror(this.element, this.config);
    this.style.fontSize = "2em";
    this.style.height = "100%";
    this.editorDiv = this.element.firstElementChild as HTMLElement;

    keyboard.bind("ctrl+enter", { global: true }, (e: KeyboardEvent) => {
      e.preventDefault();
      this.execute();
      history.commit();
    });

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

  serialize() {
    return {
      type: "editor",
      value: this.editor.getValue(),
    };
  }

  static deserialize(raw: any, deserializer: (raw: { type: string }) => any): Editor {
    //@ts-ignore
    const ctx: any = window.ctx;
    const node = new Editor(ctx.keyboard, ctx.history);
    node.editor.setValue(raw.value);
    return node;
  }
}


export class DOMConsole extends PaneerDOM implements Serializable {
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

  serialize() {
    return {
      type: "domconsole"
    };
  }

  static deserialize(raw: any, deserializer: (raw: { type: string }) => any): DOMConsole {
    return new DOMConsole();
  }
}