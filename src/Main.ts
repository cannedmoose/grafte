import * as paper from "paper";
import { createTools } from "./tools/tools";
import { viewProject } from "./ui/layers";
import { queryOrThrow, button, div, text } from "./ui/utils";
import { createMenu } from "./ui/menu";
import { Snap, snapMap, identity, gridSnap } from "./snaps/snaps";
import { ToolContext } from "./tools/tool";
import { createToolOptions } from "./ui/tools";

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
  const canvas = paper.project;
  new paper.Layer();

  const foreground = new paper.Project(foregroundDom);
  const background = new paper.Project(backgroundDom);

  foreground.activate();
  const snapLayer = new paper.Layer({ name: "snap" });
  const styleLayer = new paper.Layer({ name: "style" });
  styleLayer.fillColor = new paper.Color("white");
  styleLayer.strokeColor = new paper.Color("black");
  styleLayer.strokeWidth = 1;
  const toolLayer = new paper.Layer({ name: "tool" });

  snapLayer.opacity = 0.1;
  toolLayer.opacity = 0.1;

  const layersDiv = div({ id: "layers", class: "vertical" }, []);
  const refreshLayers = () => {
    while (layersDiv.firstChild) {
      layersDiv.removeChild(layersDiv.firstChild);
    }
    layersDiv.appendChild(viewProject(canvas, refreshLayers));
  };
  window.requestAnimationFrame(refreshLayers);

  let toolContext: ToolContext = {
    canvas,
    foreground,
    tool: toolLayer,
    snap: snapLayer,
    style: styleLayer,

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
              canvas.activate();
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
};
