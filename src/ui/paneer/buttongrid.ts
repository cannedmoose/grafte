import { PaneerDOM } from "./paneerdom";
import { div, button, img } from "../utils/dom";

interface Options {
  aspectRatio: number;
  width: string;
}

export interface ButtonOptions {
  alt: string;
  icon: string;

  onClick: () => void
}

// TODO need to figure out selection...
class Button extends PaneerDOM {
  constructor(b: ButtonOptions) {
    const i = img({ src: b.icon });
    i.style.width = "100%";
    i.style.height = "100%";
    const el = button({ alt: b.alt }, [i], { click: b.onClick });
    el.style.padding = "0px";
    el.style.borderRadius = "5px";
    super(el);
  }
}

export class ButtonGrid extends PaneerDOM implements Options {
  // 
  // height = width / aspect
  // 
  aspectRatio: number;
  width: string;

  constructor(options: Options) {
    super();

    // TODO getter/setter
    this.aspectRatio = options.aspectRatio;
    this.width = options.width;

    this.resize();
  }

  resize() {
    // Redo based on column/row sizing
    this.element.style.display = "grid";

    // TODO figure out if we want other width/height
    //this.element.style.width = "100%";
    //this.element.style.height = "100%";

    this.element.style.gridTemplateColumns = `repeat(auto-fill, ${this.width})`;
    this.element.style.gridTemplateRows =
      `repeat(auto-fill, calc(${this.width} / ${this.aspectRatio}))`;

    // TODO should resize be called chained (EG always make sure we resize child before parent.)
    super.resize();
  }

  add(options: ButtonOptions) {
    this.append(new Button(options));
  }
}