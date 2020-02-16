import { div, slider, color } from "./utils";

export function createToolOptions(canvas: paper.Project) {
  return div({ class: "vertical" }, [
    slider(
      { value: "1", min: "0", max: "50", step: ".01" },
      {
        input: event => {
          canvas.currentStyle.strokeWidth = event.target.value;
          canvas.selectedItems.forEach(child => {
            child.style = canvas.currentStyle;
          });
          canvas.view.requestUpdate();
        }
      }
    ),
    div({ class: "horizontal" }, [
      color(
        { value: "#000000" },
        {
          input: event => {
            canvas.currentStyle.strokeColor = event.target.value;
            canvas.selectedItems.forEach(child => {
              child.style = canvas.currentStyle;
            });
            canvas.view.requestUpdate();
          }
        }
      ),
      color(
        { value: "#FFFFFF" },
        {
          input: event => {
            canvas.currentStyle.fillColor = event.target.value;
            canvas.selectedItems.forEach(child => {
              child.style = canvas.currentStyle;
            });
            canvas.view.requestUpdate();
          }
        }
      )
    ])
  ]);
}
