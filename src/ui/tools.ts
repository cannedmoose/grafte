import * as paper from "paper";
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
import { Slider } from "./components/slider";
import { ColorPicker } from "./components/colorpicker";

export class ToolBelt extends PaneerDOM {
  label = "Tools";
  grid: ButtonGrid;
  constructor(history: GrafteHistory, keyboard: Keyboard) {
    super();
    this.grid = new ButtonGrid({ aspectRatio: 1, width: "5vmin" });
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

    this.style.margin = "0em .5em";

    this.append(new Slider({
      label: "Stroke Width",
      min: 0,
      max: 50,
      value: 1,
      step: .01,
      onChange: (value) => {
        paper.project.currentStyle.strokeWidth = value;
        paper.project.selectedItems.forEach(child => {
          child.strokeWidth = paper.project.currentStyle.strokeWidth;
        });
        paper.project.view.requestUpdate();
      }
    }));
    this.append(new ColorPicker({
      value: paper.project.currentStyle.strokeColor || undefined,
      label: "Stroke",
      onChange: (val: paper.Color) => {
        //console.log(val.toCSS(true));
        paper.project.currentStyle.strokeColor = val;
        paper.project.selectedItems.forEach(child => {
          child.strokeColor = paper.project.currentStyle.strokeColor;
        });
        paper.project.view.requestUpdate();
      },
    }));

    this.append(new ColorPicker({
      value: paper.project.currentStyle.strokeColor || undefined,
      label: "Fill",
      onChange: (val: paper.Color) => {
        paper.project.currentStyle.fillColor = val;
        paper.project.selectedItems.forEach(child => {
          child.fillColor = paper.project.currentStyle.fillColor;
        });
        paper.project.view.requestUpdate();
      },
    }));
  }
}
