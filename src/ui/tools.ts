import * as paper from "paper";
import { GrafteHistory } from "../tools/history";
import { selectTool } from "../tools/select";
import { pointTool } from "../tools/points";
import { penTool } from "../tools/pen";
import { pencilTool } from "../tools/pencil";
import { elipseTool } from "../tools/elipse";
import { rectangleTool } from "../tools/rectangle";
import { Keyboard } from "./keyboard";
import { Slider } from "./components/slider";
import { ColorPicker } from "./components/colorpicker";
import { ChangeFlag } from "../changeflags";
import { AttachedPaneer, isPaneer } from "./paneer/paneer";
import { Tab } from "./components/panes/pane";
import { Pan } from "./paneer/template";
import { ToolTip } from "./components/tooltip";
import { Serializer } from "./utils/deserializer";

export class ToolBelt extends AttachedPaneer implements Tab {
  tab: true = true;
  label = "Tools";
  grid: AttachedPaneer;

  // TODO(P1) should a project be passed or are we happy using the active one?
  // PRETTY HAPPY TO USE THE ACTIVE ONE
  // need some indication of which project is active though

  constructor(history: GrafteHistory, keyboard: Keyboard) {
    super(Pan/*html*/`<div></div>`);
    this.grid = new AttachedPaneer(Pan/*html*/`<div></div>`);
    this.grid.style = {display: "flex", flexDirection: "row", flexWrap: "wrap"};
    this.append(this.grid);

    // TODO(P3) work out how to center grid in available space.
    // consider this during grid resize
    this.grid.append(this.toolOptions(selectTool(history, keyboard), "Select", "icons/select.png"));
    this.grid.append(this.toolOptions(pointTool(history, keyboard), "Point", "icons/point.png"));
    this.grid.append(this.toolOptions(penTool(history, keyboard), "Pen", "icons/pen.png"));
    this.grid.append(this.toolOptions(pencilTool(history, keyboard), "Pencil", "icons/pencil.png"));
    this.grid.append(this.toolOptions(elipseTool(history, keyboard), "Elipse", "icons/elipse.png"));
    this.grid.append(this.toolOptions(rectangleTool(history, keyboard), "Rectangle", "icons/rectangle.png"));

    this.append(new ToolOptions(history));
    this.append(new SelectionOptions(history, paper.project));

    // TODO(P2) figure out what we want to do with keyboard shortcuts...
    // I think we can let the tools refister them.

  }

  toolOptions(tool: paper.Tool, alt: string, icon: string): ToolTip {
    return new ToolTip({
      size: "3em", icon, alt, onClick: () => {
        tool.activate();
        this.grid.children(isPaneer).forEach(pan => {
          //TODO(P3) do an actual check for tooltip children
          // maybe do a toolgroup which acts similar to the previous buttongrid.
          (pan as ToolTip).refresh();
        })
      }, isSelected: () => tool === paper.tool
    });
  }
}


Serializer.register(
  ToolBelt,
  (raw: any) => {
    //@ts-ignore
    const ctx: any = window.ctx;
    return new ToolBelt(ctx.history, ctx.keyboard);
  },
  (raw: ToolBelt) => {
    return {};
  }
);

export class ToolOptions extends AttachedPaneer {
  constructor(history: GrafteHistory) {
    super(Pan/*html*/`<div></div>`);

    this.style.margin = "0em .5em";

    this.append(new Slider({
      label: "Stroke Width",
      min: 0,
      max: 50,
      value: paper.project.currentStyle.strokeWidth,
      step: .01,
      onChange: (value) => {
        paper.project.currentStyle.strokeWidth = value;
      }
    }));
    this.append(new ColorPicker({
      value: paper.project.currentStyle.strokeColor || new paper.Color("black"),
      label: "Stroke",
      onChange: (val: paper.Color) => {
        paper.project.currentStyle.strokeColor = val;
      },
    }));

    this.append(new ColorPicker({
      value: paper.project.currentStyle.strokeColor || new paper.Color("black"),
      label: "Fill",
      onChange: (val: paper.Color) => {
        paper.project.currentStyle.fillColor = val;
      },
    }));
  }
}


export class SelectionOptions extends AttachedPaneer {
  strokeWidth: Slider;
  strokeColor: ColorPicker;
  fillColor: ColorPicker;

  constructor(history: GrafteHistory, project: paper.Project) {
    super(Pan/*html*/`<div></div>`);

    this.style.margin = "0em .5em";
    this.strokeWidth = new Slider({
      label: "Stroke Width",
      min: 0,
      max: 50,
      value: 1,
      step: .01,
      onChange: (val) => {
        paper.project.selectedItems.forEach(child => {
          child.strokeWidth = val;
        });
      }
    });

    this.strokeColor = new ColorPicker({
      value: paper.project.currentStyle.strokeColor || undefined,
      label: "Stroke",
      onChange: (val: paper.Color) => {
        paper.project.selectedItems.forEach(child => {
          child.strokeColor = val;
        });
        paper.project.view.requestUpdate();
      },
    });

    this.fillColor = new ColorPicker({
      value: paper.project.currentStyle.strokeColor || undefined,
      label: "Fill",
      onChange: (val: paper.Color) => {
        paper.project.selectedItems.forEach(child => {
          child.fillColor = val;
        });
      },
    });

    this.append(this.strokeWidth);
    this.append(this.strokeColor);
    this.append(this.fillColor);

    // TODO(P3) handle this more elegantly
    // we should only do this once a frame max...
    project.on("changed", (e: any) => {
      if (e.flags && e.flags & (ChangeFlag.SELECTION)) {
        let strokeWidth: number | "CONFLICT" | undefined= undefined;
        let strokeColor: paper.Color | "CONFLICT" | undefined = undefined;
        let fillColor: paper.Color | "CONFLICT" | undefined= undefined;

        project.selectedItems.forEach((i:paper.Item) => {
          if(!strokeWidth && i.strokeWidth) {
            strokeWidth = i.strokeWidth;
          } else if (strokeWidth && strokeWidth != i.strokeWidth) {
            strokeWidth = "CONFLICT";
          }

          if(!strokeColor && i.strokeColor) {
            strokeColor = i.strokeColor;
          } else if (strokeColor && strokeColor != i.strokeColor) {
            strokeColor = "CONFLICT";
          }

          if(!fillColor && i.fillColor) {
            fillColor = i.fillColor;
          } else if (fillColor && fillColor != i.fillColor) {
            fillColor = "CONFLICT";
          }
        });

        if(strokeWidth && strokeWidth !== "CONFLICT") {
          this.strokeWidth.value = strokeWidth;
        }

        if(strokeColor && strokeColor !== "CONFLICT") {
          this.strokeColor.value = new paper.Color(strokeColor);
        }

        if(fillColor && fillColor !== "CONFLICT") {
          this.fillColor.value = new paper.Color(fillColor);
        }
      }
    });
  }
}