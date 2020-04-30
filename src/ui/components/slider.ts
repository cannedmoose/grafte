import { PaneerAppend, AttachedPaneer, Paneer } from "../paneer/newPaneer";

export interface SliderOptions {
  min?: number;
  max?: number;

  value?: number;
  step?: number;
  onChange(value: number): void;

  label?: string;
}

// TODO(P3) add number input when wide enough...
// HANDLE NO VALUE
// HANDLE MULTIPLE VALUE

export class Slider extends AttachedPaneer {
  min: number;
  max: number;
  step: number;

  slider: HTMLInputElement;
  number: HTMLInputElement;

  constructor(options: SliderOptions) {
    super(Paneer/*html*/`<div></div>`);

    this.style = {
      display: "flex",
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: ".5em"
    };

    this.min = options.min === undefined ? 0 : options.min;
    this.max = options.max === undefined ? this.min + 1 : options.max;
    this.step = options.step === undefined ? (this.max - this.min) / 100 : options.step;

    PaneerAppend(this.element)/*html*/`
    <div>
      ${options.label || ""}
    </div>
    <div ${{ flexGrow: "100" }}></div>
    <div ${{display : "flex", flexDirection: "row"}}>
      <input
        type="range"
        min="${this.min}"
        max="${this.max}"
        step="${this.step}"
        ${{ width: "6em", minWidth: "4em" }}
        ${el => {
          this.slider = el as HTMLInputElement;
        }}/>
      <input
        type="number"
        min="${this.min}"
        max="${this.max}"
        step="${this.step}"
        ${{
          width: "4.5em",
          border: "none",
          borderRadius: ".3em",
          backgroundColor: "#AAAAAA",
          paddingLeft: ".5em",
          marginLeft: ".5em"
        }}
        ${el => {
          this.number = el as HTMLInputElement;
        }}/>
    </div>
    `

    this.slider.addEventListener("input", e => {
      this.number.value = this.slider.value;
      options.onChange(this.value);
    });

    this.number.addEventListener("input", () => {
      this.slider.value = this.number.value;
      options.onChange(this.value);
    });

    this.value = options.value === undefined ? (this.min + this.max) / 2 : options.value;
  }

  get value(): number {
    return Number(this.slider.value);
  }

  set value(newValue: number) {
    if (this.slider)
      this.slider.value = String(newValue);
    if (this.number)
      this.number.value = String(newValue);
  }


}