import * as paper from "paper";
import {
  createSlider,
  createDiv,
  createCheckBox,
  createButton,
  querySelectorOrThrow
} from "./utils";

function createLayer(id: string, layer: paper.Layer): HTMLElement {
  let layerDiv = createDiv("", "horizontal", [
    createCheckBox("", "V", layer.visible, event => {
      layer.visible = !layer.visible;
      showLayers(id);
    }),
    createButton(
      layer == paper.project.activeLayer ? "selected" : "",
      layer.name,
      () => {
        layer.activate();
        showLayers(id);
      }
    ),
    createSlider("", "", layer.opacity, 0, 1, event => {
      layer.opacity = event.target.value;
    })
  ]);

  return layerDiv;
}

export function showLayers(id: string) {
  let layersDiv = querySelectorOrThrow(id);
  while (layersDiv.firstChild) {
    layersDiv.removeChild(layersDiv.firstChild);
  }
  for (let i = 0; i < paper.project.layers.length; i++) {
    let layer = paper.project.layers[i];
    if (!layer.name) {
      layer.name = "layer " + i;
    }
    let itemDiv = document.createElement("li");
    itemDiv.appendChild(createLayer(id, layer));
    layersDiv.appendChild(itemDiv);
  }

  let addDiv = document.createElement("li");
  addDiv.appendChild(
    createButton("", "Add", () => {
      let l = new paper.Layer();
      paper.project.addLayer(l);
      l.activate();
      showLayers(id);
    })
  );
  layersDiv.appendChild(addDiv);
}
