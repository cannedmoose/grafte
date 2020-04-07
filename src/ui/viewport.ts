import * as paper from "paper";
import { canvas, div } from "./utils/dom";

export class Viewport {
  element: HTMLDivElement;
  mainCanvas: HTMLCanvasElement;
  backgroundCanvas: HTMLCanvasElement;

  view: paper.View;

  page: paper.CanvasView;
  project: paper.Project;
  viewport: paper.View;


  constructor() {
    this.mainCanvas = canvas({});
    this.backgroundCanvas = canvas({});

    this.element = div({}, [this.backgroundCanvas, this.mainCanvas]);
    this.element.style.pointerEvents = "all";
    this.element.style.position = "relative";
    this.element.style.height = "100%";

    this.mainCanvas.style.position = "absolute";
    this.mainCanvas.style.top = "0px";
    this.mainCanvas.style.left = "0px";

    // TODO(P3) setup manually..
    paper.setup(this.mainCanvas);
    this.project = paper.project;
    this.view = paper.project.view;

    const pageDom = canvas({
      id: "canvaspage"
    });
    this.page = new paper.CanvasView(paper.project, pageDom);
    this.page.viewSize = new paper.Size(600, 400);
    this.page.drawSelection = false;
    this.page.on("changed", () => this.centerPage());

    this.view.on("updated", this.onViewUpdated.bind(this));
    window.addEventListener("wheel", this.onScroll.bind(this));
    window.onresize = () => this.resize();
  }

  onViewUpdated() {
    this.view.rawDraw((ctx: CanvasRenderingContext2D, matrix: paper.Matrix) => {
      ctx.save();
      const tl = matrix.transform(this.page.bounds.topLeft);
      const br = matrix.transform(this.page.bounds.bottomRight);
      ctx.fillStyle = "#99999999";
      let region = new Path2D();
      region.rect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
      region.rect(0, 0, this.view.element.width, this.view.element.height);
      ctx.clip(region, "evenodd");
      ctx.fillRect(0, 0, this.view.element.width, this.view.element.height);
      ctx.restore();
    });
  }

  resize() {
    window.requestAnimationFrame(() => {
      var viewportRect = this.view.element.parentElement?.getBoundingClientRect();
      if (!viewportRect) return;
      this.view.viewSize = new paper.Size(viewportRect.width, viewportRect.height);

      const ctx = this.backgroundCanvas.getContext("2d");
      if (!ctx) return;
      const bgPattern = this.makeBgPattern(ctx);

      this.backgroundCanvas.width = viewportRect.width;
      this.backgroundCanvas.height = viewportRect.height;

      if (!ctx) {
        throw "No background context";
      }
      ctx.fillStyle = bgPattern || "white";
      ctx.fillRect(0, 0, viewportRect.width, viewportRect.height);
    });
  }

  makeBgPattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
    // TODO(P3) cache this, it's a memory leak...
    // Create a pattern, offscreen
    const patternCanvas = document.createElement("canvas");
    const patternContext = patternCanvas.getContext("2d");

    if (!patternContext) return null;

    // Give the pattern a width and height of 10
    patternCanvas.width = 10;
    patternCanvas.height = 10;

    // Give the pattern a background color and draw an arc
    patternContext.fillStyle = "#aaa";
    patternContext.fillRect(
      0,
      0,
      patternCanvas.width / 2,
      patternCanvas.height / 2
    );
    patternContext.fillRect(
      patternCanvas.width / 2,
      patternCanvas.height / 2,
      patternCanvas.width,
      patternCanvas.height
    );

    return ctx.createPattern(patternCanvas, "repeat");
  }

  centerPage() {
    window.requestAnimationFrame(() => {
      if (this.view.bounds.width < this.view.bounds.height) {
        this.view.zoom = this.view.bounds.height / (this.page.bounds.height * 1.1);
      } else {
        this.view.zoom = this.view.bounds.width / (this.page.bounds.width * 1.1);
      }

      this.view.center = new paper.Point(
        this.page.bounds.width / 2,
        this.page.bounds.height / 2
      );
    });
  }

  onScroll(e: WheelEvent) {
    //e.stopPropagation();
    //e.preventDefault();
    /*
    let maxZoom, minZoom;
    if (this.view.bounds.width > this.view.bounds.height) {
      maxZoom = this.view.viewSize.height / (this.page.viewSize.height * 2);
      minZoom = this.view.viewSize.height / (this.page.viewSize.height * 0.2);
    } else {
      maxZoom = this.view.viewSize.width / (this.page.viewSize.width * 2);
      minZoom = this.view.viewSize.width / (this.page.viewSize.width * 0.2);
    }

    // TODO(P3) smoother zooming
    // Zoom in/out
    let newZoom = Math.min(
      Math.max(maxZoom, this.view.zoom + e.deltaY * 0.1),
      minZoom
    );

    // Recenter viewport
    let rect = this.view.element.getBoundingClientRect();
    let mousePoint = new paper.Point(e.x - rect.x, e.y - rect.y);
    let oldMouse = this.view.viewToProject(mousePoint);
    this.view.zoom = newZoom;

    let newMouse = this.view.viewToProject(mousePoint);
    let newCenter = this.view.center.add(oldMouse.subtract(newMouse));
    this.view.center = newCenter;*/
  }

}