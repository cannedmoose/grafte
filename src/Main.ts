import * as paper from "paper";
import { LayerControls } from "./ui/layers";
import { queryOrThrow, button, div, text } from "./ui/utils/dom";
import { ToolOptions, ToolBelt } from "./ui/tools";
import { KeyboardHandler } from "./ui/keyboard";
import { createCodeEditor } from "./ui/editor";
import { GrafteHistory } from "./tools/history";
import { PaneerNode, PaneerLeaf } from "./ui/paneer/paneer";
import { Preview } from "./ui/preview";
import { Viewport } from "./ui/viewport";
import { SaveLoad } from "./ui/saveload";

/**
 * Important concepts:
 * Viewport: the main view of the project
 * preview: smaller preview window of the project
 * page: the vview of the window that is exported
 */

window.onload = function () {
  const paneerDiv = queryOrThrow("#menus");

  // Set up main viewport
  const viewport = new Viewport();

  // Set up preview paper.project
  // TODO(P1) pass in viewport instead
  const preview = new Preview(paper.project, viewport.view, viewport.page);
  viewport.view.on("changed", () => preview.resize());

  paper.project.currentStyle.strokeWidth = 1;
  paper.project.currentStyle.strokeColor = new paper.Color("black");
  paper.project.currentStyle.strokeCap = "round";
  paper.project.currentStyle.strokeJoin = "round";
  paper.settings.handleSize = 6;


  const history = new GrafteHistory(paper.project);

  // Add keyboard event listener and default keyboard events
  const keyboardHandler = new KeyboardHandler(window);
  const toolBelt = new ToolBelt(history, keyboardHandler);

  keyboardHandler.addShortcut("backspace", e => {
    e.preventDefault();
    paper.project.selectedItems.forEach(item => item.remove());
    history.commit();
  });

  keyboardHandler.addShortcut("control+z", e => {
    e.preventDefault();
    history.undo();
  });

  keyboardHandler.addShortcut("control+shift+z", e => {
    e.preventDefault();
    history.redo();
  });

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
      new PaneerLeaf(viewport, "auto"),
      new PaneerNode("Vertical", "10%", true, [
        new PaneerLeaf(new LayerControls(), "2fr"),
        new PaneerLeaf(new SaveLoad(viewport.page), "1fr"),
      ])
    ]
  );

  paneerDiv.appendChild(paneer.element);

  viewport.resize();
  viewport.centerPage();
  preview.resize();

  /*menuDiv.append(
    createMenu("code", [createCodeEditor()], {
      title: "Style",
      minimized: false,
      class: "codeArea"
    })
  );*/
};

