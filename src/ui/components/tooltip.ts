import { AttachedPaneer } from "../paneer/paneer";
import { Pan, AppendPan } from "../paneer/template";

export interface ToolTipOptions {
  size: string;
  alt: string;
  icon: string;

  onClick(e: MouseEvent): void;

  isSelected?(tip: ToolTip): boolean;
}

export class ToolTip extends AttachedPaneer {

  options: ToolTipOptions;
  button: HTMLElement;

  constructor(options: ToolTipOptions) {
    super(Pan/*html*/`<div></div>`);
    AppendPan(this.element)/*html*/`
    <button
      alt="${options.alt}"
      ${el => { this.button = el }}
      ${{ padding: "0px", margin: "0px", width: "100%", height: "100%", borderRadius: "4px", border: "solid 1px pink" }}>
      <img src="${options.icon}" ${{ height: "100%" }}/>
    </button>
    `

    this.style = { width: options.size, height: options.size, borderRadius: "4px" };

    this.options = { ...options };

    this.element.addEventListener("click",
      (e) => {
        this.options.onClick(e); this.refresh();
      });
    this.refresh();
  }


  refresh() {
    // TODO(P3) want actually diff styles for these
    if (this.options.isSelected && this.options.isSelected(this)) {
      this.button.style.backgroundColor = "grey";
    } else {
      this.button.style.backgroundColor = "yellow";
    }
  }
}