import { PaneerDOM } from "../paneer/paneerdom";
import { slider, text, div } from "../utils/dom";

export interface SliderOptions {
  min?: number;
  max?: number;

  value?: number;
  step?: number;
  onChange(value: number): void;

  label?: string;
}

// TODO add number input when wide enough...

export class Slider extends PaneerDOM {
  min: number;
  max: number;
  step: number;

  slider: HTMLInputElement;
  lab: HTMLDivElement;

  constructor(options: SliderOptions) {
    super();

    this.min = options.min === undefined ? 0 : options.min;
    this.max = options.max === undefined ? this.min + 1 : options.max;
    this.step = (this.max - this.min) / 100;

    this.slider = slider({ min: this.min, max: this.max, step: this.step }, {
      input: () => options.onChange(this.value)
    });

    this.value = options.value === undefined ? (this.min + this.max) / 2 : options.value;
    this.lab = div({}, [text(options.label || "")]);

    this.element.append(this.lab);
    this.element.append(this.slider);

    this.slider.style.width = "100%";

    this.style = {
      display: "flex",
      flexDirection: "row"
    };

  }

  get value(): number {
    return Number(this.slider.value);
  }

  set value(newValue: number) {
    this.slider.value = String(newValue);
  }


}