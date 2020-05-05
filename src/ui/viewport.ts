import * as paper from "paper";
import { canvas } from "./utils/dom";
import { AttachedPaneer } from "./paneer/paneer";
import { Tab } from "./components/panes/pane";
import { Pan } from "./paneer/template";
import { Serializer } from "./utils/deserializer";
import { Resource, Store } from "./utils/store";

export class Viewport extends AttachedPaneer implements Tab {
  tab: true = true;
  label = "Canvas";
  element: HTMLDivElement;
  mainCanvas: HTMLCanvasElement;
  backgroundCanvas: HTMLCanvasElement;

  view: paper.View;
  viewport: paper.View;

  resizing: boolean;

  projectR: Resource<paper.Project>;


  constructor(project: Resource<paper.Project>) {
    super(Pan/*html*/`<div></div>`);
    this.element.style.overflow = "hidden";
    this.projectR = project;

    this.mainCanvas = canvas({});
    this.backgroundCanvas = canvas({});

    this.append(this.backgroundCanvas);
    this.append(this.mainCanvas);

    this.style = {
      pointerEvents: "all",
      position: "absolute",
      top: "0px",
      bottom: "0px",
      left: "0px",
      right: "0px"
    }

    this.mainCanvas.style.position = "absolute";
    this.mainCanvas.style.top = "0px";
    this.mainCanvas.style.left = "0px";
    this.mainCanvas.style.bottom = "0px";
    this.mainCanvas.style.right = "0px";

    // TODO(P5) is there a less hackey way to do this?
    this.mainCanvas.setAttribute("tabindex", "0");
    this.mainCanvas.addEventListener("click", e => {
      this.mainCanvas.focus();
    });

    this.view = new paper.CanvasView(this.projectR.content, this.mainCanvas);

    this.projectR.content.view.on("changed", () => this.centerPage());

    this.view.on("updated", this.onViewUpdated.bind(this));
    window.addEventListener("wheel", this.onScroll.bind(this));
    // TODO(P3) is this needed, maybe should be on pane.
    window.onresize = () => this.resize();

    this.resizing = false;

    this.resize();
    this.centerPage();
  }

  onViewUpdated() {
    this.view.rawDraw((ctx: CanvasRenderingContext2D, matrix: paper.Matrix) => {
      ctx.save();
      const tl = matrix.transform(this.projectR.content.view.bounds.topLeft);
      const br = matrix.transform(this.projectR.content.view.bounds.bottomRight);
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
    if (!this.resizing) {
      window.requestAnimationFrame(this.doResize.bind(this));
      this.resizing = true;
    }
  }

  doResize() {
    let viewportRect = this.view.element.parentElement?.getBoundingClientRect();
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
    this.resizing = false;
  }

  makeBgPattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
    // TODO(P3) cache this, it's a memory leak...
    // Should be better when we have background/tool layer back
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
        this.view.zoom = this.view.bounds.height / (this.projectR.content.view.bounds.height * 1.1);
      } else {
        this.view.zoom = this.view.bounds.width / (this.projectR.content.view.bounds.width * 1.1);
      }

      this.view.center = new paper.Point(
        this.projectR.content.view.bounds.left + this.projectR.content.view.bounds.width / 2,
        this.projectR.content.view.bounds.top + this.projectR.content.view.bounds.height / 2
      );
    });
  }

  onScroll(e: WheelEvent) {
    if (e.target != this.mainCanvas) {
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    let maxZoom, minZoom;
    if (this.view.bounds.width > this.view.bounds.height) {
      maxZoom = this.view.viewSize.height / (this.projectR.content.view.viewSize.height * 2);
      minZoom = this.view.viewSize.height / (this.projectR.content.view.viewSize.height * 0.2);
    } else {
      maxZoom = this.view.viewSize.width / (this.projectR.content.view.viewSize.width * 2);
      minZoom = this.view.viewSize.width / (this.projectR.content.view.viewSize.width * 0.2);
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
    this.view.center = newCenter;
  }
}


Serializer.register(
  Viewport,
  (raw: any) => {
    return new Viewport(Store.getResource("project", "default"));
  },
  (raw: Viewport) => {
    return {};
  }
);