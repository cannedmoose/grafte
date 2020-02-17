import * as paper from "paper";

export function penTool({ canvas }): paper.Tool {
  const penTool = new paper.Tool();
  penTool.minDistance = 1;
  let path;

  penTool.onMouseDown = function(event: paper.ToolEvent) {
    canvas.deselectAll();
    path = new paper.Path([event.downPoint]);
    path.selected = true;
  };

  penTool.onMouseDrag = function(event: paper.ToolEvent) {
    if (!path) return;
    path.add(event.point);
    if (event.modifiers.shift) {
      path.closed = true;
    } else {
      path.closed = false;
      path.fillColor = null;
    }
  };

  penTool.onMouseUp = function(event: paper.ToolEvent) {
    if (!path) return;
    path.simplify();
    path = undefined;
  };
  return penTool;
}
