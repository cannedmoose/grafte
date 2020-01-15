import * as paper from "paper";
import {
  querySelectorOrThrow,
  createDiv,
  createButton,
  createCheckBox
} from "./utils";

/**
 * Display layers
 */

function showSlider(
  classes: string,
  value: number,
  min: number,
  max: number,
  onChange: (event) => void
): HTMLElement {
  let ele = document.createElement("input");
  ele.setAttribute("type", "range");
  ele.setAttribute("class", classes);
  ele.setAttribute("min", min.toString());
  ele.setAttribute("max", max.toString());
  ele.setAttribute("step", "0.01x");
  ele.setAttribute("value", value.toString());
  ele.addEventListener("change", onChange);
  return ele;
}

function showLayer(layer: paper.Layer): HTMLElement {
  let layerDiv = createDiv("", "horizontal", [
    createCheckBox("", "V", layer.visible, event => {
      layer.visible = !layer.visible;
      showLayers();
    }),
    createButton(
      layer == paper.project.activeLayer ? "selected" : "",
      layer.name,
      () => {
        layer.activate();
        showLayers();
      }
    ),
    showSlider("", layer.opacity, 0, 1, event => {
      layer.opacity = event.target.value;
    })
  ]);

  return layerDiv;
}

export function showLayers() {
  let layersDiv = querySelectorOrThrow("#layers");
  while (layersDiv.firstChild) {
    layersDiv.removeChild(layersDiv.firstChild);
  }
  for (let i = 0; i < paper.project.layers.length; i++) {
    let layer = paper.project.layers[i];
    if (!layer.name) {
      layer.name = "layer " + i;
    }
    let itemDiv = document.createElement("li");
    itemDiv.appendChild(showLayer(layer));
    layersDiv.appendChild(itemDiv);
  }

  let addDiv = document.createElement("li");
  addDiv.appendChild(
    createButton("", "Add", () => {
      let l = new paper.Layer();
      paper.project.addLayer(l);
      l.activate();
      showLayers();
    })
  );
  layersDiv.appendChild(addDiv);
}

/**
 * Display tools
 */
function getStroke() {
  let selector: HTMLInputElement = querySelectorOrThrow(
    "#stroke"
  ) as HTMLInputElement;
  return new paper.Color(selector.value);
}

function getFill() {
  let selector: HTMLInputElement = querySelectorOrThrow(
    "#fill"
  ) as HTMLInputElement;
  return new paper.Color(selector.value);
}

function getWidth() {
  let selector: HTMLInputElement = querySelectorOrThrow(
    "#width"
  ) as HTMLInputElement;
  return Number(selector.value);
}

function getOpacity() {
  let selector: HTMLInputElement = querySelectorOrThrow(
    "#opacity"
  ) as HTMLInputElement;
  return Number(selector.value);
}

export function createTools() {
  // Circle
  let circleTool = new paper.Tool();
  let circlePath = new paper.Path();
  let toolPath = new paper.Path();

  circleTool.onMouseDrag = function(event) {
    circlePath.remove();
    circlePath = new paper.Path.Circle({
      center: event.downPoint,
      radius: event.downPoint.getDistance(event.point)
    });
    toolPath.remove();
    toolPath = new paper.Path.Circle({
      center: event.downPoint,
      radius: event.downPoint.getDistance(event.point)
    });
    toolPath.strokeColor = new paper.Color("DeepSkyBlue");
    toolPath.strokeWidth = Math.min(getWidth() * 0.1, 1);

    circlePath.strokeColor = getStroke();
    circlePath.fillColor = getFill();
    circlePath.strokeWidth = getWidth();
    circlePath.opacity = getOpacity() * 0.1;
  };

  circleTool.onMouseUp = function(event) {
    circlePath.strokeColor = getStroke();
    circlePath.fillColor = getFill();
    circlePath.strokeWidth = getWidth();
    circlePath.opacity = getOpacity();
    toolPath.remove();
    circlePath = new paper.Path();
    showLayers();
  };

  // Rect
  let rectTool = new paper.Tool();
  let rectPath = new paper.Path();

  rectTool.onMouseDrag = function(event) {
    rectPath.remove();
    rectPath = new paper.Path.Rectangle({
      point: event.downPoint,
      size: event.point.subtract(event.downPoint)
    });

    toolPath.remove();
    toolPath = new paper.Path.Rectangle({
      point: event.downPoint,
      size: event.point.subtract(event.downPoint)
    });
    toolPath.strokeColor = new paper.Color("DeepSkyBlue");
    toolPath.strokeWidth = Math.min(getWidth() * 0.1, 1);

    rectPath.strokeColor = new paper.Color("DeepSkyBlue");
    rectPath.fillColor = new paper.Color(0, 0, 0, 0);
  };

  rectTool.onMouseUp = function(event) {
    rectPath.strokeColor = getStroke();
    rectPath.fillColor = getFill();
    rectPath.strokeWidth = getWidth();
    rectPath.opacity = getOpacity();
    rectPath = new paper.Path();
    toolPath.remove();
    showLayers();
  };

  // Pen
  let penTool = new paper.Tool();
  let penPath = new paper.Path();

  penTool.minDistance = 5;

  penTool.onMouseDown = function(event) {
    penPath = new paper.Path();
    penPath.strokeColor = new paper.Color("DeepSkyBlue");
  };

  penTool.onMouseDrag = function(event) {
    penPath.add(event.point);
  };

  penTool.onMouseUp = function(event) {
    penPath.strokeColor = getStroke();
    penPath.strokeWidth = getWidth();
    penPath.opacity = getOpacity();
    penPath.smooth();
    showLayers();
  };

  return { circleTool, penTool, rectTool };
}
