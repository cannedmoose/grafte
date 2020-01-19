import * as paper from "paper";
import * as select from "./select";
import {
  querySelectorOrThrow,
  createSlider,
  createDiv,
  createColor
} from "../utils";
import { gridSnap, sineySnap, snapMap } from "../snaps/snaps";

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

export function createTools(
  projects: {
    ui: paper.Project;
    canvas: paper.Project;
  },
  updateFn: () => void
) {
  const { ui, canvas } = { ...projects };

  ui.activate();
  let toolPath: paper.Path = new paper.Path();

  // Circle
  let circleTool = new paper.Tool();

  circleTool.onMouseDown = function(event) {
    ui.activate();
    toolPath.selected = true;
  };

  circleTool.onMouseDrag = function(event) {
    ui.activate();
    toolPath.remove();
    toolPath = new paper.Path.Circle({
      center: event.downPoint,
      radius: event.downPoint.getDistance(event.point)
    });
    toolPath.selected = true;
  };

  circleTool.onMouseUp = function(event) {
    canvas.activate();
    let p = new paper.Path();
    p.copyContent(toolPath);
    ui.activate();
    toolPath.remove();

    p.strokeColor = getStroke();
    p.fillColor = getFill();
    p.strokeWidth = getWidth();
    p.opacity = getOpacity();
    p.selected = false;
    updateFn();
  };

  // Rect
  let rectTool = new paper.Tool();

  rectTool.onMouseDown = function(event) {
    ui.activate();
    toolPath.selected = true;
  };

  rectTool.onMouseDrag = function(event) {
    ui.activate();
    toolPath.remove();
    toolPath = new paper.Path.Rectangle({
      point: event.downPoint,
      size: event.point.subtract(event.downPoint)
    });
    toolPath.selected = true;
  };

  rectTool.onMouseUp = function(event) {
    canvas.activate();
    let rectPath = new paper.Path();
    rectPath.copyContent(toolPath);
    ui.activate();
    toolPath.remove();
    rectPath.strokeColor = getStroke();
    rectPath.fillColor = getFill();
    rectPath.strokeWidth = getWidth();
    rectPath.opacity = getOpacity();
    updateFn();
  };

  // Pen
  let penTool = new paper.Tool();

  penTool.minDistance = 5;

  penTool.onMouseDown = function(event) {
    ui.activate();
    toolPath = new paper.Path();
  };

  penTool.onMouseDrag = function(event) {
    ui.activate();
    toolPath.add(event.point);
    toolPath.closed = false;
    toolPath.selected = true;
  };

  penTool.onMouseUp = function(event) {
    canvas.activate();
    let penPath = new paper.Path();
    penPath.copyContent(toolPath);
    ui.activate();
    toolPath.remove();
    penPath.strokeColor = getStroke();
    penPath.strokeWidth = getWidth();
    penPath.opacity = getOpacity();
    penPath.strokeCap = "round";
    penPath.simplify();
    updateFn();
  };

  let selectTool = new paper.Tool();
  let selectState: select.SelectState = { type: "noselection" };
  let snap = gridSnap(new paper.Point(10, 10), new paper.Point(0, 0));
  selectTool.onMouseDown = function(event) {
    canvas.activate();
    //event.point = snap.fn(event.point);
    selectState = select.selectionToolUpdate(selectState, {
      event,
      type: "mousedown"
    });

    ui.activate();
    ui.clear();
    ui.currentStyle.strokeColor = new paper.Color("black");
    ui.currentStyle.strokeWidth = 1;
    snap.view(event.point);
  };

  selectTool.onMouseMove = function(event) {
    canvas.activate();
    event.point = snap.fn(event.point);
    selectState = select.selectionToolUpdate(selectState, {
      event,
      type: "mousemove"
    });

    ui.activate();
    ui.clear();
    ui.currentStyle.strokeColor = new paper.Color("black");
    ui.currentStyle.strokeWidth = 1;
    snap.view(event.point);
  };

  selectTool.onMouseUp = function(event) {
    canvas.activate();
    event.point = snap.fn(event.point);
    selectState = select.selectionToolUpdate(selectState, {
      event,
      type: "mouseup"
    });

    ui.activate();
    ui.clear();
    ui.currentStyle.strokeColor = new paper.Color("black");
    ui.currentStyle.strokeWidth = 1;
    snap.view(event.point);
  };

  selectTool.onKeyDown = function(event) {
    canvas.activate();
    selectState = select.selectionToolUpdate(selectState, {
      event,
      type: "keydown"
    });
  };

  return { circleTool, penTool, rectTool, selectTool };
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
