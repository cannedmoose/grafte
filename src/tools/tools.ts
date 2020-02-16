import * as paper from "paper";
import { elipseTool } from "./elipse";
import { rectangleTool } from "./rectangle";
import { selectTool } from "./select";
import { penTool } from "./pen";

export function createTools(canvas: paper.Project) {
  let noTool = new paper.Tool();
  let p = penTool({ canvas });
  let circleTool = elipseTool({ canvas });
  let rectTool = rectangleTool({ canvas });
  let s = selectTool({ canvas });

  p.activate();

  return { noTool, circleTool, penTool: p, rectTool, selectTool: s };
}
