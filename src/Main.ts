import * as paper from "paper";
import { viewProject } from "./ui/layers";
import { queryOrThrow, button, div, text, canvas } from "./ui/utils";
import { createToolOptions, ToolBelt } from "./ui/tools";
import { createSaveMenu } from "./ui/save";
import { createLoadMenu } from "./ui/load";
import { KeyboardHandler } from "./ui/keyboard";
import { createCodeEditor } from "./ui/editor";
import { GrafteHistory } from "./tools/history";
import { PaneerNode, PaneerLeaf } from "./ui/paneer/paneer";
import { Preview } from "./ui/preview";
import { Viewport } from "./ui/viewport";

/**
 * TODO ADD RESIZE OBSERVER FOR CANVAS ELEMENT RESIZING.
 * SHOULD SPLIT OUT PREVIEW/VIEW WINDOW INTO SEPERATE FILE
 * 
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
  // TODO pass in viewport instead
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

  const layersDiv = div({ id: "layers", class: "vertical" }, []);
  const refreshLayers = () => {
    while (layersDiv.firstChild) {
      layersDiv.removeChild(layersDiv.firstChild);
    }
    layersDiv.appendChild(viewProject(paper.project, refreshLayers));
  };
  viewport.view.on("updated", refreshLayers);
  window.requestAnimationFrame(refreshLayers);

  const layersContainer = div({ class: "vertical" }, [
    div({ class: "horizontal" }, [
      button({ id: "addlayer" }, [text("add")], {
        click: event => {
          new paper.Layer();
          refreshLayers();
        }
      }),
      button({ id: "addlayer" }, [text("up")], {
        // TODO fix these, they should do one pass to calculate final state
        // rather than a bunch of inserts/not
        // also consider moving into layer above/below
        click: event => {
          paper.project.selectedItems.forEach(item => {
            const index = item.parent.children.indexOf(item);
            if (index > 0) {
              item.parent.insertChild(index - 1, item);
            }
          });
        }
      }),
      button({ id: "addlayer" }, [text("down")], {
        click: event => {
          paper.project.selectedItems.forEach(item => {
            const index = item.parent.children.indexOf(item);
            if (index < item.parent.children.length - 1) {
              item.parent.insertChild(index + 1, item);
            }
          });
        }
      })
    ]),
    layersDiv
  ]);

  const paneer: PaneerNode = new PaneerNode(
    "Horizontal",
    "auto",
    true,
    [
      new PaneerNode("Vertical", "10%", true, [
        new PaneerLeaf(preview.dom, "1fr"),
        new PaneerLeaf(toolBelt.el, "1fr"),
        new PaneerLeaf(createToolOptions(history), "1fr")
      ]),
      new PaneerLeaf(viewport.dom, "auto"),
      new PaneerNode("Vertical", "10%", true, [
        new PaneerLeaf(layersContainer, "1fr"),
        new PaneerLeaf(createSaveMenu(viewport.page), "1fr"),
        new PaneerLeaf(createLoadMenu(viewport.page), "1fr")
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

