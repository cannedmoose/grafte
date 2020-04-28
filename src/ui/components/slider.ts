import { PaneerDOM } from "../paneer/paneerdom";
import { slider, text, div, number } from "../utils/dom";

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
  number: HTMLInputElement;

  lab: HTMLDivElement;

  constructor(options: SliderOptions) {
    super();

    this.style = {
      display: "flex",
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: ".5em"
    };

    this.min = options.min === undefined ? 0 : options.min;
    this.max = options.max === undefined ? this.min + 1 : options.max;
    this.step = options.step === undefined ? (this.max - this.min) / 100: options.step;

    this.slider = slider({ min: this.min, max: this.max, step: this.step }, {
      input: () => {
        this.number.value = this.slider.value;
        options.onChange(this.value)
      }
    });

    this.number = number(
      {step: this.step },
      {
        input: () => {
          this.slider.value = this.number.value;
          options.onChange(this.value);
        }
      })

    this.value = options.value === undefined ? (this.min + this.max) / 2 : options.value;
    this.lab = div({}, [text(options.label || "")]);

    this.element.append(this.lab);

    const container = div({}, [this.slider, this.number]);
    container.style.display = "flex";
    container.style.flexDirection = "row";

    this.element.append(container);


    this.slider.style.width = "100%";
    this.slider.style.minWidth = "4em";
    this.number.style.width = "5em";
    this.number.style.border = "none";
    this.number.style.borderRadius = ".3em";
    this.number.style.backgroundColor = "#AAAAAA";
    this.number.style.paddingLeft = ".5em";
    this.number.style.marginLeft = ".5em";


  }

  get value(): number {
    return Number(this.slider.value);
  }

  set value(newValue: number) {
    this.slider.value = String(newValue);
    this.number.value = String(newValue);
  }


}