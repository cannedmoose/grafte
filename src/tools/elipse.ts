import * as paper from "paper";
import { GrafteHistory } from "./history";
import { Keyboard } from "../ui/keyboard";

export function elipseTool(history: GrafteHistory, keyboard: Keyboard): paper.Tool {
  const elipseTool = new paper.Tool();
  elipseTool.name = "elipse";
  keyboard.bind("e", {}, () => elipseTool.activate());

  elipseTool.onMouseDown = function(event: paper.MouseEvent) {
    paper.project.deselectAll();
  };

  let path: paper.Path | undefined;

  elipseTool.onMouseDrag = function(event: paper.ToolEvent) {
    if (path) path.remove();
    if (!event.modifiers.shift) {
      path = new paper.Path.Ellipse({
        center: event.downPoint,
        radius: event.downPoint.subtract(event.point)
      });
    } else {
      path = new paper.Path.Circle({
        center: event.downPoint,
        radius: event.downPoint.getDistance(event.point)
      });
    }
    path.style = paper.project.currentStyle;
  };

  elipseTool.onMouseUp = function(event: paper.ToolEvent) {
    if (path) {
      path.selected = true;
    }
    path = undefined;
    history.commit();
  };
  return elipseTool;
}
