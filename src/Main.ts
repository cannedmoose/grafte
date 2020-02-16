import * as paper from "paper";
import { createTools } from "./tools/tools";
import { viewProject } from "./ui/layers";
import { queryOrThrow, button, div, text, canvas } from "./ui/utils";
import { createMenu } from "./ui/menu";
import { createToolOptions } from "./ui/tools";

let drawingcanvas;

window.onresize = function(event) {
  var bounds = queryOrThrow(".drawingArea").getBoundingClientRect();
  drawingcanvas.view.viewSize = new paper.Size(bounds.width, bounds.height);
};

window.onload = function() {
  const documentSize = new paper.Size(600, 400);
  const canvasDom: HTMLCanvasElement = queryOrThrow(
    "#canvas"
  ) as HTMLCanvasElement;

  const menuDiv = queryOrThrow("#menus");

  const bgPattern = makeBgPattern(canvasDom.getContext("2d"));

  // Set up main canvas
  var bounds = queryOrThrow(".drawingArea").getBoundingClientRect();
  paper.setup(canvasDom);
  drawingcanvas = paper.project;

  // @ts-ignore
  drawingcanvas._bgPattern = bgPattern;
  drawingcanvas._docSize = documentSize;

  drawingcanvas.view.viewSize = new paper.Size(bounds.width, bounds.height);

  if (bounds.width < bounds.height) {
    // Scale width;
    drawingcanvas.view.zoom = bounds.width / (documentSize.width * 1.1);
  } else {
    // Scale height
  }

  drawingcanvas.view.center = new paper.Point(
    documentSize.width / 2,
    documentSize.height / 2
  );

  drawingcanvas.currentStyle.strokeWidth = 1;
  drawingcanvas.currentStyle.strokeColor = new paper.Color("black");

  //let docRect = new paper.Path.Rectangle(new paper.Point(0, 0), documentSize);
  //docRect.fillColor = new paper.Color("0xFF0000");

  // Set up viewport canvas
  const viewportDom = canvas({});
  // @ts-ignore
  const viewport: paper.View = new paper.CanvasView(
    drawingcanvas,
    viewportDom
  ) as paper.View;
  window.requestAnimationFrame(() => {
    var width = viewportDom.parentElement?.parentElement?.clientWidth;
    var height = viewportDom.parentElement?.parentElement?.clientHeight;
    if (!width || !height) {
      return;
    }
    viewport.viewSize = new paper.Size(width, height);

    viewport.center = new paper.Point(
      documentSize.width / 2,
      documentSize.height / 2
    );
    var scaleFactor = Math.max(documentSize.width, documentSize.height) * 1.2;
    viewport.scaling = new paper.Point(
      width / scaleFactor,
      height / scaleFactor
    );
  });
  // @ts-ignore
  viewport._skipSelection = true;

  //@ts-ignore
  drawingcanvas.on("change", e => {
    // @ts-ignore
    viewport._needsUpdate = true;
    viewport.requestUpdate();

    refreshLayers();
  });

  viewport.on("mousedown", e => {
    drawingcanvas.view.center = e.point;
    e.stop();
  });
  viewport.on("mousedrag", e => {
    drawingcanvas.view.center = e.point;
    e.stop();
  });
  viewport.on("mouseup", e => {
    drawingcanvas.view.center = e.point;
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
    layersDiv.appendChild(viewProject(drawingcanvas, refreshLayers));
  };
  window.requestAnimationFrame(refreshLayers);

  let { circleTool, penTool, rectTool, selectTool } = createTools(
    drawingcanvas
  );
  penTool.activate();

  menuDiv.appendChild(
    createMenu(
      "layers-menu",
      [
        div({ class: "vertical" }, [
          button({ id: "addlayer", class: "horizontal" }, [text("add")], {
            click: event => {
              drawingcanvas.activate();
              let layer = new paper.Layer();
              refreshLayers();
            }
          }),
          layersDiv,
          button({ id: "savebutton", class: "horizontal" }, [text("save")], {
            click: event => {
              const json = drawingcanvas.exportJSON({ asString: "true" });
              window.localStorage.setItem("saved", json);
            }
          }),
          button({ id: "loadbutton", class: "horizontal" }, [text("load")], {
            click: event => {
              const json = window.localStorage.getItem("saved");
              if (json) {
                drawingcanvas.deselectAll();
                drawingcanvas.clear();
                drawingcanvas.importJSON(json);
              }
            }
          })
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
    createMenu("tooloptions-menu", [createToolOptions(drawingcanvas)], {
      title: "Style",
      minimized: false,
      class: "toolOptionsArea"
    })
  );

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
      Math.max(0.25, drawingcanvas.view.zoom + e.deltaY * 0.1),
      4
    );

    let rect = drawingcanvas.view.element.getBoundingClientRect();
    let mousePoint = new paper.Point(e.x - rect.x, e.y - rect.y);
    let oldMouse = drawingcanvas.view.viewToProject(mousePoint);

    drawingcanvas.view.zoom = newZoom;
    let newMouuse = drawingcanvas.view.viewToProject(mousePoint);
    let newCenter = drawingcanvas.view.center.add(oldMouse.subtract(newMouuse));
    drawingcanvas.view.center = newCenter;

    drawingcanvas.view.requestUpdate();
  });
};

function makeBgPattern(ctx) {
  // Create a pattern, offscreen
  const patternCanvas = document.createElement("canvas");
  const patternContext = patternCanvas.getContext("2d");

  if (!patternContext) return;

  // Give the pattern a width and height of 50
  patternCanvas.width = 50;
  patternCanvas.height = 50;

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
