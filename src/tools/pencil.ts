import * as paper from "paper";

export function pencilTool(history): paper.Tool {
  const pencilTool = new paper.Tool();
  pencilTool.name = "freehand";
  
  pencilTool.minDistance = 1;
  let path;

  pencilTool.onMouseDown = function(event: paper.ToolEvent) {
    paper.project.deselectAll();
    
    path = new paper.Path([event.downPoint]);
    path.selected = true;
  };

  pencilTool.onMouseDrag = function(event: paper.ToolEvent) {
    if (!path) return;
    path.add(event.point);
    if (event.modifiers.shift) {
      path.closed = true;
    } else {
      path.closed = false;
      path.fillColor = null;
    }
  };

  pencilTool.onMouseUp = function(event: paper.ToolEvent) {
    if (!path) return;
    path.simplify();
    path = undefined;
    history.commit();
  };
  return pencilTool;
}
