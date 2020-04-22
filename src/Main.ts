import * as paper from "paper";
import { LayerControls } from "./ui/layers";
import { queryOrThrow } from "./ui/utils/dom";
import {  ToolBelt } from "./ui/tools";
import { Editor, DOMConsole } from "./ui/editor";
import { GrafteHistory } from "./tools/history";
import { Preview } from "./ui/preview";
import { Viewport } from "./ui/viewport";
import { Save, Load } from "./ui/saveload";
import { Keyboard } from "./ui/keyboard";
import { Pane, DragBoss, LeafTab, PaneNode, PaneLeaf, isSerializable } from "./ui/paneer/pane";
import { Deserializer } from "./ui/paneer/deserializer";

/**
 * Important concepts:
 * Viewport: the main view of the project
 * preview: smaller preview window of the project
 * page: the view of the window that is exported
 */

window.onload = function () {
  // Set up main viewport
  const viewport = new Viewport();

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

  const ctx = {
    keyboard, viewport, history
  }
  // @ts-ignore
  window.ctx = ctx;

  const dragBoss = new DragBoss();
  const paneerDiv = queryOrThrow("#menus");
  paneerDiv.appendChild(dragBoss.element);
  
  const des = new Deserializer();
  des.register("pane", Pane.deserialize);
  des.register("node", PaneNode.deserialize);
  des.register("leaf", PaneLeaf.deserialize);
  des.register("editor", Editor.deserialize);
  des.register("domconsole", DOMConsole.deserialize);
  des.register("layers", LayerControls.deserialize);
  des.register("preview", Preview.deserialize);
  des.register("viewport", Viewport.deserialize);
  des.register("save", Save.deserialize);
  des.register("load", Load.deserialize);
  des.register("toolbelt", ToolBelt.deserialize);

  const serialized = window.localStorage.getItem("panes");
  if (serialized) {
    console.log(serialized);
    JSON.parse(serialized);
    const res = des.deserialize(JSON.parse(serialized));

    dragBoss.rest.append(res);
  } else {
    const panes = new Pane("H");
    const leftPane = panes.addPane("V", "15%");
    // Set up preview
    leftPane.addLeaf("15%").addTab(new LeafTab(new Preview(paper.project, viewport)));
    leftPane.addLeaf("auto").addTab(new LeafTab(new ToolBelt(history, keyboard)));
    leftPane.addLeaf("auto");

    const middlePane = panes.addPane("V", "auto");
    middlePane.addLeaf("5fr").addTab(new LeafTab(viewport));
    middlePane.addLeaf("2fr")
      .addTab(new LeafTab(new DOMConsole()))
      .addTab(new LeafTab(new Editor(keyboard, history)));

    const rightPane = panes.addPane("V", "10%");
    rightPane.addLeaf("2fr").addTab(new LeafTab(new LayerControls(viewport)));
    rightPane.addLeaf("1fr")
      .addTab(new LeafTab(new Save(viewport.page)))
      .addTab(new LeafTab(new Load(viewport.page)));

    dragBoss.rest.append(panes);
  }

  window.addEventListener("beforeunload", (e: Event) => {
    window.localStorage
      .setItem("panes",JSON.stringify(dragBoss.rest.Descendent(isSerializable).serialize()));

    window.localStorage.setItem("project", paper.project.exportJSON());
  });

  // TODO(P1) MAKE LESS HACKEY!!!
  const json = window.localStorage.getItem("project");
  if (json) {
    paper.project.importJSON(json);
    paper.project.deselectAll();
  }

  viewport.resize();
  viewport.centerPage();

  // TODO(P1) OPACITY ABSOLUTELY KILLS EVERYTHING
  // how to make it better?

  // TODO(P1) figure out zoom
  // TODO(P1) allow export at any scale

};

