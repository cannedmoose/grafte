import * as paper from "paper";
import { LayerControls } from "./ui/layers";
import { queryOrThrow } from "./ui/utils/dom";
import { ToolOptions, ToolBelt } from "./ui/tools";
import { Editor, DOMConsole } from "./ui/editor";
import { GrafteHistory } from "./tools/history";
import { Preview } from "./ui/preview";
import { Viewport } from "./ui/viewport";
import { SaveLoad } from "./ui/saveload";
import { Keyboard } from "./ui/keyboard";
import { Pane } from "./ui/paneer/pane";

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
  paper.settings.hitTolerance = 1;


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

  const editor = new Editor("2fr");
  keyboard.bind("ctrl+enter", { global: true }, (e: KeyboardEvent) => {
    e.preventDefault();
    editor.execute();
    history.commit();
  });

  const paneerDiv = queryOrThrow("#menus");

  const panes = new Pane("H");
  const leftPane = panes.addPane("V", "15%");
  leftPane.addLeaf(preview, "15%");
  leftPane.addLeaf(toolBelt, "auto");

  const middlePane = panes.addPane("V", "auto");
  middlePane.addLeaf(viewport, "5fr");

  const editorPane = middlePane.addPane("H", "2fr");
  editorPane.addLeaf(editor, "2fr");
  editorPane.addLeaf(new DOMConsole(), "1fr");

  const rightPane = panes.addPane("V", "10%");
  rightPane.addLeaf(layers, "2fr");
  rightPane.addLeaf(new SaveLoad(viewport.page), "1fr");

  paneerDiv.appendChild(panes.element);

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
    // TODO(P1) Hook into history to only save for undo/redo actions
    //const json = paper.project.exportJSON({ asString: true });
    //window.localStorage.setItem("project", json);
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

  // TODO(P1) OPACITY ABSOLUTELY KILLS EVERYTHING
  // how to make it better?

  // TODO(P1) figure out zoom
  // TODO(P1) allow export at any scale

};

