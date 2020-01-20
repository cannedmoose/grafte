import * as paper from "paper";

import { ToolContext, GrafeTool } from "./tool";

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
