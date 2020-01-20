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
import { penTool } from "./pen";

export function createTools(ctx: ToolContext) {
  let noTool = new paper.Tool();
  let p = penTool(ctx);
  let circleTool = elipseTool(ctx);
  let rectTool = rectangleTool(ctx);
  let s = selectTool(ctx);

  p.activate();

  return { circleTool, penTool: p, rectTool, selectTool: s };
}

export function createToolOptions(ctx: ToolContext) {
  return createDiv("", "vertical", [
    createSlider("width", "", 1, 0, 50, event => {
      ctx.style.style.strokeWidth = event.target.value;
    }),
    createDiv("", "horizontal", [
      createColor("stroke", "", "#000000", event => {
        ctx.style.style.strokeColor = event.target.value;
      }),
      createColor("fill", "", "#FFFFFF", event => {
        ctx.style.style.fillColor = event.target.value;
      })
    ])
  ]);
}
