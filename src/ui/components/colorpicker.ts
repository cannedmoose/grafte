import * as paper from "paper";
import { PaneerDOM, isAny } from "../paneer/paneerdom";
import { slider, text, div, textInput } from "../utils/dom";
import { ToolOptions } from "../tools";

export interface Palete {
  colors: paper.Color[];
}

export interface ColorPickerOptions {
  value?: paper.Color;
  onChange(value: paper.Color): void;

  label?: string;
}

// TODO add number input when wide enough...

export class ColorPicker extends PaneerDOM {
  lab: HTMLDivElement;
  picker: HTMLDivElement;
  textual: HTMLInputElement;

  value: paper.Color;

  constructor(options: ColorPickerOptions) {
    super();

    this.value = options.value === undefined ? paper.Color.random() : options.value;

    this.style = {
      display: "flex",
      flexDirection: "row",
      flexWrap: "wrap",
      alignContent: "center",
      width: "100%",
      height: "100%",
      marginBottom: ".5em"
    };

    this.lab = div({}, [text(options.label || "")]);
    this.lab.style.height = "min-content";

    this.textual = textInput({}, {
      input: () => {
        const c = new paper.Color(this.textual.value);
        if (c) {
          this.value = c;
          this.picker.Descendent(isAny).style.backgroundColor= this.value.toCSS(true);
        }
      }
    });
    this.textual.style.width="6em";
    this.textual.style.minWidth="6em";
    this.textual.style.border = "none";
    this.textual.style.borderRadius = ".3em";
    this.textual.style.backgroundColor = "#AAAAAA";
    this.textual.style.paddingLeft = ".5em";
    this.textual.style.marginLeft = ".5em";
    this.textual.value = this.value.toCSS(true);

    this.picker = new PaneerDOM();
    this.picker.style = {
      width: "2em",
      minWidth: "2em",
      height: "2em",
      minHeight: "2em",
      border: "1px solid black",
      borderRadius: ".2em",
      padding: ".1em",
      margin: ".1em"
    }
    this.picker.element.addEventListener("click", () => alert("PICK"));

    this.picker.append(new PaneerDOM());
    this.picker.Descendent(isAny).style = {
      backgroundColor: this.value.toCSS(true),
      width: "100%",
      height: "100%"
    };

    const spacer = div({}, [])
    spacer.style.flexGrow = "100";

    const container = div({}, [this.picker.element, this.textual]);
    container.style.display = "flex";
    container.style.flexDirection = "row";

    this.element.append(this.lab);
    this.element.append(spacer);
    this.element.append(container);
  }
}