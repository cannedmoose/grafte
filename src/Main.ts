import * as paper from "paper";
import { createTools, createToolOptions } from "./tools/tools";
import { showLayers } from "./layers";
import { querySelectorOrThrow, createButton, createDiv } from "./utils";
import { createMenu } from "./menu";
import { Snap, snapMap, identity, gridSnap } from "./snaps/snaps";
import { GrafeScope } from "./grafe";
import { ToolContext } from "./tools/tool";

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
  let foregroundDom: HTMLCanvasElement = querySelectorOrThrow(
    "#foreground"
  ) as HTMLCanvasElement;
  let backgroundDom: HTMLCanvasElement = querySelectorOrThrow(
    "#background"
  ) as HTMLCanvasElement;

  paper.setup(canvasDom);
  const canvas = paper.project;
  const foreground = new paper.Project(foregroundDom);
  const background = new paper.Project(backgroundDom);

  // TODO FIX THIS
  foreground.activate();
  const snapLayer = new paper.Layer({ name: "snap" });
  const styleLayer = new paper.Layer({ name: "style" });
  styleLayer.fillColor = new paper.Color("red");
  styleLayer.strokeColor = new paper.Color("green");
  styleLayer.strokeWidth = 10;
  const toolLayer = new paper.Layer({ name: "tool" });

  console.log(canvas);
  let toolContext: ToolContext = {
    canvas,
    foreground,
    tool: toolLayer,
    snap: snapLayer,
    style: styleLayer,

    updated: () => {}
  };

  let { circleTool, penTool, rectTool, selectTool } = createTools(toolContext);

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
          createButton("", "select", () => {
            selectTool.activate();
          }),
          createButton("", "circle", () => {
            circleTool.activate();
          }),
          createButton("", "rect", () => {
            rectTool.activate();
          }),
          createButton("", "pen", () => {
            penTool.activate();
          }),
          createButton("", "grid", () => {
            /*scope.snap = gridSnap(
              new paper.Point(20, 20),
              new paper.Point(0, 0)
            );
            scope.background.activate;
            scope.snap.view(new paper.Point(0, 0));*/
          })
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
    createMenu("tooloptions-menu", [createToolOptions(toolContext)], {
      title: "Options",
      minimized: false,
      bounds: new paper.Rectangle(0, 140, 70, 140)
    })
  );
};
