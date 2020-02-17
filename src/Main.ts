import * as paper from "paper";
import { createTools } from "./tools/tools";
import { viewProject } from "./ui/layers";
import { queryOrThrow, button, div, text, canvas } from "./ui/utils";
import { createMenu } from "./ui/menu";
import { createToolOptions } from "./ui/tools";

window.onload = function() {
  const canvasDom: HTMLCanvasElement = queryOrThrow(
    "#canvas"
  ) as HTMLCanvasElement;
  const menuDiv = queryOrThrow("#menus");
  const documentDom = canvas({
    id: "documentcanvas"
  });

  window.onresize = onResize;

  // Set up main canvas
  paper.setup(canvasDom);
  onResize();

  paper.project.view.viewSize = new paper.Size(
    canvasDom.width,
    canvasDom.height
  );

  const document= new paper.CanvasView(paper.project, documentDom);

  document.viewSize = new paper.Size(600, 400);

  // @ts-ignore
  paper.project._docSize = new paper.Size(600, 400);

  if (canvasDom.width < canvasDom.height) {
    // Scale width;
    paper.project.view.zoom = canvasDom.width / (document.bounds.width * 1.1);
  } else {
    // Scale height
  }

  paper.project.view.center = new paper.Point(
    document.bounds.width / 2,
    document.bounds.height / 2
  );

  // Set up viewport canvas
  const viewportDom = canvas({});
  // @ts-ignore
  const viewport = new paper.CanvasView(paper.project, viewportDom);

  // @ts-ignore
  viewport._skipSelection = true;

  window.requestAnimationFrame(() => {
    var viewPortRect = viewportDom.parentElement?.parentElement?.getBoundingClientRect();
    if (viewPortRect) {
      viewport.viewSize = new paper.Size(
        viewPortRect.width,
        viewPortRect.height
      );

      viewport.center = new paper.Point(
        document.bounds.width / 2,
        document.bounds.height / 2
      );
      var scaleFactor =
        Math.max(document.bounds.width, document.bounds.height) * 1.2;
      viewport.scaling = new paper.Point(
        viewPortRect.width / scaleFactor,
        viewPortRect.height / scaleFactor
      );
    }
  });

  paper.project.currentStyle.strokeWidth = 1;
  paper.project.currentStyle.strokeColor = new paper.Color("black");

  //@ts-ignore
  paper.project.view.on("update", e => {
    // @ts-ignore
    viewport._needsUpdate = true;
    viewport.requestUpdate();

    refreshLayers();
  });

  viewport.on("mousedown", e => {
    paper.project.view.center = e.point;
    e.stop();
  });
  viewport.on("mousedrag", e => {
    paper.project.view.center = e.point;
    e.stop();
  });
  viewport.on("mouseup", e => {
    paper.project.view.center = e.point;
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
          layersDiv,
          button(
            {
              id: "savebutton",
              class: "horizontal"
            },
            [text("save")],
            {
              click: event => {
                const json = paper.project.exportJSON({ asString: "true" });
                window.localStorage.setItem("saved", json);
              }
            }
          ),
          button(
            {
              id: "loadbutton",
              class: "horizontal"
            },
            [text("load")],
            {
              click: event => {
                const json = window.localStorage.getItem("saved");
                if (json) {
                  paper.project.deselectAll();
                  paper.project.clear();
                  paper.project.importJSON(json);
                }
              }
            }
          )
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
      Math.max(0.25, paper.project.view.zoom + e.deltaY * 0.1),
      4
    );

    let rect = paper.project.view.element.getBoundingClientRect();
    let mousePoint = new paper.Point(e.x - rect.x, e.y - rect.y);
    let oldMouse = paper.project.view.viewToProject(mousePoint);

    paper.project.view.zoom = newZoom;
    let newMouuse = paper.project.view.viewToProject(mousePoint);
    let newCenter = paper.project.view.center.add(oldMouse.subtract(newMouuse));
    paper.project.view.center = newCenter;

    paper.project.view.requestUpdate();
  });
};

function setupBgCanvas() {
  const canvasDom: HTMLCanvasElement = queryOrThrow(
    "#canvas"
  ) as HTMLCanvasElement;
  const bgPattern = makeBgPattern(canvasDom.getContext("2d"));
}

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
