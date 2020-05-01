import { PPaneer, Paneer, AttachedPaneer, isAttached } from "../../paneer/newPaneer";

export interface Overlay extends PPaneer {
  overlay: true;

  top: PPaneer;
  bottom: PPaneer;
}

export function isOverlay(el: any): el is Overlay {
  return el && (el as Overlay).overlay;
}

export class DragOverlay extends PPaneer implements Overlay {
  overlay: true = true;

  top: AttachedPaneer;
  bottom: AttachedPaneer;

  constructor() {
    super();

    this.bottom = new AttachedPaneer(
      Paneer/*html*/`<div ${{ position: "absolute", width: "100%", height: "100%" }}></div>`);
    this.top = new AttachedPaneer(
      Paneer/*html*/`<div ${{ position: "absolute", width: "100%", height: "100%", pointerEvents: "none" }}></div>`);
  }

  attached() {
    const children = this.children(isAttached);
    this.clear();

    this.append(this.bottom);
    this.append(this.top);

    children.forEach(
      child => this.bottom.append(child));
  }
}
  