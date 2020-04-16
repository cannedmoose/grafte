import * as paper from "paper";
import { div, text, button, img } from "./utils/dom";
import { words } from "./utils/words";
import { PaneerDOM } from "./paneer/paneerdom";
import { ButtonGrid } from "./paneer/buttongrid";

const depthColors = ["Chartreuse", "yellowgreen", "Aquamarine", "cyan", "red", "green", "blue", "pink"];
export class LayerControls extends PaneerDOM {
  label = "Layers";

  buttons: ButtonGrid;
  layers: PaneerDOM;

  labels: Map<number, Label>;

  constructor() {
    super();

    this.buttons = new ButtonGrid({ aspectRatio: 1, width: "2em" });
    this.buttons.add({ alt: "Add Layer", icon: "icons/plus.svg", onClick: () => { new paper.Layer() } });
    this.buttons.add({ alt: "Move Forward", icon: "icons/forward.svg", onClick: () => { this.moveForward() } });
    this.buttons.add({ alt: "Move Back", icon: "icons/back.svg", onClick: () => { this.moveBack() } });

    this.layers = new PaneerDOM();

    this.style.height = "100%";

    this.append(this.buttons);
    this.append(this.layers);

    this.layers.style.overflow = "scroll";

    this.labels = new Map();

    this.refreshLayers = this.refreshLayers.bind(this);

    this.refreshLayers();
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

  refreshLayers() {
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
        label = new Label(item, depth);
        this.labels.set(item.id, label);
      }
      label.depth = depth;

      label.resize();
      this.layers.append(label);
      if (item.children) {
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
      if (label) {
        this.layers.remove(label);
        this.labels.delete(key);
      }
    });

    this.resize();
  }

  resize() {
    super.resize();
  }
}

class Label extends PaneerDOM {
  parent: LayerControls;
  item: paper.Item;
  depth: number;
  spacing: PaneerDOM;
  main: PaneerDOM;
  container: PaneerDOM;
  controls: ButtonGrid;

  constructor(item: paper.Item, depth: number) {
    super();
    this.item = item;
    this.depth = depth;

    this.style.display = "flex";
    this.style.flexDirection = "row";
    this.style.width = "100%";

    this.container = new PaneerDOM();
    this.container.style.width = "100%";
    this.container.style.display = "flex";
    this.container.style.justifyContent = "space-between"
    this.container.style.flexDirection = "row";
    this.container.style.padding = ".2em";

    this.spacing = new PaneerDOM();
    this.main = new PaneerDOM();
    this.main.style.cursor = "default";
    this.main.style.width = "auto";
    this.main.style.userSelect = "none";
    this.main.element.addEventListener("click", (event: MouseEvent) => {
      if (item.className == "Layer") {
        const layer = item as paper.Layer;
        layer.activate();
        this.parent.refreshLayers();
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

    this.controls = new ButtonGrid({ aspectRatio: 1, width: "1.4em" });
    this.controls.add({
      alt: "visibility", icon: "icons/eye.png", onClick: () => {
        this.item.visible = !this.item.visible;
      }
    });

    this.container.append(this.main);
    this.container.append(this.controls);

    this.append(this.spacing);
    this.append(this.container);

    this.resize();
  }

  resize() {
    this.spacing.style.width = `${this.depth * 8}px`;
    this.container.style.backgroundColor = depthColors[this.depth % depthColors.length];
    if (!this.item.name) {
      this.item.name = this.item.className.slice(0, 1) + words[Math.floor(Math.random() * words.length)]
    }
    this.main.element.textContent = this.item.name;
    this.main.style.fontWeight = (this.item.id == this.item.project.activeLayer.id)
      || (this.item.className != "Layer" && this.item.selected)
      ? "bold" : "normal";

    super.resize();
  }
}