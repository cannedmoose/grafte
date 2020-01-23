import * as paper from "paper";

import { ToolContext, GrafeTool } from "./tool";

export function rectangleTool(ctx: ToolContext): GrafeTool {
  const { canvas, foreground, tool, snap, style } = ctx;
  const rectangleTool = new GrafeTool(ctx);

  rectangleTool.onMouseDown = function(event: paper.MouseEvent) {
    tool.removeChildren();
  };

  rectangleTool.onMouseDrag = function(event: paper.ToolEvent) {
    foreground.activate();
    tool.activate();
    tool.removeChildren();
    if (snap.data.snap) {
      event.downPoint = snap.data.snap.fn(event.downPoint);
      event.point = snap.data.snap.fn(event.point);
    }
    if (!event.modifiers.shift) {
      new paper.Path.Rectangle({
        style: style.style,
        center: event.downPoint,
        size: event.downPoint.subtract(event.point).multiply(2)
      });
    } else {
      let l = event.downPoint.getDistance(event.point) * Math.sqrt(2);
      new paper.Path.Rectangle({
        style: style.style,
        center: event.downPoint,
        size: new paper.Point(l, l)
      });
    }
  };

  rectangleTool.onMouseUp = function(event: paper.ToolEvent) {
    foreground.activate();
    tool.activate();
    tool.removeChildren();
    canvas.activate();
    if (snap.data.snap) {
      event.downPoint = snap.data.snap.fn(event.downPoint);
      event.point = snap.data.snap.fn(event.point);
    }
    if (!event.modifiers.shift) {
      new paper.Path.Rectangle({
        style: style.style,
        center: event.downPoint,
        size: event.downPoint.subtract(event.point).multiply(2)
      });
    } else {
      let l = event.downPoint.getDistance(event.point) * Math.sqrt(2);
      new paper.Path.Rectangle({
        style: style.style,
        center: event.downPoint,
        size: new paper.Point(l, l)
      });
    }
    ctx.updated();
  };
  return rectangleTool;
}
