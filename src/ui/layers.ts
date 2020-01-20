import * as paper from "paper";
import { slider, div, text, checkbox, button, queryOrThrow } from "./utils";

function viewItemLabel(item: paper.Item, depth: number): HTMLElement {
  if (!item.name) {
    item.name = item.className + " " + item.id;
  }

  // For label, variable width
  return div({}, [
    // For level indicator, fixed per depth
    div({}, []),
    // For label, variable width
    div({}, [text(item.name)])
  ]);
}

function viewItemControls(item: paper.Item): HTMLElement {
  // For controls together, fixed width
  return div({}, [
    // For visibility, fixed
    div({}, []),
    // For lock, fixed
    div({}, [])
  ]);
}

function viewItem(item: paper.Item, depth: number): HTMLElement {
  // For layer, fixed width (or overflow), flex
  return div({}, [
    // For visibility, fixed
    viewItemLabel(item, depth),
    // For lock, fixed
    viewItemControls(item)
  ]);
}

function addChildren(results: HTMLElement[], item: paper.Item, depth: number) {
  for (let i = 0; i < item.children.length; i++) {
    const child = item.children[i];
    results.push(viewItem(child, depth + 1));
    addChildren(results, child, depth + 1);
  }
}

export function viewProject(project: paper.Project) {
  let results: HTMLElement[] = [];
  for (let i = 0; i < project.layers.length; i++) {
    const layer = project.layers[i];
    results.push(viewItem(project.layers[i], 0));
    addChildren(results, layer, 0);
  }

  // All items container
  return div({}, results);
}

/*function createLayer(updatFn: () => void, layer: paper.Layer): HTMLElement {
  let layerDiv = createDiv("", "horizontal", [
    createCheckBox("", "V", layer.visible, event => {
      layer.visible = !layer.visible;
      updatFn();
    }),
    createButton(
      layer == paper.project.activeLayer ? "selected" : "",
      layer.name,
      () => {
        layer.activate();
        updatFn();
      }
    ),
    createSlider("", "", layer.opacity, 0, 1, event => {
      layer.opacity = event.target.value;
    }),
    createDiv(
      "",
      "vertical",
      layer.children.map(child =>
        createButton("", child.className, () => {
          child.selected = !child.selected;
        })
      )
    )
  ]);

  return layerDiv;
}

export function showLayers(canvas: paper.Project, id: string) {
  let updatFn = () => showLayers(canvas, id);
  let layersDiv = queryOrThrow(id);
  while (layersDiv.firstChild) {
    layersDiv.removeChild(layersDiv.firstChild);
  }
  for (let i = 0; i < canvas.layers.length; i++) {
    let layer = canvas.layers[i];
    if (!layer.name) {
      layer.name = "layer " + i;
    }
    let itemDiv = document.createElement("li");
    itemDiv.appendChild(createLayer(updatFn, layer));
    layersDiv.appendChild(itemDiv);
  }

  let addDiv = document.createElement("li");
  addDiv.appendChild(
    createButton("", "Add", () => {
      canvas.activate();
      let l = new paper.Layer();
      updatFn();
    })
  );
  layersDiv.appendChild(addDiv);
}*/
