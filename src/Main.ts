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
import { Pane, PaneNode } from "./ui/components/panes/pane";
import { Deserializer } from "./ui/paneer/deserializer";
import { attach, PaneerAppend } from "./ui/paneer/newPaneer";
import { PaneLeaf } from "./ui/components/panes/paneleaf";

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
  
  const des = new Deserializer();
  //des.register("pane", Pane.deserialize);
  //des.register("node", PaneNode.deserialize);
  //des.register("leaf", PaneLeaf.deserialize);
  des.register("editor", Editor.deserialize);
  des.register("domconsole", DOMConsole.deserialize);
  des.register("layers", LayerControls.deserialize);
  des.register("preview", Preview.deserialize);
  des.register("viewport", Viewport.deserialize);
  des.register("save", Save.deserialize);
  des.register("load", Load.deserialize);
  des.register("toolbelt", ToolBelt.deserialize);

  /*const serialized = window.localStorage.getItem("panes");
  if (serialized) {
    console.log(serialized);
    JSON.parse(serialized);
    const res = des.deserialize(JSON.parse(serialized));

    dragBoss.rest.append(res);
  } else {*/

  PaneerAppend(queryOrThrow("#menus"))/*html*/`
  <div ${el => {
    attach(new Pane("H"), el);
  }}>
    <div ${el => attach(new PaneNode("V", "15%"), el)}>
      <div ${el => attach(new PaneLeaf("15%"), el)}>
        ${new Preview(paper.project, viewport)}
      </div>
      <div ${el => attach(new PaneLeaf("auto"), el)}>
        ${new ToolBelt(history, keyboard)}
      </div>
      <div ${el => attach(new PaneLeaf("auto"), el)}>
      </div>
    </div>
    <div ${el => attach(new PaneNode("V", "auto"), el)}>
      <div ${el => attach(new PaneLeaf("5fr"), el)}>
        ${viewport}
      </div>
      <div ${el => attach(new PaneLeaf("2fr"), el)}>
        ${new Editor(keyboard, history)}
      </div>
    </div>
    <div ${el => attach(new PaneNode("V", "10%"), el)}>
      <div ${el => attach(new PaneLeaf("2fr"), el)}>
        ${new LayerControls(viewport)}
      </div>
      <div ${el => attach(new PaneLeaf("1fr"), el)}>
        ${new Save(viewport.page)}
        ${new Load(viewport.page)}
      </div>
    </div>
  </div>
  `

  window.addEventListener("beforeunload", (e: Event) => {
    //window.localStorage
    //  .setItem("panes",JSON.stringify(dragBoss.rest.Descendent(isSerializable).serialize()));

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

