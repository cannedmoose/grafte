import * as paper from "paper";
import { createTools } from "./tools/tools";
import { viewProject } from "./ui/layers";
import { queryOrThrow, button, div, text, canvas } from "./ui/utils";
import { createMenu } from "./ui/menu";
import { Snap, snapMap, identity, gridSnap } from "./snaps/snaps";
import { ToolContext } from "./tools/tool";
import { createToolOptions } from "./ui/tools";
import { deselectAll } from "./tools/select";

function stoPoint(size: paper.Size) {
  return new paper.Point(
    paper.view.bounds.size.width,
    paper.view.bounds.size.height
  );
}

function rtoPoint(rect: paper.Rectangle) {
  return stoPoint(rect.size);
}

window.onload = function() {
  let canvasDom: HTMLCanvasElement = queryOrThrow(
    "#canvas"
  ) as HTMLCanvasElement;
  let foregroundDom: HTMLCanvasElement = queryOrThrow(
    "#foreground"
  ) as HTMLCanvasElement;
  let backgroundDom: HTMLCanvasElement = queryOrThrow(
    "#background"
  ) as HTMLCanvasElement;

  // Set up main canvas
  paper.setup(canvasDom);
  const drawingcanvas = paper.project;
  new paper.Layer();

  const foreground = new paper.Project(foregroundDom);
  const background = new paper.Project(backgroundDom);

  foreground.activate();
  paper.settings.handleSize = 7;
  const snapLayer = new paper.Layer({ name: "snap" });
  // Style layer stores current style
  const styleLayer = new paper.Layer({ name: "style" });
  styleLayer.fillColor = new paper.Color("white");
  styleLayer.strokeColor = new paper.Color("black");
  styleLayer.strokeWidth = 1;
  // Tool layer stores tool draw paths, these do not exist on the canvas
  const toolLayer = new paper.Layer({ name: "tool" });
  toolLayer.fillColor = null;
  toolLayer.strokeColor = new paper.Color("#009dec");
  toolLayer.strokeWidth = 1;
  toolLayer.bounds.selected = true;
  // Select layer stores selections. Objects are copied here when selected and copied back to canvas after.
  const selectLayer = new paper.Layer({ name: "select" });

  snapLayer.opacity = 0.1;

  const layersDiv = div({ id: "layers", class: "vertical" }, []);
  const refreshLayers = () => {
    while (layersDiv.firstChild) {
      layersDiv.removeChild(layersDiv.firstChild);
    }
    layersDiv.appendChild(viewProject(drawingcanvas, refreshLayers));
  };
  window.requestAnimationFrame(refreshLayers);

  let toolContext: ToolContext = {
    canvas: drawingcanvas,
    foreground,
    tool: toolLayer,
    snap: snapLayer,
    style: styleLayer,
    select: selectLayer,

    updated: refreshLayers
  };

  console.log(toolContext);

  let { circleTool, penTool, rectTool, selectTool } = createTools(toolContext);

  let menuDiv = queryOrThrow("#menus");
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
                deselectAll(toolContext);
                drawingcanvas.clear();
                drawingcanvas.importJSON(json);
                refreshLayers();
              }
            }
          })
        ])
      ],
      {
        title: "Layers",
        minimized: false,
        bounds: new paper.Rectangle(70, 0, 240, 140)
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
          }),
          button({}, [text("grid")], {
            click: () => {
              if (!snapLayer.data.snap) {
                snapLayer.data.snap = gridSnap(
                  new paper.Point(30, 30),
                  new paper.Point(0, 0)
                );

                snapLayer.activate();
                snapLayer.style.strokeWidth = 2;
                snapLayer.style.strokeColor = new paper.Color("black");
                snapLayer.data.snap.view(new paper.Point(0, 0));
              } else {
                foreground.activate();
                snapLayer.activate();
                snapLayer.removeChildren();
                snapLayer.data.snap = undefined;
              }
            }
          })
        ])
      ],
      {
        title: "Tools",
        minimized: false,
        bounds: new paper.Rectangle(0, 0, 70, 140)
      }
    )
  );

  menuDiv.appendChild(
    createMenu("tooloptions-menu", [createToolOptions(toolContext)], {
      title: "Style",
      minimized: false,
      bounds: new paper.Rectangle(0, 140, 70, 140)
    })
  );

  const viewportDom = canvas({ style: "position:relative" });
  const viewport = new paper.Project(viewportDom);
  viewport.view.viewSize = new paper.Size(
    window.innerWidth / 4,
    window.innerHeight / 4
  );
  menuDiv.appendChild(
    createMenu(
      "viewport-menu",
      [
        viewportDom,
        button({}, [text("gen")], {
          click: event => {
            viewport.activate();
            viewport.clear();
            const el = new paper.Point(
              viewport.view.element.width / 2,
              viewport.view.element.height / 2
            );
            const inner = new paper.Point(
              window.innerWidth,
              window.innerHeight
            );
            const s = el.divide(inner);
            const json = drawingcanvas.exportJSON({ asString: false });

            viewport.view.scaling = s;
            viewport.view.center = drawingcanvas.view.center;

            const view = new paper.Path.Rectangle(new paper.Point(0, 0), inner);
            view.bounds.center = drawingcanvas.view.center;
            view.scaling = new paper.Point(1, 1).divide(
              new paper.Point(drawingcanvas.view.zoom, drawingcanvas.view.zoom)
            );
            view.strokeColor = new paper.Color("black");
            view.strokeWidth = 2;

            viewport.importJSON(json);
            viewport.view.requestUpdate();
          }
        })
      ],
      {
        title: "Viewport",
        minimized: false,
        bounds: new paper.Rectangle(
          70,
          140,
          window.innerWidth / 3,
          window.innerHeight / 2
        )
      }
    )
  );

  // SCROLLING WIP
  window.addEventListener("wheel", function(e: WheelEvent) {
    /**
     * Have mouse coords in view space
     * want to zoom and maintain mouse coords in project space
     *
     * TODO add max/min zoom levels
     */
    let newZoom = Math.max(0.01, drawingcanvas.view.zoom + e.deltaY * 0.1);
    let oldMouse = drawingcanvas.view.viewToProject(new paper.Point(e.x, e.y));

    drawingcanvas.view.zoom = newZoom;
    let newMouuse = drawingcanvas.view.viewToProject(new paper.Point(e.x, e.y));
    let newCenter = drawingcanvas.view.center.add(oldMouse.subtract(newMouuse));
    drawingcanvas.view.center = newCenter;

    foreground.view.center = newCenter;
    foreground.view.zoom = newZoom;

    background.view.center = newCenter;
    background.view.zoom = newZoom;

    drawingcanvas.view.requestUpdate();
    foreground.view.requestUpdate();
    background.view.requestUpdate();
  });
};
