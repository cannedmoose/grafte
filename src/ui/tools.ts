import { div, slider, color } from "./utils";
import { ToolContext } from "../tools/tool";

export function createToolOptions(ctx: ToolContext) {
  return div({ class: "vertical" }, [
    slider(
      { value: "1", min: "0", max: "50", step: ".01" },
      {
        input: event => {
          ctx.style.style.strokeWidth = event.target.value;
          ctx.select.children.forEach(child => {
            let original = child.data.original as paper.Item;
            original.strokeWidth = event.target.value;
          });
          ctx.canvas.view.requestUpdate();
        }
      }
    ),
    div({ class: "horizontal" }, [
      color(
        { value: "#000000" },
        {
          input: event => {
            ctx.style.style.strokeColor = event.target.value;
            ctx.select.children.forEach(child => {
              let original = child.data.original as paper.Item;
              original.strokeColor = event.target.value;
            });
            ctx.canvas.view.requestUpdate();
          }
        }
      ),
      color(
        { value: "#FFFFFF" },
        {
          input: event => {
            ctx.style.style.fillColor = event.target.value;
            ctx.select.children.forEach(child => {
              let original = child.data.original as paper.Item;
              original.fillColor = event.target.value;
            });
            ctx.canvas.view.requestUpdate();
          }
        }
      )
    ])
  ]);
}
