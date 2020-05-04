import * as paper from "paper";
import { LayerControls } from "./ui/layers";
import { queryOrThrow } from "./ui/utils/dom";
import { ToolBelt } from "./ui/tools";
import { Editor } from "./ui/editor";
import { GrafteHistory } from "./tools/history";
import { Preview } from "./ui/preview";
import { Viewport } from "./ui/viewport";
import { Load } from "./ui/load";
import { Keyboard } from "./ui/keyboard";
import { Pane, PaneNode } from "./ui/components/panes/pane";
import { PaneLeaf } from "./ui/components/panes/paneleaf";
import { DragOverlay } from "./ui/components/panes/dragoverlay";
import { AppendPan, attach, Pan } from "./ui/paneer/template";
import { elementToPaneer, AttachedPaneer, Paneer, isAttached } from "./ui/paneer/paneer";
import { Save } from "./ui/save";
import { Serializer } from "./ui/paneer/deserializer";

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
    keyboard, viewport, history, elementToPaneer
  }
  // @ts-ignore
  window.ctx = ctx;

  const serialized = window.localStorage.getItem("spanes");
  let root: Paneer | undefined;
  if (serialized) {
    root = Serializer.deserialize<AttachedPaneer>(JSON.parse(serialized));
  }

  if (!root) {
    root = new DragOverlay();
    Pan/*html*/`
    <div ${attach(root)}>
      <div ${attach(new Pane("H"))}>
        <div ${attach(new PaneNode("V", "15%"))}>
          <div ${attach(new PaneLeaf("15%"))}>
            ${new Preview(paper.project, viewport)}
          </div>
          <div ${attach(new PaneLeaf("auto"))}>
            ${new ToolBelt(history, keyboard)}
          </div>
          <div ${attach(new PaneLeaf("auto"))}>
          </div>
        </div>
        <div ${attach(new PaneNode("V", "auto"))}>
          <div ${attach(new PaneLeaf("5fr"))}>
            ${viewport}
          </div>
          <div ${attach(new PaneLeaf("2fr"))}>
            ${new Editor(keyboard, history)}
          </div>
        </div>
        <div ${attach(new PaneNode("V", "10%"))}>
          <div ${attach(new PaneLeaf("2fr"))}>
            ${new LayerControls(viewport)}
          </div>
          <div ${attach(new PaneLeaf("1fr"))}>
            ${new Save(viewport.page)}
            ${new Load(viewport.page)}
          </div>
        </div>
      </div>
    </div>
    `
  }

  if (isAttached(root)) {
    queryOrThrow("#menus").append(root.element);
  } else {
    throw "NO ROOT ELEMENT";
  }

  window.addEventListener("beforeunload", (e: Event) => {
    if (isAttached(root)) {
      window.localStorage.setItem("spanes", JSON.stringify(Serializer.serialize(root)));
    }

    window.localStorage.setItem("project", paper.project.exportJSON());
  });

  // TODO(P2) Dont auto load project from storage
  // Need to have projects loaded as needed (eg viewport/preview loaded)
  // that way we can support multiple
  // Not sure how that plays with tools/layers, they will probs have to be associated too.
  const json = window.localStorage.getItem("project");
  if (json) {
    paper.project.importJSON(json);
    paper.project.deselectAll();
  }

  viewport.resize();
  viewport.centerPage();

  // TODO(P3) make zoom smoother
  // TODO(P3) allow export at any scale

};

