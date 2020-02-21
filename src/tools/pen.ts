import * as paper from "paper";

export function penTool({ canvas }): paper.Tool {
  const penTool = new paper.Tool();
  penTool.name = "pen";

  penTool.minDistance = 1;
  let path: paper.Path | undefined;

  penTool.onMouseDown = function(event: paper.ToolEvent) {
    if (path) {
      if (path.lastSegment.point.isClose(event.point, 6)) {
        path.selected = false;
        path = undefined;
      } else if (path.firstSegment.point.isClose(event.point, 6)) {
        path.closePath();
        path.selected = false;
        path = undefined;
      } else {
        path.add(event.point);
      }
    } else {
      path = new paper.Path([event.downPoint]);
      path.fullySelected = true;
    }
  };

  penTool.onMouseDrag = function(event: paper.ToolEvent) {
    if (!path) return;
    path.fullySelected = true;
    path.lastSegment.handleOut = event.downPoint.subtract(event.point);
    path.lastSegment.handleIn = path.lastSegment.handleOut.multiply(-1);
  };

  penTool.onMouseUp = function(event: paper.ToolEvent) {
  };

  return penTool;
}
