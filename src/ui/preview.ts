import * as paper from "paper";
import { canvas } from "./utils";

export class Preview {
  dom: HTMLCanvasElement;
  view: paper.CanvasView;
  page: paper.View;
  project: paper.Project;
  viewport: paper.View;


  constructor(project: paper.Project, viewport: paper.View, page: paper.View) {
    this.dom = canvas({});
    this.view = new paper.CanvasView(project, this.dom);
    this.page = page;
    this.project = project;

    this.view.drawSelection = false;
    this.viewport = viewport;

    this.view.on("updated", this.onViewUpdated.bind(this));
    viewport.on("changed",this.resize.bind(this));
    this.viewport.on("updated", () => {this.view.markDirty();})

    this.view.on("mousedown", this.moveviewport.bind(this));
    this.view.on("mousedrag", this.moveviewport.bind(this));
    this.view.on("mouseup", this.moveviewport.bind(this));
  }

  onViewUpdated() {
    this.view.rawDraw((ctx: CanvasRenderingContext2D, matrix: paper.Matrix) => {
      ctx.save();
      ctx.lineWidth = 1;
      let tl = matrix.transform(this.page.bounds.topLeft);
      let br = matrix.transform(this.page.bounds.bottomRight);

      ctx.fillStyle = "#999999";
      let region = new Path2D();
      region.rect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
      region.rect(0, 0, this.project.view.element.width, this.project.view.element.height);
      ctx.clip(region, "evenodd");
      ctx.fillRect(0, 0, this.project.view.element.width, this.project.view.element.height);
      ctx.restore();

      ctx.save();

      tl = matrix.transform(this.project.view.bounds.topLeft);
      br = matrix.transform(this.project.view.bounds.bottomRight);
      ctx.strokeStyle = "#009dec";
      ctx.strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
      ctx.restore();
    });
  }

  resize() {
    window.requestAnimationFrame(() => {
      var previewRect = this.dom.parentElement?.getBoundingClientRect();
      if (!previewRect) return;
      // TODO keep aspect ratio...
      this.view.viewSize = new paper.Size(previewRect.width, previewRect.height);

      // Zoom out to show both viewport and document
      const minX = Math.min(this.project.view.bounds.topLeft.x, this.page.bounds.topLeft.x);
      const minY = Math.min(this.project.view.bounds.topLeft.y, this.page.bounds.topLeft.y);
      const maxX = Math.max(
        this.project.view.bounds.bottomRight.x,
        this.page.bounds.bottomRight.x
      );
      const maxY = Math.max(
        this.project.view.bounds.bottomRight.y,
        this.page.bounds.bottomRight.y
      );

      // Always center on the document
      this.view.center = new paper.Point(
        minX + (maxX - minX) / 2,
        minY + (maxY - minY) / 2
      );
      var scaleFactor =
        2 *
        Math.max(
          this.view.center.x - minX,
          this.view.center.y - minY,
          maxX - this.view.center.x,
          maxY - this.view.center.y
        ) *
        1.2;
      this.view.scaling = new paper.Point(
        previewRect.width / scaleFactor,
        previewRect.height / scaleFactor
      );
    });
  }

  moveviewport(e: paper.MouseEvent) {
    if (this.page.bounds.contains(e.point)) {
      this.viewport.center = e.point;
    } else {
      // TODO find closest edge to stick to
      this.viewport.center = e.point;
    }
    e.stop();
  }
}