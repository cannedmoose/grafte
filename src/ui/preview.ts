import * as paper from "paper";
import { canvas } from "./utils/dom";
import { Viewport } from "./viewport";

export class Preview {
  element: HTMLCanvasElement;
  view: paper.CanvasView;
  viewport: Viewport;


  constructor(project: paper.Project, viewport: Viewport) {
    this.element = canvas({});
    this.view = new paper.CanvasView(project, this.element);

    this.view.drawSelection = false;
    this.viewport = viewport;

    this.view.on("updated", this.onViewUpdated.bind(this));
    this.viewport.view.on("changed", this.resize.bind(this));
    this.viewport.view.on("updated", () => { this.view.markDirty(); })

    this.view.on("mousedown", this.moveviewport.bind(this));
    this.view.on("mousedrag", this.moveviewport.bind(this));
    this.view.on("mouseup", this.moveviewport.bind(this));
  }

  onViewUpdated() {
    this.view.rawDraw((ctx: CanvasRenderingContext2D, matrix: paper.Matrix) => {
      ctx.save();
      ctx.lineWidth = 1;
      let tl = matrix.transform(this.viewport.page.bounds.topLeft);
      let br = matrix.transform(this.viewport.page.bounds.bottomRight);

      ctx.fillStyle = "#999999";
      let region = new Path2D();
      region.rect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
      region.rect(0, 0, this.element.width, this.element.height);
      ctx.clip(region, "evenodd");
      ctx.fillRect(0, 0, this.element.width, this.element.height);
      ctx.restore();

      ctx.save();

      tl = matrix.transform(this.viewport.project.view.bounds.topLeft);
      br = matrix.transform(this.viewport.project.view.bounds.bottomRight);
      ctx.strokeStyle = "#009dec";
      ctx.strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
      ctx.restore();
    });
  }

  resize() {
    window.requestAnimationFrame(() => {
      var previewRect = this.element.parentElement?.getBoundingClientRect();
      if (!previewRect) return;
      this.view.viewSize = new paper.Size(previewRect.width, previewRect.height);

      // Zoom out to show document
      const minX = this.viewport.page.bounds.topLeft.x;
      const minY = this.viewport.page.bounds.topLeft.y;
      const maxX = this.viewport.page.bounds.bottomRight.x;
      const maxY = this.viewport.page.bounds.bottomRight.y;

      // Always center on the document
      this.view.center = new paper.Point(
        minX + (maxX - minX) / 2,
        minY + (maxY - minY) / 2
      );
      var scaleFactorX = previewRect.width / (2 *
        Math.max(
          this.view.center.x - minX,
          maxX - this.view.center.x,
        ) *
        1.2);
      var scaleFactorY = previewRect.height / (2 *
        Math.max(
          this.view.center.y - minY,
          maxY - this.view.center.y
        ) *
        1.2);
      const scale = Math.min(scaleFactorX, scaleFactorY);

      this.view.scaling = new paper.Point(
        scale, scale
      );
    });
  }

  moveviewport(e: paper.MouseEvent) {
    if (this.viewport.page.bounds.contains(e.point)) {
      this.viewport.view.center = e.point;
    } else {
      // TODO(P2) find closest edge to stick to
      this.viewport.view.center = e.point;
    }
    e.stop();
  }
}