import * as paper from "paper";
import { elipseTool } from "./elipse";
import { rectangleTool } from "./rectangle";
import { selectTool } from "./select";
import { penTool } from "./pen";
import { pencilTool } from "./pencil";
import { pointTool } from "./points";
import { GrafteHistory } from "./history";

export function createTools(canvas: paper.Project, history: GrafteHistory) {
  return [
    selectTool(canvas, history),
    pointTool(canvas, history),
    penTool(canvas, history),
    pencilTool(canvas, history),
    elipseTool(canvas, history),
    rectangleTool(canvas, history)
  ];
}
