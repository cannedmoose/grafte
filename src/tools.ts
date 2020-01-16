import * as paper from "paper";
import {
  querySelectorOrThrow,
  createSlider,
  createDiv,
  createColor
} from "./utils";
import { showLayers } from "./layers";

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

export function createTools(layersId: string) {
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
    showLayers(layersId);
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
    showLayers(layersId);
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
    showLayers(layersId);
  };

  return { circleTool, penTool, rectTool };
}

export function createToolOptions() {
  return createDiv("", "vertical", [
    createSlider("opacity", "", 1, 0, 1, event => {}),
    createSlider("width", "", 1, 0, 50, event => {}),
    createDiv("", "horizontal", [
      createColor("stroke", "", "#000000", event => {}),
      createColor("fill", "", "#FFFFFF", event => {})
    ])
  ]);
}
