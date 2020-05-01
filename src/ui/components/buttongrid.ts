import { PaneerAppend, AttachedPaneer, Paneer } from "../paneer/newPaneer";

interface Options {
  aspectRatio: number;
  width: string;
}

export interface ButtonOptions {
  alt: string;
  icon: string;

  onClick: () => void
}

// TODO(P1) Total rewrite
// this is for tools and redo leaf buttons (split/close/new tab, new tab should be a modaly thing)
class Button extends AttachedPaneer {
  button: HTMLElement;
  constructor(b: ButtonOptions) {
    super(Paneer/*html*/`<div></div>`);
    PaneerAppend(this.element)/*html*/`
    <button
      alt="${b.alt}"
      ${el => { this.button = el }}
      ${{ padding: "0px", margin: "0px", width: "100%", height: "100%", border: "1px solid black" }}>
      <img src="${b.icon}" ${{ width: "100%", height: "100%" }}/>
    </button>
    `
    this.button.addEventListener("click", b.onClick)
  }
}

export class ButtonGrid extends AttachedPaneer implements Options {
  // 
  // height = width / aspect
  // 
  aspectRatio: number;
  width: string;

  constructor(options: Options) {
    super(Paneer/*html*/`<div></div>`);
    this.aspectRatio = options.aspectRatio;
    this.width = options.width;

    this.resize();
  }

  resize() {
    // Redo based on column/row sizing
    this.element.style.display = "grid";;

    this.element.style.gridTemplateColumns = `repeat(auto-fill, ${this.width})`;
    this.element.style.gridTemplateRows =
      `repeat(auto-fill, calc(${this.width} / ${this.aspectRatio}))`;
  }

  add(options: ButtonOptions) {
    this.append(new Button(options));
  }
}