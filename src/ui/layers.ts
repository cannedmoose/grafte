import * as paper from "paper";
import { div, text, button } from "./utils/dom";
import { words } from "./utils/words";
import { PaneerNode, PaneerLeaf, Paneer } from "./paneer/paneer";

const depthColors = ["red", "green", "blue", "pink", "yellowgreen", "cyan"];
export class LayerControls extends PaneerNode {
  layersView: PaneerNode;
  constructor() {
    super("Vertical", "1fr", false);

    this.layersView = new PaneerNode("Vertical", "10fr", false);

    this.appendAll([
      new PaneerNode("Horizontal", "1fr", false, [
        new PaneerLeaf({
          element: button({}, [text("add")], {
            click: event => this.addLayer()
          }),
        }),
        new PaneerLeaf({
          element: button({}, [text("back")], {
            click: event => this.moveBack()
          }),
        }),
        new PaneerLeaf({
          element: button({}, [text("forward")], {
            click: event => this.moveForward()
          })
        }),
      ]),
      this.layersView
    ]
    );

    this.refreshLayers();
  }

  refreshLayers() {
    // Remove existing children
    this.layersView.children.forEach(child => child.delete());

    const project = paper.project;

    for (let i = 0; i < project.layers.length; i++) {
      this.layersView.append(this.viewItem(project.layers[i], 0));
    }
  }

  viewItem(item: paper.Item, depth: number): Paneer {
    if (item.children) {
      const node = new PaneerNode("Vertical", "min-content", false, [this.label(item, depth)]);
      node.appendAll(item.children.map(child => this.viewItem(child, depth + 1)));
      return node;
    } else {
      return this.label(item, depth);
    }
  }

  label(item: paper.Item, depth: number): Paneer {
    if (!item.name) {
      // Generate random name
      item.name =
        item.className + " " + words[Math.floor(Math.random() * words.length)];
    }

    const depthColor = depthColors[depth % depthColors.length];
    const weight = (item.id == item.project.activeLayer.id)
      || (item.className != "Layer" && item.selected)
      ? "bold" : "regular";
    const el = div({}, [text(item.name)], {
      click: (event:MouseEvent) => {
        if (item.className == "Layer") {
          const layer = item as paper.Layer;
          layer.activate();
          this.refreshLayers();
        } else {
          if (item.selected && event.shiftKey) {
            item.selected = false;
          } else {
            if (!event.shiftKey) {
              paper.project.deselectAll();
            }
            item.selected = true;
          }
        }
      }
    });
    el.style.backgroundColor = depthColor;
    el.style.fontWeight = weight;
    el.style.cursor = "default";
    el.style.userSelect = "none";

    return new PaneerNode("Horizontal", "min-content", false, [
      new PaneerLeaf({ element: div({}, []) }, `${8 * depth}px`),
      new PaneerLeaf({ element: el }, "auto")
    ]);
  }

  moveForward() {
    if(paper.project.selectedItems.length == 0) {
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
    if(paper.project.selectedItems.length == 0) {
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

  addLayer() {
    new paper.Layer();
    this.refreshLayers();
  }
}