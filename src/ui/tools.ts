import * as paper from "paper";
import { div, slider, color, button, text, queryOrThrow } from "./utils/dom";
import { GrafteHistory } from "../tools/history";
import { selectTool } from "../tools/select";
import { pointTool } from "../tools/points";
import { penTool } from "../tools/pen";
import { pencilTool } from "../tools/pencil";
import { elipseTool } from "../tools/elipse";
import { rectangleTool } from "../tools/rectangle";
import { KeyboardHandler } from "./keyboard";

class Tool {
  element: HTMLElement;
  tool: paper.Tool;

  constructor(toolbelt: ToolBelt, tool: paper.Tool) {
    this.element = button(
      {},
      [text(tool.name)],
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
    } else {
      this.element.style.fontWeight = "";
    }
  }
}

export class ToolBelt {
  tools: Tool[];
  element: HTMLElement;

  constructor(history: GrafteHistory, keyboard: KeyboardHandler) {
    this.tools = [
      new Tool(this, selectTool(history)),
      new Tool(this, pointTool(history)),
      new Tool(this, penTool(history)),
      new Tool(this, pencilTool(history)),
      new Tool(this, elipseTool(history)),
      new Tool(this, rectangleTool(history))
    ];
    this.element = div({}, this.tools.map(tool => tool.element));
    this.tools[0].tool.activate();
    this.refresh();

    // TODO figure out what we want to do with keyboard shortcuts...
    // Maybe define in tool?
  }

  refresh() {
    this.tools.forEach(tool => tool.refresh());
  }
}

export class ToolOptions {
  element: HTMLElement;

  constructor (history: GrafteHistory) {
    this.element = div({}, [
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
}
