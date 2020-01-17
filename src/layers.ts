import * as paper from "paper";
import {
  createSlider,
  createDiv,
  createCheckBox,
  createButton,
  querySelectorOrThrow
} from "./utils";

function createLayer(updatFn: () => void, layer: paper.Layer): HTMLElement {
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
  let layersDiv = querySelectorOrThrow(id);
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
}
