import * as paper from "paper";
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
