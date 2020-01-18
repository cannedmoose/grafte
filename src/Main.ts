import * as paper from "paper";
import { createTools, createToolOptions } from "./tools";
import { showLayers } from "./layers";
import { querySelectorOrThrow, createButton, createDiv } from "./utils";
import { createMenu } from "./menu";

function stoPoint(size: paper.Size) {
  return new paper.Point(
    paper.view.bounds.size.width,
    paper.view.bounds.size.height
  );
}

function rtoPoint(rect: paper.Rectangle) {
  return stoPoint(rect.size);
}

window.onload = function() {
  let canvasDom: HTMLCanvasElement = querySelectorOrThrow(
    "#canvas"
  ) as HTMLCanvasElement;
  let uiDom: HTMLCanvasElement = querySelectorOrThrow(
    "#ui"
  ) as HTMLCanvasElement;

  paper.setup(canvasDom);
  let canvas = paper.project;
  let ui = new paper.Project(uiDom);

  let { circleTool, penTool, rectTool, selectTool } = createTools(
    { canvas, ui },
    () => showLayers(canvas, "#layers")
  );

  let menuDiv = querySelectorOrThrow("#menus");
  menuDiv.appendChild(
    createMenu("layers-menu", [createDiv("layers", "vertical", [])], {
      title: "Layers",
      minimized: false,
      bounds: new paper.Rectangle(70, 0, 240, 140)
    })
  );

  window.requestAnimationFrame(() => showLayers(canvas, "#layers"));

  menuDiv.appendChild(
    createMenu(
      "tool-menu",
      [
        createDiv("", "vertical", [
          createButton("", "select", () => selectTool.activate()),
          createButton("", "circle", () => circleTool.activate()),
          createButton("", "rect", () => rectTool.activate()),
          createButton("", "pen", () => penTool.activate())
        ])
      ],
      {
        title: "Tools",
        minimized: false,
        bounds: new paper.Rectangle(0, 0, 70, 140)
      }
    )
  );

  menuDiv.appendChild(
    createMenu("tooloptions-menu", [createToolOptions()], {
      title: "Options",
      minimized: false,
      bounds: new paper.Rectangle(0, 140, 70, 140)
    })
  );
};
