import * as paper from "paper";
import { createTools } from "./tools/tools";
import { viewProject } from "./ui/layers";
import { queryOrThrow, button, div, text, canvas } from "./ui/utils";
import { createMenu } from "./ui/menu";
import { createToolOptions } from "./ui/tools";
import { createSaveMenu } from "./ui/save";
import { createLoadMenu } from "./ui/load";

/**
 * TODO resize view handler so we can change document size.
 */

window.onload = function() {
  const canvasDom: HTMLCanvasElement = queryOrThrow(
    "#canvas"
  ) as HTMLCanvasElement;
  const menuDiv = queryOrThrow("#menus");
  const documentViewDom = canvas({
    id: "documentViewcanvas"
  });

  window.onresize = onResize;

  // Set up main canvas
  paper.setup(canvasDom);
  onResize();

  const projectView = paper.project.view;

  const documentView = new paper.CanvasView(paper.project, documentViewDom);
  documentView.viewSize = new paper.Size(600, 400);
  documentView.drawSelection = false;

  if (projectView.bounds.width < projectView.bounds.height) {
    // Scale width;
    projectView.zoom = projectView.bounds.width / (documentView.bounds.width * 1.1);
  } else {
    projectView.zoom = projectView.bounds.height / (documentView.bounds.height * 1.1);
  }

  projectView.center = new paper.Point(
    documentView.bounds.width / 2,
    documentView.bounds.height / 2
  );

  // Set up viewport canvas
  const viewportDom = canvas({});
  const viewport = new paper.CanvasView(paper.project, viewportDom);
  viewport.drawSelection = false;

  window.requestAnimationFrame(() => {
    var viewPortRect = viewportDom.parentElement?.parentElement?.getBoundingClientRect();
    if (viewPortRect) {
      viewport.viewSize = new paper.Size(
        viewPortRect.width,
        viewPortRect.height
      );

      viewport.center = new paper.Point(
        documentView.bounds.width / 2,
        documentView.bounds.height / 2
      );
      var scaleFactor =
        Math.max(documentView.bounds.width, documentView.bounds.height) * 1.2;
      viewport.scaling = new paper.Point(
        viewPortRect.width / scaleFactor,
        viewPortRect.height / scaleFactor
      );
    }
  });

  paper.project.currentStyle.strokeWidth = 1;
  paper.project.currentStyle.strokeColor = new paper.Color("black");
  paper.project.currentStyle.strokeCap = "round";
  paper.project.currentStyle.strokeJoin = "round";

  projectView.on("updated", e => {
    projectView.rawDraw((ctx: CanvasRenderingContext2D, matrix: paper.Matrix) => {
      ctx.save();
      const tl = matrix.transform(documentView.bounds.topLeft);
      const br = matrix.transform(documentView.bounds.bottomRight);
      ctx.fillStyle = "#99999999";
      let region = new Path2D();
      region.rect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
      region.rect(0, 0, projectView.element.width, projectView.element.height);
      ctx.clip(region, "evenodd");
      ctx.fillRect(0, 0, projectView.element.width, projectView.element.height);
      ctx.restore();
    });
    viewport.markDirty();
    refreshLayers();
  });

  viewport.on("updated", e => {
    viewport.rawDraw((ctx: CanvasRenderingContext2D, matrix: paper.Matrix) => {
      ctx.save();
      ctx.lineWidth = 1;
      let tl = matrix.transform(documentView.bounds.topLeft);
      let br = matrix.transform(documentView.bounds.bottomRight);

      ctx.fillStyle = "#999999";
      let region = new Path2D();
      region.rect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
      region.rect(0, 0, projectView.element.width, projectView.element.height);
      ctx.clip(region, "evenodd");
      ctx.fillRect(0, 0, projectView.element.width, projectView.element.height);
      ctx.restore();

      ctx.save();

      tl = matrix.transform(projectView.bounds.topLeft);
      br = matrix.transform(projectView.bounds.bottomRight);
      ctx.strokeStyle = "#009dec";
      ctx.strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
      ctx.restore();
    });
  });

  viewport.on("mousedown", e => {
    projectView.center = e.point;
    e.stop();
  });
  viewport.on("mousedrag", e => {
    projectView.center = e.point;
    e.stop();
  });
  viewport.on("mouseup", e => {
    projectView.center = e.point;
    e.stop();
  });
  menuDiv.appendChild(
    createMenu("viewport-menu", [viewportDom], {
      title: "Viewport",
      minimized: false,
      class: "viewportArea"
    })
  );

  const layersDiv = div({ id: "layers", class: "vertical" }, []);
  const refreshLayers = () => {
    while (layersDiv.firstChild) {
      layersDiv.removeChild(layersDiv.firstChild);
    }
    layersDiv.appendChild(viewProject(paper.project, refreshLayers));
  };
  window.requestAnimationFrame(refreshLayers);

  let { circleTool, penTool, rectTool, selectTool } = createTools(
    paper.project
  );
  penTool.activate();

  menuDiv.appendChild(
    createMenu(
      "layers-menu",
      [
        div({ class: "vertical" }, [
          button({ id: "addlayer", class: "horizontal" }, [text("add")], {
            click: event => {
              paper.project.activate();
              let layer = new paper.Layer();
              refreshLayers();
            }
          }),
          layersDiv
        ])
      ],
      {
        title: "Layers",
        minimized: false,
        class: "layersArea"
      }
    )
  );

  menuDiv.appendChild(
    createMenu(
      "tool-menu",
      [
        div({ class: "vertical" }, [
          button({}, [text("select")], {
            click: () => {
              selectTool.activate();
            }
          }),
          button({}, [text("elipse")], {
            click: () => {
              circleTool.activate();
            }
          }),
          button({}, [text("rect")], {
            click: () => {
              rectTool.activate();
            }
          }),
          button({}, [text("pen")], {
            click: () => {
              penTool.activate();
            }
          })
        ])
      ],
      {
        title: "Tools",
        minimized: false,
        class: "toolArea"
      }
    )
  );

  menuDiv.appendChild(
    createMenu("tooloptions-menu", [createToolOptions(paper.project)], {
      title: "Style",
      minimized: false,
      class: "toolOptionsArea"
    })
  );

  menuDiv.append(
    createMenu("save-menu", [createSaveMenu(documentView)], {
      title: "Style",
      minimized: false,
      class: "saveArea"
    })
  )

  menuDiv.append(
    createMenu("load-menu", [ createLoadMenu(documentView)
    ], {
      title: "Style",
      minimized: false,
      class: "loadArea"
    })
  )

  // SCROLLING WIP
  window.addEventListener("wheel", function(e: WheelEvent) {
    /**
     * Have mouse coords in view space
     * want to zoom and maintain mouse coords in project space
     *
     * TODO add max/min zoom levels
     */
    e.stopPropagation();
    e.preventDefault();
    let newZoom = Math.min(
      Math.max(0.25, projectView.zoom + e.deltaY * 0.1),
      4
    );

    let rect = projectView.element.getBoundingClientRect();
    let mousePoint = new paper.Point(e.x - rect.x, e.y - rect.y);
    let oldMouse = projectView.viewToProject(mousePoint);

    projectView.zoom = newZoom;
    let newMouuse = projectView.viewToProject(mousePoint);
    let newCenter = projectView.center.add(oldMouse.subtract(newMouuse));
    projectView.center = newCenter;

    projectView.requestUpdate();
  });
};

function onResize(event?) {
  var bounds = queryOrThrow(".drawingArea").getBoundingClientRect();
  paper.project.view.viewSize = new paper.Size(bounds.width, bounds.height);

  const canvasDom: HTMLCanvasElement = queryOrThrow(
    "#backgroundcanvas"
  ) as HTMLCanvasElement;
  const ctx = canvasDom.getContext("2d");
  const bgPattern = makeBgPattern(ctx);

  canvasDom.width = bounds.width;
  canvasDom.height = bounds.height;

  if (!ctx) {
    throw "No background context";
  }
  ctx.fillStyle = bgPattern;
  ctx.fillRect(0, 0, bounds.width, bounds.height);
}

function makeBgPattern(ctx) {
  // Create a pattern, offscreen
  const patternCanvas = document.createElement("canvas");
  const patternContext = patternCanvas.getContext("2d");

  if (!patternContext) return;

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
