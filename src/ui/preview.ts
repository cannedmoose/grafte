import * as paper from "paper";
import { canvas } from "./utils/dom";
import { Tab } from "./components/panes/pane";
import { AttachedPaneer } from "./paneer/paneer";
import { Pan } from "./paneer/template";
import { Serializer } from "./utils/deserializer";
import { Resource, Store } from "./utils/store";

export class Preview extends AttachedPaneer implements Tab {
  tab: true = true;
  label = "Preview";
  canvas: HTMLCanvasElement;
  view: paper.CanvasView;
  resizing: boolean;
  project: Resource<paper.Project>;


  constructor(project: Resource<paper.Project>) {
    super(Pan/*html*/`<div></div>`);
    this.canvas = canvas({});
    this.element.append(this.canvas);
    this.style = {
      position: "absolute",
      top: "0",
      bottom: "0",
      left: "0",
      right: "0"
    }
    this.element.style.position = "absolute";
    this.project = project;
    this.view = new paper.CanvasView(project.content, this.canvas);
    // TODO(P3) limit framerate...
    //this.view.autoUpdate = false;

    this.view.drawSelection = false;

    this.view.on("updated", this.onViewUpdated.bind(this));
    this.view.on("mousedown", this.moveviewport.bind(this));
    this.view.on("mousedrag", this.moveviewport.bind(this));
    this.view.on("mouseup", this.moveviewport.bind(this));
  }

  onViewUpdated() {
    this.view.rawDraw((ctx: CanvasRenderingContext2D, matrix: paper.Matrix) => {
      ctx.save();
      ctx.lineWidth = 1;
      let tl = matrix.transform(this.project.content.view.bounds.topLeft);
      let br = matrix.transform(this.project.content.view.bounds.bottomRight);

      ctx.fillStyle = "#999999";
      let region = new Path2D();
      region.rect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
      region.rect(0, 0, this.canvas.width, this.canvas.height);
      ctx.clip(region, "evenodd");
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.restore();

      ctx.save();

      ctx.strokeStyle = "#009dec";
      for (let view of this.project.content.views) {
        if (view === this.view || view === this.project.content.view) {
          continue;
        }
        tl = matrix.transform(view.bounds.topLeft);
        br = matrix.transform(view.bounds.bottomRight);
        ctx.strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
      }
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
    const minX = this.project.content.view.bounds.topLeft.x;
    const minY = this.project.content.view.bounds.topLeft.y;
    const maxX = this.project.content.view.bounds.bottomRight.x;
    const maxY = this.project.content.view.bounds.bottomRight.y;

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
    for (let view of this.project.content.views) {
      if (view === this.view || view === this.project.content.view) {
        continue;
      }
      view.center = e.point;
    }

    e.stop();
  }
}

Serializer.register(
  Preview,
  (raw: any) => {
    const node = new Preview(Store.getResource("project", "default"));
    return node;
  },
  (raw: Preview) => {
    return {};
  }
);