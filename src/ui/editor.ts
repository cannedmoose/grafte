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
import { Tab } from "./components/panes/pane";
import { Keyboard } from "./keyboard";
import { GrafteHistory } from "../tools/history";
import { AttachedPaneer } from "./paneer/paneer";
import { Pan } from "./paneer/template";
import { Serializer } from "./utils/deserializer";

export class Editor extends AttachedPaneer implements Tab {
  tab: true = true;
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
    super(Pan/*html*/`<div></div>`);
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
    window.requestAnimationFrame(() => this.editor.refresh());
  }

  resize() {
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

Serializer.register(
  Editor,
  (raw: any) => {
    //@ts-ignore
    const ctx: any = window.ctx;
    const node = new Editor(ctx.keyboard, ctx.history);
    node.editor.setValue(raw.value);
    return node;
  },
  (raw: Editor) => {
    return {value: raw.editor.getValue()};
  }
);