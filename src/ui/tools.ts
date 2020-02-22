import * as paper from "paper";
import { div, slider, color, button, text, queryOrThrow } from "./utils";

export function createToolMenu() {
  // TODO we should be listening to on activate/deactivate and bolding/unbolding buttons based on that.
  const createToolButtons = () => paper.tools.map(tool =>
    button({style: paper.tool == tool ? "font-weight:bold" : "" }, [text(tool.name)], {
      click: () => {
        tool.activate();
        var menu_el = queryOrThrow("#tool-menu");
        while (menu_el.firstChild) menu_el.removeChild(menu_el.firstChild);
        createToolButtons().forEach(child => menu_el.appendChild(child));
      }
    })
  );
  return div(
    { class: "vertical", id: "tool-menu"}, createToolButtons()
  )
}

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
