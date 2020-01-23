import * as paper from "paper";

export interface ToolContext {
  foreground: paper.Project; // Foreground canvas with tool layers
  canvas: paper.Project; // Source of truth canvas

  updated: () => void; // Should be called when canvas updated
  tool: paper.Layer; // Tool display layer
  snap: paper.Layer; // Snap dispaly layer
  style: paper.Layer; // Style layer (should always be empty)
  select: paper.Layer; //
}

export class GrafeTool extends paper.Tool {
  ctx: ToolContext;
  onActivate?: () => void;
  onDeactivate?: () => void;

  constructor(ctx: ToolContext) {
    super();
    this.ctx = ctx;
  }

  activate() {
    if (this.ctx.tool.data.cleanup) {
      this.ctx.tool.data.cleanup();
      this.ctx.tool.data.cleanup = undefined;
    }

    this.ctx.canvas.deselectAll();
    this.ctx.foreground.deselectAll();
    this.ctx.tool.removeChildren();

    super.activate();

    if (this.onActivate) {
      this.onActivate();
    }
    if (this.onDeactivate) {
      this.ctx.tool.data.cleanup = this.onDeactivate;
    }
  }
}
