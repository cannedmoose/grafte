import * as paper from "paper";
import { LayerControls } from "./ui/layers";
import { queryOrThrow } from "./ui/utils/dom";
import { ToolOptions, ToolBelt } from "./ui/tools";
import { Editor } from "./ui/editor";
import { GrafteHistory } from "./tools/history";
import { PaneerNode, PaneerLeaf } from "./ui/paneer/paneer";
import { Preview } from "./ui/preview";
import { Viewport } from "./ui/viewport";
import { SaveLoad } from "./ui/saveload";
import { Keyboard } from "./ui/keyboard";

/**
 * Important concepts:
 * Viewport: the main view of the project
 * preview: smaller preview window of the project
 * page: the vview of the window that is exported
 */

window.onload = function () {
  // Set up main viewport
  const viewport = new Viewport();
  // Set up preview
  const preview = new Preview(paper.project, viewport);

  // Project setup.
  new paper.Layer();
  paper.project.currentStyle.strokeWidth = 1;
  paper.project.currentStyle.strokeColor = new paper.Color("black");
  paper.project.currentStyle.strokeCap = "round";
  paper.project.currentStyle.strokeJoin = "round";
  paper.settings.handleSize = 6;


  const history = new GrafteHistory(paper.project);
  const keyboard = new Keyboard();

  // Add keyboard event listener and default keyboard events
  keyboard.bind("backspace", {}, (e: KeyboardEvent) => {
    e.preventDefault();
    paper.project.selectedItems.forEach(item => item.remove());
    history.commit();
  });

  keyboard.bind("command+z", {}, (e: KeyboardEvent) => {
    e.preventDefault();
    history.undo();
  });

  keyboard.bind("command+shift+z", {}, (e: KeyboardEvent) => {
    e.preventDefault();
    history.redo();
  });

  const toolBelt = new ToolBelt(history, keyboard);
  const layers = new LayerControls();
  viewport.view.on("updated", () => layers.refreshLayers());

  const editor = new Editor("1fr");
  keyboard.bind("ctrl+enter", { global: true }, (e: KeyboardEvent) => {
    e.preventDefault();
    editor.execute();
  });

  const paneerDiv = queryOrThrow("#menus");
  const paneer: PaneerNode = new PaneerNode(
    "Horizontal",
    "auto",
    true,
    [
      new PaneerNode("Vertical", "10%", true, [
        new PaneerLeaf(preview, "1fr"),
        new PaneerLeaf(toolBelt, "3fr"),
        new PaneerLeaf(new ToolOptions(history), "1fr")
      ]),
      new PaneerNode("Vertical", "auto", true, [
        new PaneerLeaf(viewport, "5fr"),
        editor
      ]),
      new PaneerNode("Vertical", "10%", true, [
        new PaneerLeaf(layers, "2fr"),
        new PaneerLeaf(new SaveLoad(viewport.page), "1fr"),
      ])
    ]
  );
  paneerDiv.appendChild(paneer.element);

  // TODO(P1) MAKE LESS HACKEY!!!
  const json = window.localStorage.getItem("project");
  if (json) {
    if ((queryOrThrow("#loadclear") as HTMLInputElement).checked) {
      paper.project.clear();
    }
    paper.project.importJSON(json);
    paper.project.deselectAll();
  }

  const editorvalue =  window.localStorage.getItem("editor");
  if (editorvalue) {
    editor.editor.setValue(editorvalue);
  }
    
  viewport.view.on("updated", () => {
    const json = paper.project.exportJSON({ asString: true });
    window.localStorage.setItem("project", json);
  });
  editor.editor.on("change", () => {
    window.localStorage.setItem("editor", editor.editor.getValue());
  });

  const ctx = {
    editor, keyboard, toolBelt, viewport
  }
  // @ts-ignore
  window.ctx = ctx;
  viewport.resize();
  viewport.centerPage();
};

