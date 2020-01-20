import * as paper from "paper";
import * as select from "./select";
import {
  querySelectorOrThrow,
  createSlider,
  createDiv,
  createColor
} from "../utils";
import { elipseTool } from "./elipse";
import { rectangleTool } from "./rectangle";
import { ToolContext } from "./tool";
import { selectTool } from "./select";

export function createTools(ctx: ToolContext) {
  let penTool = new paper.Tool();
  let circleTool = elipseTool(ctx);
  let rectTool = rectangleTool(ctx);
  let s = selectTool(ctx);

  return { circleTool, penTool, rectTool, selectTool: s };
}

export function createToolOptions(ctx: ToolContext) {
  return createDiv("", "vertical", [
    createSlider("opacity", "", 1, 0, 1, event => {}),
    createSlider("width", "", 1, 0, 50, event => {}),
    createDiv("", "horizontal", [
      createColor("stroke", "", "#000000", event => {}),
      createColor("fill", "", "#FFFFFF", event => {})
    ])
  ]);
}
