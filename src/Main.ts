import * as paper from "paper";
import { LayerControls } from "./ui/layers";
import { queryOrThrow } from "./ui/utils/dom";
import { ToolOptions, ToolBelt } from "./ui/tools";
import { Editor, DOMConsole } from "./ui/editor";
import { GrafteHistory } from "./tools/history";
import { Preview } from "./ui/preview";
import { Viewport } from "./ui/viewport";
import { Save, Load } from "./ui/saveload";
import { Keyboard } from "./ui/keyboard";
import { Pane, DragBoss, LeafTab } from "./ui/paneer/pane";

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
  //new paper.Layer();
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
  // TODO figure out when layers should actually be updated...
  // TODO on changed...
  viewport.view.on("updated", () => {
    layers.refreshLayers();
  });

  const editor = new Editor("2fr");
  keyboard.bind("ctrl+enter", { global: true }, (e: KeyboardEvent) => {
    e.preventDefault();
    editor.execute();
    history.commit();
  });

  const panes = new Pane("H");
  const leftPane = panes.addPane("V", "15%");
  leftPane.addLeaf("15%").addTab(new LeafTab(preview));
  leftPane.addLeaf("auto").addTab(new LeafTab(toolBelt));
  leftPane.addLeaf("auto");

  const middlePane = panes.addPane("V", "auto");
  middlePane.addLeaf("5fr").addTab(new LeafTab(viewport));
  middlePane.addLeaf("2fr")
    .addTab(new LeafTab(new DOMConsole()))
    .addTab(new LeafTab(editor));

  const rightPane = panes.addPane("V", "10%");
  rightPane.addLeaf("2fr").addTab(new LeafTab(layers));
  rightPane.addLeaf("1fr")
    .addTab(new LeafTab(new Save(viewport.page)))
    .addTab(new LeafTab(new Load(viewport.page)));

  const dragBoss = new DragBoss();
  dragBoss.rest.append(panes);

  const paneerDiv = queryOrThrow("#menus");
  paneerDiv.appendChild(dragBoss.element);

  // TODO(P1) MAKE LESS HACKEY!!!
  const json = window.localStorage.getItem("project");
  if (json) {
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

