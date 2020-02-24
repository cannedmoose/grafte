import * as paper from "paper";

export function rectangleTool(canvas, history): paper.Tool {
  const rectangleTool = new paper.Tool();
  rectangleTool.name = "rectangle";

  rectangleTool.onMouseDown = function(event: paper.MouseEvent) {
    canvas.deselectAll();
  };

  let path: paper.Path | undefined;

  rectangleTool.onMouseDrag = function(event: paper.ToolEvent) {
    if (path) path.remove();
    if (!event.modifiers.shift) {
      path = new paper.Path.Rectangle(event.downPoint, event.point);
    } else {
      // HACKEY HACKEY HACKEY
      // Todo find a better way to figure out square points
      let l = (event.downPoint.getDistance(event.point) * Math.sqrt(2)) / 2;
      var x = event.point
        .subtract(event.downPoint)
        .normalize()
        .round();
      if (Math.abs(x.x) == 0) x.x = 1;
      if (Math.abs(x.y) == 0) x.y = 1;
      x = x.multiply(l).add(event.downPoint);
      path = new paper.Path.Rectangle({
        from: event.downPoint,
        to: x
      });
    }
  };

  rectangleTool.onMouseUp = function(event: paper.ToolEvent) {
    if (path) path.selected = true;
    path = undefined;
    history.commit();
  };
  return rectangleTool;
}
