import * as paper from "paper";

import { ToolContext, GrafeTool } from "./tool";

/*
For snaps:
We don't want to rely on toolEvent state for any saved point.
So any point we rely on should be recorded
Either in tool canvas or an explicit state
*/

export function elipseTool(ctx: ToolContext): GrafeTool {
  const { canvas, foreground, tool, snap, style } = ctx;
  const elipseTool = new GrafeTool(ctx);

  elipseTool.onMouseDown = function(event: paper.MouseEvent) {
    tool.removeChildren();
  };

  elipseTool.onMouseDrag = function(event: paper.ToolEvent) {
    foreground.activate();
    tool.activate();
    tool.removeChildren();
    if (snap.data.snap) {
      event.downPoint = snap.data.snap.fn(event.downPoint);
      event.point = snap.data.snap.fn(event.point);
    }
    if (!event.modifiers.shift) {
      new paper.Path.Ellipse({
        style: style.style,
        center: event.downPoint,
        radius: event.downPoint.subtract(event.point),
        selected: true
      });
    } else {
      new paper.Path.Circle({
        style: style.style,
        center: event.downPoint,
        radius: event.downPoint.getDistance(event.point),
        selected: true
      });
    }
  };

  elipseTool.onMouseUp = function(event: paper.ToolEvent) {
    foreground.activate();
    tool.activate();
    tool.removeChildren();
    canvas.activate();
    if (snap.data.snap) {
      event.downPoint = snap.data.snap.fn(event.downPoint);
      event.point = snap.data.snap.fn(event.point);
    }
    if (!event.modifiers.shift) {
      new paper.Path.Ellipse({
        style: style.style,
        center: event.downPoint,
        radius: event.downPoint.subtract(event.point)
      });
    } else {
      new paper.Path.Circle({
        style: style.style,
        center: event.downPoint,
        radius: event.downPoint.getDistance(event.point)
      });
    }
  };
  return elipseTool;
}
