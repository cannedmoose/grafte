import * as paper from "paper";
import CodeMirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/addon/display/fullscreen.css";
import "codemirror/theme/neat.css";
import "codemirror/mode/javascript/javascript.js";
import { div } from "./utils/dom";
import { PaneerLeaf } from "./paneer/paneer";

export class Editor extends PaneerLeaf {
  public editor: CodeMirror.Editor;

  config: CodeMirror.EditorConfiguration = {
    tabSize: 1,
    lineNumbers: true,
    mode: "javascript",
    theme: "neat",
    viewportMargin: Infinity
  };

  constructor(sizing: string) {
    super({element: div({}, [])}, sizing);
    // TODO ADD STYLES...
    this.editor = CodeMirror(this.pane.element, this.config);
    this.pane.element.style.height = "100%";
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
