"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var paper = require("paper");
var utils_1 = require("./utils");
function createLayer(updatFn, layer) {
    var layerDiv = utils_1.createDiv("", "horizontal", [
        utils_1.createCheckBox("", "V", layer.visible, function (event) {
            layer.visible = !layer.visible;
            updatFn();
        }),
        utils_1.createButton(layer == paper.project.activeLayer ? "selected" : "", layer.name, function () {
            layer.activate();
            updatFn();
        }),
        utils_1.createSlider("", "", layer.opacity, 0, 1, function (event) {
            layer.opacity = event.target.value;
        }),
        utils_1.createDiv("", "vertical", layer.children.map(function (child) {
            return utils_1.createButton("", child.className, function () {
                child.selected = !child.selected;
            });
        }))
    ]);
    return layerDiv;
}
function showLayers(canvas, id) {
    var updatFn = function () { return showLayers(canvas, id); };
    var layersDiv = utils_1.querySelectorOrThrow(id);
    while (layersDiv.firstChild) {
        layersDiv.removeChild(layersDiv.firstChild);
    }
    for (var i = 0; i < canvas.layers.length; i++) {
        var layer = canvas.layers[i];
        if (!layer.name) {
            layer.name = "layer " + i;
        }
        var itemDiv = document.createElement("li");
        itemDiv.appendChild(createLayer(updatFn, layer));
        layersDiv.appendChild(itemDiv);
    }
    var addDiv = document.createElement("li");
    addDiv.appendChild(utils_1.createButton("", "Add", function () {
        canvas.activate();
        var l = new paper.Layer();
        updatFn();
    }));
    layersDiv.appendChild(addDiv);
}
exports.showLayers = showLayers;
//# sourceMappingURL=layers.js.map