import * as paper from "paper";

export function penTool(history): paper.Tool {
  const penTool = new paper.Tool();
  penTool.name = "pen";

  penTool.minDistance = 1;
  let path: paper.Path | undefined;
  let segment: paper.Segment | undefined;

  penTool.onMouseDown = function(event: paper.ToolEvent) {
    if (path) {
      if (path.lastSegment.point.isClose(event.point, 6)) {
        path = undefined;
      } else if (path.firstSegment.point.isClose(event.point, 6)) {
        path.closePath();
        segment = path.firstSegment;
        path = undefined;
      } else {
        path.add(event.point);
        segment = path.lastSegment;
      }
    } else {
      paper.project.deselectAll();
      path = new paper.Path([event.downPoint]);
      segment = path.firstSegment;
      path.selected = true;
    }
  };

  penTool.onMouseDrag = function(event: paper.ToolEvent) {
    if(!segment) return;
    segment.selected = true;
    segment.handleIn = event.downPoint.subtract(event.point);
    segment.handleOut = segment.handleIn.multiply(-1);
  };

  penTool.onMouseUp = function(event: paper.ToolEvent) {
    history.commit();
  };

  return penTool;
}
