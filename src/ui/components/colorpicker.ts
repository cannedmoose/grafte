import * as paper from "paper";
import { PaneerDOM } from "../paneer/paneerdom";
import { PaneerAppend } from "../paneer/newPaneer";

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
  picker: HTMLInputElement;
  textual: HTMLInputElement;
  onChange: (value: paper.Color) => void;

  _value: paper.Color;

  constructor(options: ColorPickerOptions) {
    super();

    this._value = options.value === undefined ? paper.Color.random() : options.value.clone();
    this.onChange = options.onChange;

    this.style = {
      display: "flex",
      flexDirection: "row",
      flexWrap: "wrap",
      alignContent: "center",
      width: "100%",
      height: "100%",
      marginBottom: ".5em"
    };

    // TODO figure out formatting
    PaneerAppend(this.element)/*html*/`
    <div ${{ height: "min-conent" }}>
      ${options.label || ""}
    </div>
    <div ${{ flexGrow: "100" }}>
    </div>
    <div ${{ display: "flex", flexDirection: "row" }}>
      <input
        type="color"
        ${{
        padding: "0px",
        width: "2em",
        minWidth: "2em",
        height: "2em",
        minHeight: "2em", margin: ".1em"
      }}
        ${el => {
        this.picker = el as HTMLInputElement;
        el.addEventListener("input", () => {
          this._value.set(this.picker.value);
          this.textual.value = this.picker.value;
          this.onChange(this.value);
        })
      }} />
      <input
        type="text"value="${this.value.toCSS(true)}"
        ${{
        width: "6em",
        minWidth: "6em",
        border: "none",
        borderRadius: ".3em",
        backgroundColor: "#AAAAAA",
        paddingLeft: ".5em",
        marginLeft: ".5em"
      }}
      ${el => {
        this.textual = el as HTMLInputElement;
        el.addEventListener("input", () => {
          this._value.set(this.textual.value);
          this.picker.value = this.textual.value;
          this.onChange(this.value);
        })
      }}/>

    </div>
    `
  }

  get value(): paper.Color {
    return this._value.clone();
  }

  set value(newValue: paper.Color) {
    this._value = newValue;
    this.picker.value = newValue.toCSS(true);
    this.textual.value = newValue.toCSS(true);
    this.onChange(this.value);
  }
}