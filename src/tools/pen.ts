import * as paper from "paper";

import { ToolContext, GrafeTool } from "./tool";

export function penTool(ctx: ToolContext): GrafeTool {
  const { canvas, foreground, tool, snap, style } = ctx;
  const penTool = new GrafeTool(ctx);

  penTool.onMouseDown = function(event: paper.ToolEvent) {
    tool.removeChildren();

    foreground.activate();
    tool.activate();
    let path = new paper.Path([event.downPoint]);
    path.style = style.style;
    path.selected = true;
  };

  penTool.onMouseDrag = function(event: paper.ToolEvent) {
    let path = tool.children[0] as paper.Path;
    path.add(event.point);
    path.style = style.style;
    if (event.modifiers.shift) {
      path.closed = true;
    } else {
      path.closed = false;
      path.fillColor = null;
    }
  };

  penTool.onMouseUp = function(event: paper.ToolEvent) {
    let path = tool.children[0] as paper.Path;
    canvas.activate();
    let newPath = new paper.Path(path.segments);
    newPath.style = style.style;
    if (event.modifiers.shift) {
      newPath.closed = true;
    } else {
      newPath.closed = false;
      newPath.fillColor = null;
    }

    newPath.simplify();

    tool.removeChildren();
  };
  return penTool;
}
