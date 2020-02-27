import * as CodeMirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/addon/display/fullscreen.css";
import "codemirror/theme/neat.css";
import "codemirror/mode/javascript/javascript.js";
import { div } from "./utils";

export function createCodeEditor() {
  const d = div({}, []);
  new CodeMirrorManager(d);
  return d;
}

export class CodeMirrorManager {
  public editor: CodeMirror.Editor;

  config: CodeMirror.EditorConfiguration = {
    tabSize: 3,
    lineNumbers: true,
    mode: "javascript",
    theme: "neat"
  };

  constructor(host: HTMLElement) {
    this.editor = CodeMirror(host, this.config);
  }
}
