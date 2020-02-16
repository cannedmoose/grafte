import * as paper from "paper";

export function rectangleTool({ canvas }): paper.Tool {
  const rectangleTool = new paper.Tool();

  rectangleTool.onMouseDown = function(event: paper.MouseEvent) {
    canvas.deselectAll();
  };

  let path: paper.Path | undefined;

  rectangleTool.onMouseDrag = function(event: paper.ToolEvent) {
    if (path) path.remove();
    if (!event.modifiers.shift) {
      path = new paper.Path.Rectangle({
        center: event.downPoint,
        size: event.downPoint.subtract(event.point).multiply(2)
      });
    } else {
      let l = event.downPoint.getDistance(event.point) * Math.sqrt(2);
      path = new paper.Path.Rectangle({
        center: event.downPoint,
        size: new paper.Point(l, l)
      });
    }
  };

  rectangleTool.onMouseUp = function(event: paper.ToolEvent) {
    if (path) path.selected = true;
    path = undefined;
  };
  return rectangleTool;
}
