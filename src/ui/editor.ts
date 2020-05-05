import * as paper from "paper";
import CodeMirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/addon/display/fullscreen.css";
import "codemirror/addon/hint/show-hint.js";
import "codemirror/addon/hint/show-hint.css";
import "codemirror/addon/hint/javascript-hint.js";
import "codemirror/theme/neat.css";
import "codemirror/mode/javascript/javascript.js";
import { Tab } from "./components/panes/pane";
import { Keyboard } from "./keyboard";
import { GrafteHistory } from "../tools/history";
import { AttachedPaneer } from "./paneer/paneer";
import { Pan } from "./paneer/template";
import { Serializer } from "./utils/deserializer";
import { Resource, Store } from "./utils/store";

export class Editor extends AttachedPaneer implements Tab {
  tab: true = true;
  label: string;

  public editor: CodeMirror.Editor;
  editorDiv: HTMLElement;
  value: Resource<string>;

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

  constructor(value: Resource<string>, keyboard: Keyboard, history: GrafteHistory) {
    super(Pan/*html*/`<div></div>`);
    this.label = value.key;
    this.value = value;

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
    this.editor.setValue(value.content);
    this.editor.on("change", () => {
      this.value.content = this.editor.getValue();
    });
    // TODO add watcher for content change...
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
    const node = new Editor(Store.getResource("string", raw.key || "code"), ctx.keyboard, ctx.history);
    return node;
  },
  (raw: Editor) => {
    return {key: raw.value.key};
  }
);