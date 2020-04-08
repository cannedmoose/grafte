import * as paper from "paper";
import { div, slider, color, button, text, queryOrThrow, img } from "./utils/dom";
import { GrafteHistory } from "../tools/history";
import { selectTool } from "../tools/select";
import { pointTool } from "../tools/points";
import { penTool } from "../tools/pen";
import { pencilTool } from "../tools/pencil";
import { elipseTool } from "../tools/elipse";
import { rectangleTool } from "../tools/rectangle";
import { PaneerNode, PaneerLeaf } from "./paneer/paneer";
import { Keyboard } from "./keyboard";

class Tool {
  element: HTMLElement;
  tool: paper.Tool;

  constructor(toolbelt: ToolBelt, tool: paper.Tool, icon: string) {
    const image = img({src:icon});
    image.style.maxWidth = "100%";
    image.style.maxHeight = "100%";
    this.element = button(
      {},
      [image],
      {
        click: () => {
          tool.activate();
          toolbelt.refresh();
        }
      }
    );

    this.tool = tool;
  }

  refresh() {
    if (paper.tool == this.tool) {
      this.element.style.fontWeight = "bold";
      this.element.style.backgroundColor = "#AAAAAA";
    } else {
      this.element.style.fontWeight = "";
      this.element.style.backgroundColor = "";
    }
  }
}

export class ToolBelt extends PaneerNode {
  tools: Tool[];

  constructor(history: GrafteHistory, keyboard: Keyboard) {
    super("Vertical", "1fr", false);
    this.tools = [
      new Tool(this, selectTool(history, keyboard), "icons/select.png"),
      new Tool(this, pointTool(history, keyboard), "icons/point.png"),
      new Tool(this, penTool(history, keyboard), "icons/pen.png"),
      new Tool(this, pencilTool(history, keyboard), "icons/pencil.png"),
      new Tool(this, elipseTool(history, keyboard), "icons/elipse.png"),
      new Tool(this, rectangleTool(history, keyboard), "icons/rectangle.png")
    ];

    this.tools.forEach(tool => {
      this.append(new PaneerLeaf(tool, "1fr"));
      tool.tool.on("activate", () => this.refresh());
    });
    this.tools[0].tool.activate();
    this.refresh();

    // TODO(P1) figure out what we want to do with keyboard shortcuts...
    // Maybe define in tool?
  }

  refresh() {
    this.tools.forEach(tool => tool.refresh());
  }
}

export class ToolOptions extends PaneerNode {
  constructor(history: GrafteHistory) {
    super("Vertical", "1fr", false);
    this.appendAll([
      new PaneerLeaf({
        element: slider(
          { value: "1", min: "0", max: "50", step: ".01" },
          {
            input: event => {
              paper.project.currentStyle.strokeWidth = event.target.value;
              paper.project.selectedItems.forEach(child => {
                child.strokeWidth = paper.project.currentStyle.strokeWidth;
              });
              paper.project.view.requestUpdate();
            },
            change: event => history.commit()
          }
        ),
        resize: leaf => {
          leaf.pane.element.style.width = "100%";
          leaf.pane.element.style.height = "100%";
          leaf.pane.element.style.margin = "0px";
          leaf.pane.element.style.padding = "0px";
        }
      }, "1fr"),
      new PaneerNode("Horizontal", "1fr", false, [
        new PaneerLeaf({
          element: color(
            { value: "#000000" },
            {
              input: event => {
                paper.project.currentStyle.strokeColor = event.target.value;
                paper.project.selectedItems.forEach(child => {
                  child.strokeColor = paper.project.currentStyle.strokeColor;
                });
                paper.project.view.requestUpdate();
              },
              change: event => history.commit()
            }
          )
        }),
        new PaneerLeaf({
          element: color(
            { value: "#FFFFFF" },
            {
              input: event => {
                paper.project.currentStyle.fillColor = event.target.value;
                paper.project.selectedItems.forEach(child => {
                  child.fillColor = paper.project.currentStyle.fillColor;
                });
                paper.project.view.requestUpdate();
              },
              change: event => history.commit()
            }
          )
        })
      ]),
      new PaneerLeaf({ element: div({}, []) }, "3fr")]
    );
  }
}
