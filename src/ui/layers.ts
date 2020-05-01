import * as paper from "paper";
import { words } from "./utils/words";
import { ButtonGrid } from "./components/buttongrid";
import { Tab } from "./components/panes/pane";
import { Viewport } from "./viewport";
import { ChangeFlag } from "../changeflags";
import { AttachedPaneer, Paneer, PaneerAppend } from "./paneer/newPaneer";

const depthColors = ["pink", "Aquamarine", "Chartreuse", "yellowgreen", "Aquamarine", "red", "green", "blue"];
export class LayerControls extends AttachedPaneer implements Tab {
  tab: true = true;
  label = "Layers";

  buttons: ButtonGrid;
  layers: AttachedPaneer;

  labels: Map<number, Label>;
  refreshing: boolean;

  constructor(viewport: Viewport) {
    super(Paneer/*html*/`<div></div>`);

    this.refreshing = false;

    this.buttons = new ButtonGrid({ aspectRatio: 1, width: "2em" });
    this.buttons.add({
      alt: "Add Layer", icon: "icons/plus.svg", onClick: () => {
        new paper.Layer();
        // NOTE adding an empty layer doesn't cause view to be updated so we need to do this
      }
    });
    this.buttons.add({ alt: "Move Forward", icon: "icons/forward.svg", onClick: () => { this.moveForward() } });
    this.buttons.add({ alt: "Move Back", icon: "icons/back.svg", onClick: () => { this.moveBack() } });

    this.layers = new AttachedPaneer(Paneer/*html*/`<div></div>`);

    this.style.height = "100%";

    this.append(this.buttons.element);
    this.append(this.layers.element);

    this.layers.style.overflow = "scroll";

    this.labels = new Map();

    this.refreshLayers = this.refreshLayers.bind(this);

    viewport.project.on("changed", (e: any) => {
      if (e.flags && e.flags & (ChangeFlag.CHILDREN | ChangeFlag.SELECTION)) {
        this.requestRefresh();
      }
    });
  }

  requestRefresh() {
    if (!this.refreshing) {
      window.requestAnimationFrame(this.refreshLayers);
      this.refreshing = true;
    }
  }

  moveForward() {
    if (paper.project.selectedItems.length == 0) {
      const active = paper.project.activeLayer;
      const newIndex = Math.min(paper.project.activeLayer.index + 1, paper.project.layers.length);
      paper.project.insertLayer(newIndex, paper.project.activeLayer);
      active.activate();
      return;
    }
    paper.project.selectedItems.forEach(item => {
      const index = item.parent.children.indexOf(item);
      if (index < item.parent.children.length - 1) {
        item.parent.insertChild(index + 1, item);
      }
    });
  }

  moveBack() {
    if (paper.project.selectedItems.length == 0) {
      const active = paper.project.activeLayer;
      const newIndex = Math.max(paper.project.activeLayer.index - 1, 0);
      paper.project.insertLayer(newIndex, paper.project.activeLayer);
      active.activate();
      return;
    }

    paper.project.selectedItems.forEach(item => {
      const index = item.parent.children.indexOf(item);
      if (index > 0) {
        item.parent.insertChild(index - 1, item);
      }
    });
  }

  refreshLayers(d: number) {
    const seenIds: Set<number> = new Set();
    const project = paper.project;

    const toVisit: { item: paper.Item, depth: number }[] =
      project.layers.map(item => { return { item, depth: 0 } });

    while (toVisit.length > 0) {
      const temp = toVisit.pop();
      if (!temp) break;
      const { item, depth } = temp;
      seenIds.add(item.id);

      let label = this.labels.get(item.id);
      if (!label) {
        label = new Label(this, item, depth);
        this.labels.set(item.id, label);
      }
      label.depth = depth;

      label.refresh();
      this.layers.append(label);
      if (item.children && label.open) {
        item.children.forEach(child => {
          toVisit.push({ item: child, depth: depth + 1 });
        })
      }
    }

    const toRemove = [];
    for (const key of this.labels.keys()) {
      if (!seenIds.has(key)) {
        toRemove.push(key);
      }
    }

    toRemove.forEach(key => {
      const label = this.labels.get(key);
      label?.remove(true);
    });

    this.refreshing = false;
  }

  serialize() {
    return {
      type: "layers"
    };
  }

  static deserialize(raw: any, deserializer: (raw: { type: string }) => any): LayerControls {
    //@ts-ignore
    return new LayerControls(window.ctx.viewport);
  }
}

class Label extends AttachedPaneer {
  layers: LayerControls;
  item: paper.Item;
  depth: number;
  controls: ButtonGrid;
  open: boolean;
  spacing: HTMLElement;
  container: HTMLElement;
  label: HTMLElement;
  clicker: HTMLElement;

  constructor(layers: LayerControls, item: paper.Item, depth: number) {
    super(Paneer/*html*/`<div></div>`);
    this.layers = layers;
    this.item = item;
    this.depth = depth;
    this.open = true;

    this.style = {
      display: "flex",
      flexDirection: "row",
      width: "100%",
      height: "1.9em",
    }

    this.controls = new ButtonGrid({ aspectRatio: 1, width: "1.4em" });
    this.controls.add({
      alt: "visibility", icon: "icons/eye.png", onClick: () => {
        this.item.visible = !this.item.visible;
      }
    });

    PaneerAppend(this.element)/*html*/`
    <div ${el => this.container = el} ${{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        justifyContent: "space-between",
        padding: ".4em",
        borderBottom: "1px dashed black"
      }}>
        <div ${el => this.spacing = el}></div>
        <div 
            ${{ userSelect: "none", flex: "0", borderLeft: "1px solid black" }} 
            ${ el => {
              this.clicker = el;
              el.addEventListener("click", () => {
        this.open = !this.open;
        this.layers.requestRefresh();
      })}}></div>
        <div 
          ${{ cursor: "default", width: "100%", paddingLeft: "2em", userSelect: "none" }} 
          ${el => {
            this.label = el;
        el.addEventListener("click", (event: MouseEvent) => {
          if (item.className == "Layer") {
            const layer = item as paper.Layer;
            layer.activate();
          } else {
            if (item.selected && event.shiftKey) {
              item.selected = false;
            } else {
              if (!event.shiftKey) {
                item.project.deselectAll();
              }
              item.selected = true;
            }
          }
        })
      }}></div>
      ${this.controls}

    </div>
    `
    this.refresh();
  }

  refresh() {
    this.spacing.style.width = `${this.depth * 8}px`;
    this.container.style.backgroundColor = depthColors[this.depth % depthColors.length];
    if (!this.item.name) {
      this.item.name = this.item.className.slice(0, 1) + words[Math.floor(Math.random() * words.length)]
    }
    this.label.textContent = this.item.name;
    this.label.style.fontWeight = (this.item.id == this.item.project.activeLayer.id)
    || (this.item.className != "Layer" && this.item.selected)
      ? "bold" : "normal";

    if (this.item.children) {
      this.clicker.textContent = this.open ? "◒" : "◑";
    } else {
      this.clicker.textContent = "";
    }
  }
}