import * as paper from "paper";
import CodeMirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/addon/display/fullscreen.css";
import "codemirror/addon/hint/show-hint.js";
import "codemirror/addon/hint/show-hint.css";
import "codemirror/addon/hint/javascript-hint.js";
import "codemirror/theme/neat.css";
import "codemirror/mode/javascript/javascript.js";
import { div } from "./utils/dom";
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
    viewportMargin: Infinity,
    
    // TODO(P3) maybe enable...
    //inputStyle: "contenteditable"
  };

  constructor(sizing: string) {
    super({element: div({}, [])}, sizing);
    this.editor = CodeMirror(this.pane.element, this.config);
    this.pane.element.style.height = "100%";
    this.pane.element.style.fontSize = "2em";
    (this.pane.element.firstElementChild as HTMLElement).style.height = "100%";
    this.editor.refresh();
  }

  resize() {
    super.resize();
    this.editor.refresh();
  }

  execute() {
    paper.execute(this.editor.getValue());
  }
}
