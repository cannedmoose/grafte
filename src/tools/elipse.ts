import * as paper from "paper";

export function elipseTool({ canvas }): paper.Tool {
  const elipseTool = new paper.Tool();
  elipseTool.name = "elipse";

  elipseTool.onMouseDown = function(event: paper.MouseEvent) {
    canvas.deselectAll();
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
  };

  elipseTool.onMouseUp = function(event: paper.ToolEvent) {
    if (path) path.selected = true;
    path = undefined;
  };
  return elipseTool;
}
