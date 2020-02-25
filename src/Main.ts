import * as paper from "paper";
import { viewProject } from "./ui/layers";
import { queryOrThrow, button, div, text,  canvas} from "./ui/utils";
import { createMenu } from "./ui/menu";
import { createToolOptions, ToolBelt } from "./ui/tools";
import { createSaveMenu } from "./ui/save";
import { createLoadMenu } from "./ui/load";
import { KeyboardHandler } from "./ui/keyboard";
import { GrafteHistory } from "./tools/history";

/**
 * TODO resize view handler so we can change document size.
 * Important concepts:
 * Viewport: the main view of the project
 * preview: smaller preview window of the project
 * page: the vview of the window that is exported
 */

window.onload = function() {
  const viewportDom: HTMLCanvasElement = queryOrThrow(
    "#canvas"
  ) as HTMLCanvasElement;
  const menuDiv = queryOrThrow("#menus");
  const pageDom = canvas({
    id: "canvaspage"
  });

  // Set up main viewport
  paper.setup(viewportDom);
  const viewport = paper.project.view;
  resizeViewport(viewport);
  window.onresize = e => resizeViewport(viewport);

  // Set up page
  const page = new paper.CanvasView(paper.project, pageDom);
  page.viewSize = new paper.Size(600, 400);
  page.drawSelection = false;
  centerPage(viewport, page);
  page.on("changed", () => centerPage(viewport, page));

  // Set up preview paper.project
  const previewDom = canvas({});
  const preview = new paper.CanvasView(paper.project, previewDom);
  preview.drawSelection = false;
  resizePreview(viewport, preview, page);
  viewport.on("changed", () => resizePreview(viewport, preview, page));

  paper.project.currentStyle.strokeWidth = 1;
  paper.project.currentStyle.strokeColor = new paper.Color("black");
  paper.project.currentStyle.strokeCap = "round";
  paper.project.currentStyle.strokeJoin = "round";
  paper.settings.handleSize = 6;

  // Draw page window onto viewport
  viewport.on("updated", e => {
    viewport.rawDraw((ctx: CanvasRenderingContext2D, matrix: paper.Matrix) => {
      ctx.save();
      const tl = matrix.transform(page.bounds.topLeft);
      const br = matrix.transform(page.bounds.bottomRight);
      ctx.fillStyle = "#99999999";
      let region = new Path2D();
      region.rect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
      region.rect(0, 0, viewport.element.width, viewport.element.height);
      ctx.clip(region, "evenodd");
      ctx.fillRect(0, 0, viewport.element.width, viewport.element.height);
      ctx.restore();
    });
    preview.markDirty();
    refreshLayers();
  });

  // Draw page window and viewport rect onto preview
  preview.on("updated", e => {
    preview.rawDraw((ctx: CanvasRenderingContext2D, matrix: paper.Matrix) => {
      ctx.save();
      ctx.lineWidth = 1;
      let tl = matrix.transform(page.bounds.topLeft);
      let br = matrix.transform(page.bounds.bottomRight);

      ctx.fillStyle = "#999999";
      let region = new Path2D();
      region.rect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
      region.rect(0, 0, viewport.element.width, viewport.element.height);
      ctx.clip(region, "evenodd");
      ctx.fillRect(0, 0, viewport.element.width, viewport.element.height);
      ctx.restore();

      ctx.save();

      tl = matrix.transform(viewport.bounds.topLeft);
      br = matrix.transform(viewport.bounds.bottomRight);
      ctx.strokeStyle = "#009dec";
      ctx.strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
      ctx.restore();
    });
  });
  

  const history = new GrafteHistory(paper.project);
  
  // Add keyboard event listener and default keyboard events
  const keyboardHandler = new KeyboardHandler(window);
  const toolBelt = new ToolBelt(history, keyboardHandler);

  keyboardHandler.addShortcut("backspace", e => {
    e.preventDefault();
    paper.project.selectedItems.forEach(item => item.remove());
    history.commit();
  });

  keyboardHandler.addShortcut("control+z", e => {
    e.preventDefault();
    history.undo();
  });
  
  keyboardHandler.addShortcut("control+shift+z", e => {
    e.preventDefault();
    history.redo();
  });

  menuDiv.appendChild(
    createMenu("preview-menu", [previewDom], {
      title: "Viewport",
      minimized: false,
      class: "previewArea"
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

  menuDiv.appendChild(
    createMenu(
      "layers-menu",
      [
        div({ class: "vertical" }, [
          div({ class: "horizontal" }, [
            button({ id: "addlayer" }, [text("add")], {
              click: event => {
                new paper.Layer();
                refreshLayers();
              }
            }),
            button({ id: "addlayer" }, [text("up")], {
              // TODO fix these, they should do one pass to calculate final state
              // rather than a bunch of inserts/not
              // also consider moving into layer above/below
              click: event => {
                paper.project.selectedItems.forEach(item => {
                  const index = item.parent.children.indexOf(item);
                  if (index > 0) {
                    item.parent.insertChild(index - 1, item);
                  }
                });
              }
            }),
            button({ id: "addlayer" }, [text("down")], {
              click: event => {
                paper.project.selectedItems.forEach(item => {
                  const index = item.parent.children.indexOf(item);
                  if (index < item.parent.children.length - 1) {
                    item.parent.insertChild(index + 1, item);
                  }
                });
              }
            })
          ]),
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
    createMenu("tool-menu", [toolBelt.el], {
      title: "Tools",
      minimized: false,
      class: "toolArea"
    })
  );

  menuDiv.appendChild(
    createMenu("tooloptions-menu", [createToolOptions(history)], {
      title: "Style",
      minimized: false,
      class: "toolOptionsArea"
    })
  );

  menuDiv.append(
    createMenu("save-menu", [createSaveMenu(page)], {
      title: "Style",
      minimized: false,
      class: "saveArea"
    })
  );

  menuDiv.append(
    createMenu("load-menu", [createLoadMenu(page)], {
      title: "Style",
      minimized: false,
      class: "loadArea"
    })
  );

  window.addEventListener("wheel", function(e: WheelEvent) {
    e.stopPropagation();
    e.preventDefault();

    let maxZoom, minZoom;
    if (viewport.bounds.width > viewport.bounds.height) {
      maxZoom = viewport.viewSize.height / (page.viewSize.height * 2);
      minZoom = viewport.viewSize.height / (page.viewSize.height * 0.2);
    } else {
      maxZoom = viewport.viewSize.width / (page.viewSize.width * 2);
      minZoom = viewport.viewSize.width / (page.viewSize.width * 0.2);
    }

    // TODO smoother zooming
    // Zoom in/out
    let newZoom = Math.min(
      Math.max(maxZoom, viewport.zoom + e.deltaY * 0.1),
      minZoom
    );

    // Recenter viewport
    let rect = viewport.element.getBoundingClientRect();
    let mousePoint = new paper.Point(e.x - rect.x, e.y - rect.y);
    let oldMouse = viewport.viewToProject(mousePoint);
    viewport.zoom = newZoom;

    let newMouuse = viewport.viewToProject(mousePoint);
    let newCenter = viewport.center.add(oldMouse.subtract(newMouuse));
    viewport.center = newCenter;
  });
  function moveviewport(e: paper.MouseEvent) {
    if (page.bounds.contains(e.point)) {
      viewport.center = e.point;
    } else {
      // TODO find closest edge to stick to
      viewport.center = e.point;
    }
    e.stop();
  }
  preview.on("mousedown", moveviewport);
  preview.on("mousedrag", moveviewport);
  preview.on("mouseup", moveviewport);
};

function centerPage(viewport: paper.View, page: paper.View) {
  window.requestAnimationFrame(() => {
    if (viewport.bounds.width < viewport.bounds.height) {
      viewport.zoom = viewport.bounds.height / (page.bounds.height * 1.1);
    } else {
      viewport.zoom = viewport.bounds.width / (page.bounds.width * 1.1);
    }

    viewport.center = new paper.Point(
      page.bounds.width / 2,
      page.bounds.height / 2
    );
  });
}

function resizePreview(
  viewport: paper.View,
  preview: paper.View,
  page: paper.View
) {
  window.requestAnimationFrame(() => {
    var previewRect = preview.element.parentElement?.parentElement?.getBoundingClientRect();
    if (!previewRect) return;
    preview.viewSize = new paper.Size(previewRect.width, previewRect.height);

    // Zoom out to show both viewport and document
    const minX = Math.min(viewport.bounds.topLeft.x, page.bounds.topLeft.x);
    const minY = Math.min(viewport.bounds.topLeft.y, page.bounds.topLeft.y);
    const maxX = Math.max(
      viewport.bounds.bottomRight.x,
      page.bounds.bottomRight.x
    );
    const maxY = Math.max(
      viewport.bounds.bottomRight.y,
      page.bounds.bottomRight.y
    );

    // Always center on the document
    preview.center = new paper.Point(
      minX + (maxX - minX) / 2,
      minY + (maxY - minY) / 2
    );
    var scaleFactor =
      2 *
      Math.max(
        preview.center.x - minX,
        preview.center.y - minY,
        maxX - preview.center.x,
        maxY - preview.center.y
      ) *
      1.2;
    preview.scaling = new paper.Point(
      previewRect.width / scaleFactor,
      previewRect.height / scaleFactor
    );
  });
}

function resizeViewport(viewport: paper.View) {
  window.requestAnimationFrame(() => {
    var viewportRect = viewport.element.parentElement?.getBoundingClientRect();
    if (!viewportRect) return;
    viewport.viewSize = new paper.Size(viewportRect.width, viewportRect.height);

    const backgroundDom: HTMLCanvasElement = queryOrThrow(
      "#backgroundcanvas"
    ) as HTMLCanvasElement;
    const ctx = backgroundDom.getContext("2d");
    const bgPattern = makeBgPattern(ctx);

    backgroundDom.width = viewportRect.width;
    backgroundDom.height = viewportRect.height;

    if (!ctx) {
      throw "No background context";
    }
    ctx.fillStyle = bgPattern;
    ctx.fillRect(0, 0, viewportRect.width, viewportRect.height);
  });
}

function makeBgPattern(ctx) {
  // TODO cache this, it's a memory leak...
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
