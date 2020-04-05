import * as paper from "paper";
import { div, text } from "./utils/dom";
import { words } from "./utils/words";
import { PaneerNode } from "./paneer/paneer";

/*export class LayerControls extends PaneerNode {
  constructor() {
    super("Vertical", "1fr", false);

    this.append(
      new PaneerNode("Horizontal", "1fr", false, [
        new PaneerLeaf({element:}),
        new PaneerLeaf(),
        new PaneerLeaf(),
      ])
    );
  }
}*/

/**
 * SHOULD DIFFERENTIATE BETWEEN CLICK AND DRAG
 * What to do on item click
 *  Depends on item type
 * Path:
 *  Select it (switch to select tool)
 * Layer: activate it (keep current tool)
 *
 * DO LATER
 * what to do on item drag
 * To make this easier we should have each parent be it's own div for drop detection/dragging together
 * Path:
 *  Re-arrange within layer/switch layer
 * Layer:
 *  Re-arrange within project
 */

const depthColors = ["red", "green", "blue", "pink", "yellowgreen", "cyan"];

function viewItemLabel(item: paper.Item, depth: number): HTMLElement {
  if (!item.name) {
    // Generate random name
    item.name =
      item.className + " " + words[Math.floor(Math.random() * words.length)];
  }

  const depthColor = depthColors[depth % depthColors.length];
  const weight = item.id == item.project.activeLayer.id ? "bold" : "regular";

  // For label, variable width
  return div({ class: "horizontal" }, [
    // For level indicator, fixed per depth
    div(
      { style: `width:${8 * depth}px;border-right: 2px solid ${depthColor};` },
      []
    ),
    // For label, variable width
    div({ style: `font-weight:${weight}; background-color:${item.selected? "cyan": "white"}` }, [text(item.name)])
  ]);
}

function viewItemControls(item: paper.Item, update: () => void): HTMLElement {
  // For controls together, fixed width
  return div({ class: "horizontal", style: "justify-content: flex-end" }, [
    // For visibility, fixed
    div({ class: "icon" }, [text(item.visible ? "😀" : "😆")], {
      click: (event: MouseEvent) => {
        event.stopPropagation();
        item.visible = !item.visible;
        update();
      }
    })
  ]);
}

function viewItem(
  item: paper.Item,
  depth: number,
  updated: () => void
): HTMLElement {
  // For layer, fixed width (or overflow), flex
  return div(
    {
      class: "horizontal"
      //style: `background-color:${item.selected ? "cyan" : "white"}`
    },
    [
      // For visibility, fixed
      viewItemLabel(item, depth),
      // For lock, fixed
      viewItemControls(item, updated)
    ],
    {
      click: (event:MouseEvent) => {
        if (item.className == "Layer") {
          (item as paper.Layer).activate();
        } else {
          if (item.selected) {
            if(!event.shiftKey) {
              paper.project.deselectAll();
              item.selected = true;
            } else {
              item.selected = false;
            }
          } else {
            if(!event.shiftKey) {
              paper.project.deselectAll();
            }
            item.selected = true;
          }
        }
        updated();
      }
    }
  );
}

function addChildren(
  results: HTMLElement[],
  item: paper.Item,
  depth: number,
  updated: () => void
) {
  if (!item.children) return;
  for (let i = 0; i < item.children.length; i++) {
    const child = item.children[i];
    results.push(viewItem(child, depth + 1, updated));
    addChildren(results, child, depth + 1, updated);
  }
}

export function viewProject(project: paper.Project, updated: () => void) {
  let results: HTMLElement[] = [];
  for (let i = 0; i < project.layers.length; i++) {
    const layer = project.layers[i];
    results.push(viewItem(project.layers[i], 0, updated));
    addChildren(results, layer, 0, updated);
  }

  // All items container
  return div({class: "vertical"}, results);
}
