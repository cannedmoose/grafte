import { Paneer, AttachedPaneer, isAttached } from "../../paneer/paneer";
import { Pan } from "../../paneer/template";
import { Serializer } from "../../utils/deserializer";

type Intent = "tabdrop";

export interface Overlay extends Paneer {
  overlay: true;

  top: Paneer;
  bottom: Paneer;

  registerIntent(intent: Intent, paneer: AttachedPaneer): void;
  getIntent(intent: Intent): AttachedPaneer | undefined;
}

export function isOverlay(el: any): el is Overlay {
  return el && (el as Overlay).overlay;
}

export class DragOverlay extends Paneer implements Overlay {
  overlay: true = true;

  top: AttachedPaneer;
  bottom: AttachedPaneer;

  tabDropZone?: AttachedPaneer;

  constructor() {
    super();

    this.bottom = new AttachedPaneer(
      Pan/*html*/`<div ${{ position: "absolute", width: "100%", height: "100%" }}></div>`);
    this.top = new AttachedPaneer(
      Pan/*html*/`<div ${{ position: "absolute", width: "100%", height: "100%", pointerEvents: "none" }}></div>`);
  }

  attached() {
    const children = this.children(isAttached);
    this.clear();

    this.append(this.bottom);
    this.append(this.top);

    children.forEach(
      child => this.bottom.append(child));
  }

  registerIntent(intent: Intent, paneer: AttachedPaneer) {
    this.tabDropZone = paneer;
  }

  getIntent(intern: Intent) {
    return this.tabDropZone;
  }
}
  

Serializer.register(
  DragOverlay,
  (raw: any) => {
    if (!raw) throw `INVALID RAW FOR DRAGOVERLAY`;
    const result = new DragOverlay();
    result.attach(Pan/*html*/`<div></div>`);

    raw.top
      .map((child: any) => Serializer.deserialize(child))
      .filter(isAttached)
      .forEach((t:AttachedPaneer) => result.top.append(t));
    
    raw.bottom
      .map((child: any) => Serializer.deserialize(child))
      .filter(isAttached)
      .forEach((t:AttachedPaneer) => result.bottom.append(t));

    return result;
  },
  (raw: DragOverlay) => {
    return {
      top: raw.top.children(isAttached).filter(Serializer.canSerialize).map(Serializer.serialize),
      bottom: raw.bottom.children(isAttached).filter(Serializer.canSerialize).map(Serializer.serialize)
      // TODO(P3) save current tab?
    }
  }
);