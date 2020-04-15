import * as paper from "paper";
import { div, text, button, img } from "./utils/dom";
import { words } from "./utils/words";
import { PaneerDOM } from "./paneer/paneerdom";

const depthColors = [ "Chartreuse", "yellowgreen", "Aquamarine", "cyan", "red", "green", "blue", "pink"];
export class LayerControls extends PaneerDOM {
  label = "Layers";
  //layersView: PaneerNode;
  constructor() {
    super();
    
    /*this.layersView = new PaneerNode("Vertical", "10fr", false);

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
    );*/

    this.refreshLayers();
  }

  refreshLayers() {
    return;
    // TODO(P1) OPTIMIZE THIS
    // Should only run on changes that actually affect it.
    // Should only do necessary updates to dom.
    
    // Remove existing children
    /*this.layersView.children.forEach(child => child.delete());

    const project = paper.project;

    for (let i = 0; i < project.layers.length; i++) {
      this.layersView.append(this.viewItem(project.layers[i], 0));
    }*/
  }
/*
  viewItem(item: paper.Item, depth: number): Paneer {
    /*if (item.children) {
      //const node = new PaneerNode("Vertical", "min-content", false, [this.label(item, depth)]);
      node.appendAll(item.children.map(child => this.viewItem(child, depth + 1)));
      return node;
    } else {
      return this.label(item, depth);
    }*/
  /*}
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
    const labelDiv = div({}, [text(item.name)], {
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
    labelDiv.style.backgroundColor = depthColor;
    labelDiv.style.fontWeight = weight;
    labelDiv.style.cursor = "default";
    labelDiv.style.userSelect = "none";

    const viewImg = img({src: item.visible? "icons/eye.png" : "icons/eyeclosed.png"}, {click: () => {
      item.visible = !item.visible;
    }});
    viewImg.style.height = "1em";

    return new PaneerNode("Horizontal", "min-content", false, [
      new PaneerLeaf({ element: div({}, []) }, `${8 * depth}px`),
      new PaneerLeaf({ element: labelDiv }, "auto"),
      new PaneerLeaf({ element: viewImg }, "min-content")
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
  }*/

  resize() {
    super.resize();
    this.element.style.overflow = "scroll";
  }
}