import * as paper from "paper";
import { div, slider, color, button, text, queryOrThrow, img } from "./utils/dom";
import { GrafteHistory } from "../tools/history";
import { selectTool } from "../tools/select";
import { pointTool } from "../tools/points";
import { penTool } from "../tools/pen";
import { pencilTool } from "../tools/pencil";
import { elipseTool } from "../tools/elipse";
import { rectangleTool } from "../tools/rectangle";
import { Keyboard } from "./keyboard";
import { ButtonGrid } from "./paneer/buttongrid";
import { PaneerDOM } from "./paneer/paneerdom";

export class ToolBelt extends PaneerDOM {
  label = "Tools";
  grid: ButtonGrid;
  constructor(history: GrafteHistory, keyboard: Keyboard) {
    super();
    this.grid = new ButtonGrid({ aspectRatio: 1, width: "7vmin" });
    this.append(this.grid);

    // TODO work out how to center grid in available space.
    this.grid.add(this.toolOptions(selectTool(history, keyboard), "Select", "icons/select.png"));
    this.grid.add(this.toolOptions(pointTool(history, keyboard), "Point", "icons/point.png"));
    this.grid.add(this.toolOptions(penTool(history, keyboard), "Pen", "icons/pen.png"));
    this.grid.add(this.toolOptions(pencilTool(history, keyboard), "Pencil", "icons/pencil.png"));
    this.grid.add(this.toolOptions(elipseTool(history, keyboard), "Elipse", "icons/elipse.png"));
    this.grid.add(this.toolOptions(rectangleTool(history, keyboard), "Rectangle", "icons/rectangle.png"));

    this.append(new ToolOptions(history));

    // TODO(P1) figure out what we want to do with keyboard shortcuts...
    // Maybe define in tool?
  }

  toolOptions(tool: paper.Tool, alt: string, icon: string) {
    return {
      icon, alt, onClick: () => tool.activate()
    };
  }

  refresh() {
    //this.tools.forEach(tool => tool.refresh());
  }

  serialize() {
    return {
      type: "toolbelt"
    };
  }

  static deserialize(raw: any, deserializer: (raw: { type: string }) => any): ToolBelt {
    // TODO fix this
    // @ts-ignore
    const ctx: any = window.ctx;
    return new ToolBelt(ctx.history, ctx.keyboard);
  }
}

export class ToolOptions extends PaneerDOM {
  constructor(history: GrafteHistory) {
    super();
    this.element.append(slider(
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
    ));
    this.element.append(color(
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
    ));

    this.element.append(
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
      ));
  }
}
