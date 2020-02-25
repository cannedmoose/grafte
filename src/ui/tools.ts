import * as paper from "paper";
import { div, slider, color, button, text, queryOrThrow } from "./utils";
import { GrafteHistory } from "../tools/history";
import { selectTool } from "../tools/select";
import { pointTool } from "../tools/points";
import { penTool } from "../tools/pen";
import { pencilTool } from "../tools/pencil";
import { elipseTool } from "../tools/elipse";
import { rectangleTool } from "../tools/rectangle";
import { KeyboardHandler } from "./keyboard";

export class ToolBelt {
  tools: {[key: string] : paper.Tool};
  el: HTMLElement;

  constructor(history: GrafteHistory, keyboard: KeyboardHandler) {
    //this.createButton = this.createButton.bind(this);
    const tools = this.createTools(history);
    this.tools = {};
    this.el = div(
      { class: "vertical", id: "tool-menu"}, tools.map(this.createButton)
    )
    tools.forEach(tool => {
      // Store in name map and add activate/deactivate handlers
      this.tools[tool.name] = tool;
      tool.on("activate", () => {
        queryOrThrow(`#tool-${tool.name}`, this.el).setAttribute("style", "font-weight:bold");
      });
      tool.on("deactivate", () => {
        queryOrThrow(`#tool-${tool.name}`, this.el).setAttribute("style", "");
      });
    });

    this.tools["select"].activate();

    keyboard.addShortcut("s", (e) => this.tools["select"].activate());
    keyboard.addShortcut("p", (e) => this.tools["pen"].activate());
    keyboard.addShortcut("r", (e) => this.tools["rectangle"].activate());
    keyboard.addShortcut("e", (e) => this.tools["elipse"].activate());
  }

  createButton(tool: paper.Tool) {
    return button(
      { id: `tool-${tool.name}`, style: paper.tool == tool ? "font-weight:bold" : "" },
      [text(tool.name)],
      {
        click: () => {
          tool.activate();
        }
      }
    );
  }

  createTools(history) {
    return [
      selectTool(history),
      pointTool(history),
      penTool(history),
      pencilTool(history),
      elipseTool(history),
      rectangleTool(history)
    ]
  }

}

export function createToolOptions(history: GrafteHistory) {
  return div({ class: "vertical" }, [
    slider(
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
    div({ class: "horizontal" }, [
      color(
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
      ),
      color(
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
    ])
  ]);
}
