import * as paper from "paper";
import * as select from "./select";
import {
  querySelectorOrThrow,
  createSlider,
  createDiv,
  createColor
} from "../utils";
import { gridSnap, sineySnap, snapMap, identity } from "../snaps/snaps";
import { GrafeScope } from "../grafe";
import { elipseTool } from "./elipse";
import { rectangleTool } from "./rectangle";
import { ToolContext } from "./tool";
import { selectTool } from "./select";

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

export function createTools(ctx: ToolContext) {
  let penTool = new paper.Tool();
  let circleTool = elipseTool(ctx);
  let rectTool = rectangleTool(ctx);
  let s = selectTool(ctx);

  return { circleTool, penTool, rectTool, selectTool: s };
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
