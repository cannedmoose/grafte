import * as paper from "paper";
import { createTools, showLayers } from "./tools";
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
  let canvas: HTMLCanvasElement = querySelectorOrThrow(
    "#canvas"
  ) as HTMLCanvasElement;
  paper.setup(canvas);

  let { circleTool, penTool, rectTool } = createTools();

  querySelectorOrThrow("#menus").appendChild(
    createMenu(
      "tool-menu",
      [
        createDiv("", "vertical", [
          createButton("", "circle", () => circleTool.activate()),
          createButton("", "rect", () => rectTool.activate()),
          createButton("", "pen", () => penTool.activate())
        ])
      ],
      {
        title: "Tools",
        minimized: false,
        bounds: new paper.Rectangle(10, 10, 70, 70)
      }
    )
  );

  showLayers();
};
