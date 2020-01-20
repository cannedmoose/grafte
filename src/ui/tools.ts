import { createDiv, createSlider, createColor } from "./utils";
import { ToolContext } from "../tools/tool";

export function createToolOptions(ctx: ToolContext) {
  return createDiv("", "vertical", [
    createSlider("width", "", 1, 0, 50, event => {
      ctx.style.style.strokeWidth = event.target.value;
    }),
    createDiv("", "horizontal", [
      createColor("stroke", "", "#000000", event => {
        ctx.style.style.strokeColor = event.target.value;
      }),
      createColor("fill", "", "#FFFFFF", event => {
        ctx.style.style.fillColor = event.target.value;
      })
    ])
  ]);
}
