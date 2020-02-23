import * as paper from "paper";
import { elipseTool } from "./elipse";
import { rectangleTool } from "./rectangle";
import { selectTool } from "./select";
import { penTool } from "./pen";
import { pencilTool } from "./pencil";
import { pointTool } from "./points";

export function createTools(canvas: paper.Project) {
  return [
    selectTool({ canvas }),
    pointTool({ canvas }),
    penTool({ canvas }),
    pencilTool({ canvas }),
    elipseTool({ canvas }),
    rectangleTool({ canvas })
  ];
}
