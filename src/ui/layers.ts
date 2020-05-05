import * as paper from "paper";
import { words } from "./utils/words";
import { Tab } from "./components/panes/pane";
import { ChangeFlag } from "../changeflags";
import { AttachedPaneer } from "./paneer/paneer";
import { Pan, AppendPan } from "./paneer/template";
import { ToolTip } from "./components/tooltip";
import { Serializer } from "./utils/deserializer";
import { Resource, Store } from "./utils/store";

const depthColors = ["pink", "Aquamarine", "Chartreuse", "yellowgreen", "Aquamarine", "red", "green", "blue"];
export class LayerControls extends AttachedPaneer implements Tab {
  tab: true = true;
  label = "Layers";

  buttons: AttachedPaneer;
  layers: AttachedPaneer;

  labels: Map<number, Label>;
  refreshing: boolean;

  project: Resource<paper.Project>;

  constructor(project: Resource<paper.Project>) {
    super(Pan/*html*/`<div></div>`);

    this.refreshing = false;

    this.buttons = new AttachedPaneer(Pan/*html*/`<div></div>`);
    this.buttons.style = {
      display: "flex",
      flexDirection: "row",
      height: "1.5em"
    }
    this.buttons.append(
      new ToolTip({
        alt: "Add Layer",
        icon: "icons/plus.svg",
        onClick: () => { new paper.Layer(); this.requestRefresh(); },
        size: "1.5em"
      })
    );
    this.buttons.append(
      new ToolTip({
        alt: "Move Forward",
        icon: "icons/forward.svg",
        onClick: () => { this.moveForward() },
        size: "1.5em"
      })
    );
    this.buttons.append(
      new ToolTip({
        alt: "Move Back",
        icon: "icons/back.svg",
        onClick: () => { this.moveBack() },
        size: "1.5em"
      })
    );

    this.layers = new AttachedPaneer(Pan/*html*/`<div></div>`);

    this.style.height = "100%";

    this.append(this.buttons.element);
    this.append(this.layers.element);

    this.layers.style.overflow = "scroll";

    this.labels = new Map();

    this.refreshLayers = this.refreshLayers.bind(this);

    this.project = project;

    this.project.content.on("changed", (e: any) => {
      if (e.flags && e.flags & (ChangeFlag.CHILDREN | ChangeFlag.SELECTION)) {
        this.requestRefresh();
      }
    });

    this.requestRefresh();
  }

  requestRefresh() {
    if (!this.refreshing) {
      window.requestAnimationFrame(this.refreshLayers);
      this.refreshing = true;
    }
  }

  moveForward() {
    if (this.project.content.selectedItems.length == 0) {
      const active = this.project.content.activeLayer;
      const newIndex = Math.min(this.project.content.activeLayer.index + 1, this.project.content.layers.length);
      this.project.content.insertLayer(newIndex, this.project.content.activeLayer);
      active.activate();
      return;
    }
    this.project.content.selectedItems.forEach(item => {
      const index = item.parent.children.indexOf(item);
      if (index < item.parent.children.length - 1) {
        item.parent.insertChild(index + 1, item);
      }
    });
  }

  moveBack() {
    if (this.project.content.selectedItems.length == 0) {
      const active = this.project.content.activeLayer;
      const newIndex = Math.max(this.project.content.activeLayer.index - 1, 0);
      this.project.content.insertLayer(newIndex, this.project.content.activeLayer);
      active.activate();
      return;
    }

    this.project.content.selectedItems.forEach(item => {
      const index = item.parent.children.indexOf(item);
      if (index > 0) {
        item.parent.insertChild(index - 1, item);
      }
    });
  }

  refreshLayers(d: number) {
    const seenIds: Set<number> = new Set();
    const project = this.project.content;

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
}

class Label extends AttachedPaneer {
  layers: LayerControls;
  item: paper.Item;
  depth: number;
  controls: ToolTip;
  open: boolean;
  spacing: HTMLElement;
  container: HTMLElement;
  label: HTMLElement;
  clicker: HTMLElement;

  constructor(layers: LayerControls, item: paper.Item, depth: number) {
    super(Pan/*html*/`<div></div>`);
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

    this.controls = new ToolTip({
      size: "1.4em",
      alt: "visibility",
      icon: "icons/eye.png",
      onClick: () => {
        this.item.visible = !this.item.visible;
      },
      isSelected: () => !this.item.visible
    });

    AppendPan(this.element)/*html*/`
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
        })
      }}></div>
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

    this.controls.refresh();
  }
}

Serializer.register(
  LayerControls,
  (raw: any) => {
    const node = new LayerControls(Store.getResource("project", "default"));
    return node;
  },
  (raw: LayerControls) => {
    return {};
  }
);