import * as paper from "paper";
import { canvas } from "./utils/dom";
import { Viewport } from "./viewport";
import { Tab } from "./components/panes/pane";
import { AttachedPaneer } from "./paneer/paneer";
import { Pan } from "./paneer/template";
import { Serializer } from "./paneer/deserializer";

export class Preview extends AttachedPaneer implements Tab {
  tab: true = true;
  label = "Preview";
  canvas: HTMLCanvasElement;
  view: paper.CanvasView;
  viewport: Viewport;
  resizing: boolean;


  constructor(project: paper.Project, viewport: Viewport) {
    super(Pan/*html*/`<div></div>`);
    this.canvas = canvas({});
    this.element.append(this.canvas);
    this.element.style.position = "absolute";
    this.element.style.top = "0";
    this.element.style.bottom = "0";
    this.element.style.left = "0";
    this.element.style.right = "0";
    this.view = new paper.CanvasView(project, this.canvas);

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
      region.rect(0, 0, this.canvas.width, this.canvas.height);
      ctx.clip(region, "evenodd");
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
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
    if (!this.resizing) {
      window.requestAnimationFrame(this.doResize.bind(this));
      this.resizing = true;
    }
  }

  doResize() {
    var previewRect = this.element.getBoundingClientRect();
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

    this.resizing = false;
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

Serializer.register(
  Preview,
  (raw: any) => {
    //@ts-ignore
    const ctx: any = window.ctx;
    const node = new Preview(paper.project, ctx.viewport);
    return node;
  },
  (raw: Preview) => {
    return {};
  }
);