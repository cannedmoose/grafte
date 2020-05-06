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
import { Serializer } from "./ui/utils/deserializer";
import { Store } from "./ui/utils/store";

/**
 * Important concepts:
 * Viewport: the main view of the project
 * preview: smaller preview window of the project
 * page: the view of the window that is exported
 */

window.onload = function () {
  // TODO(P2) move all of this into an INIT file

  // Project setup.
  paper.settings.handleSize = 6;
  paper.settings.hitTolerance = 1;


  const history = new GrafteHistory(Store.getResource("project", "default"));
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

  // TODO(P2) make this type safe...
  // @ts-ignore
  window.ctx = {
    keyboard, history, elementToPaneer, Store
  }

  const serialized = window.localStorage.getItem("spanes");
  let root: Paneer | undefined;
  if (serialized) {
    root = Serializer.deserialize<AttachedPaneer>(JSON.parse(serialized));
  }

  if (!root) {
    root = new DragOverlay();
    const defaultProject = Store.getResource("project", "default");
    Pan/*html*/`
    <div ${attach(root)}>
      <div ${attach(new Pane("H"))}>
        <div ${attach(new PaneNode("V", "15%"))}>
          <div ${attach(new PaneLeaf("15%"))}>
            ${new Preview(defaultProject)}
          </div>
          <div ${attach(new PaneLeaf("auto"))}>
            ${new ToolBelt(history, keyboard)}
          </div>
          <div ${attach(new PaneLeaf("auto"))}>
          </div>
        </div>
        <div ${attach(new PaneNode("V", "auto"))}>
          <div ${attach(new PaneLeaf("5fr"))}>
            ${new Viewport(defaultProject)}
          </div>
          <div ${attach(new PaneLeaf("2fr"))}>
            ${new Editor(Store.getResource("string", "code"), keyboard, history)}
          </div>
        </div>
        <div ${attach(new PaneNode("V", "10%"))}>
          <div ${attach(new PaneLeaf("2fr"))}>
            ${new LayerControls(defaultProject)}
          </div>
          <div ${attach(new PaneLeaf("1fr"))}>
            ${new Save()}
            ${new Load()}
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

    // TODO(P1) should save all projects!!!
    // this is just a hack to get the JSON written...
    const defaultProject = Store.getResource("project", "default");
    defaultProject.content = defaultProject.content;
  });

  // TODO(P3) make zoom smoother
  // TODO(P3) allow export at any scale

};

