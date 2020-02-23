"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var paper = require("paper");
var tools_1 = require("./tools");
var layers_1 = require("./layers");
var utils_1 = require("./utils");
var menu_1 = require("./menu");
function stoPoint(size) {
    return new paper.Point(paper.view.bounds.size.width, paper.view.bounds.size.height);
}
function rtoPoint(rect) {
    return stoPoint(rect.size);
}
window.onload = function () {
    var canvasDom = utils_1.querySelectorOrThrow("#canvas");
    var uiDom = utils_1.querySelectorOrThrow("#ui");
    paper.setup(canvasDom);
    var canvas = paper.project;
    var ui = new paper.Project(uiDom);
    var _a = tools_1.createTools({ canvas: canvas, ui: ui }, function () { return layers_1.showLayers(canvas, "#layers"); }), circleTool = _a.circleTool, penTool = _a.penTool, rectTool = _a.rectTool, selectTool = _a.selectTool;
    var menuDiv = utils_1.querySelectorOrThrow("#menus");
    menuDiv.appendChild(menu_1.createMenu("layers-menu", [utils_1.createDiv("layers", "vertical", [])], {
        title: "Layers",
        minimized: false,
        bounds: new paper.Rectangle(70, 0, 240, 140)
    }));
    window.requestAnimationFrame(function () { return layers_1.showLayers(canvas, "#layers"); });
    menuDiv.appendChild(menu_1.createMenu("tool-menu", [
        utils_1.createDiv("", "vertical", [
            utils_1.createButton("", "select", function () { return selectTool.activate(); }),
            utils_1.createButton("", "circle", function () { return circleTool.activate(); }),
            utils_1.createButton("", "rect", function () { return rectTool.activate(); }),
            utils_1.createButton("", "pen", function () { return penTool.activate(); })
        ])
    ], {
        title: "Tools",
        minimized: false,
        bounds: new paper.Rectangle(0, 0, 70, 140)
    }));
    menuDiv.appendChild(menu_1.createMenu("tooloptions-menu", [tools_1.createToolOptions()], {
        title: "Options",
        minimized: false,
        bounds: new paper.Rectangle(0, 140, 70, 140)
    }));
};
//# sourceMappingURL=main.js.map