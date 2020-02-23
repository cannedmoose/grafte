"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var paper = require("paper");
var utils_1 = require("./utils");
/**
 * Display tools
 */
function getStroke() {
    var selector = utils_1.querySelectorOrThrow("#stroke");
    return new paper.Color(selector.value);
}
function getFill() {
    var selector = utils_1.querySelectorOrThrow("#fill");
    return new paper.Color(selector.value);
}
function getWidth() {
    var selector = utils_1.querySelectorOrThrow("#width");
    return Number(selector.value);
}
function getOpacity() {
    var selector = utils_1.querySelectorOrThrow("#opacity");
    return Number(selector.value);
}
function createTools(projects, updateFn) {
    var _a = __assign({}, projects), ui = _a.ui, canvas = _a.canvas;
    ui.activate();
    var toolPath = new paper.Path();
    // Circle
    var circleTool = new paper.Tool();
    circleTool.onMouseDown = function (event) {
        ui.activate();
        toolPath.selected = true;
    };
    circleTool.onMouseDrag = function (event) {
        ui.activate();
        toolPath.remove();
        toolPath = new paper.Path.Circle({
            center: event.downPoint,
            radius: event.downPoint.getDistance(event.point)
        });
        toolPath.selected = true;
    };
    circleTool.onMouseUp = function (event) {
        canvas.activate();
        var p = new paper.Path();
        p.copyContent(toolPath);
        ui.activate();
        toolPath.remove();
        p.strokeColor = getStroke();
        p.fillColor = getFill();
        p.strokeWidth = getWidth();
        p.opacity = getOpacity();
        p.selected = false;
        updateFn();
    };
    // Rect
    var rectTool = new paper.Tool();
    rectTool.onMouseDown = function (event) {
        ui.activate();
        toolPath.selected = true;
    };
    rectTool.onMouseDrag = function (event) {
        ui.activate();
        toolPath.remove();
        toolPath = new paper.Path.Rectangle({
            point: event.downPoint,
            size: event.point.subtract(event.downPoint)
        });
        toolPath.selected = true;
    };
    rectTool.onMouseUp = function (event) {
        canvas.activate();
        var rectPath = new paper.Path();
        rectPath.copyContent(toolPath);
        ui.activate();
        toolPath.remove();
        rectPath.strokeColor = getStroke();
        rectPath.fillColor = getFill();
        rectPath.strokeWidth = getWidth();
        rectPath.opacity = getOpacity();
        updateFn();
    };
    // Pen
    var penTool = new paper.Tool();
    penTool.minDistance = 5;
    penTool.onMouseDown = function (event) {
        ui.activate();
        toolPath = new paper.Path();
    };
    penTool.onMouseDrag = function (event) {
        ui.activate();
        toolPath.add(event.point);
        toolPath.closed = false;
        toolPath.selected = true;
    };
    penTool.onMouseUp = function (event) {
        canvas.activate();
        var penPath = new paper.Path();
        penPath.copyContent(toolPath);
        ui.activate();
        toolPath.remove();
        penPath.strokeColor = getStroke();
        penPath.strokeWidth = getWidth();
        penPath.opacity = getOpacity();
        penPath.strokeCap = "round";
        penPath.simplify();
        updateFn();
    };
    var selectTool = new paper.Tool();
    var selectState = { type: "noselection" };
    selectTool.onMouseDown = function (event) {
        canvas.activate();
        selectState = selectionToolUpdate(selectState, {
            event: event,
            type: "mousedown"
        });
    };
    selectTool.onMouseMove = function (event) {
        canvas.activate();
        selectState = selectionToolUpdate(selectState, {
            event: event,
            type: "mousemove"
        });
    };
    selectTool.onMouseUp = function (event) {
        canvas.activate();
        selectState = selectionToolUpdate(selectState, {
            event: event,
            type: "mouseup"
        });
    };
    selectTool.onKeyDown = function (event) {
        canvas.activate();
        selectState = selectionToolUpdate(selectState, {
            event: event,
            type: "keydown"
        });
    };
    return { circleTool: circleTool, penTool: penTool, rectTool: rectTool, selectTool: selectTool };
}
exports.createTools = createTools;
function createToolOptions() {
    return utils_1.createDiv("", "vertical", [
        utils_1.createSlider("opacity", "", 1, 0, 1, function (event) { }),
        utils_1.createSlider("width", "", 1, 0, 50, function (event) { }),
        utils_1.createDiv("", "horizontal", [
            utils_1.createColor("stroke", "", "#000000", function (event) { }),
            utils_1.createColor("fill", "", "#FFFFFF", function (event) { })
        ])
    ]);
}
exports.createToolOptions = createToolOptions;
function selectionToolUpdate(state, event) {
    switch (state.type) {
        case "noselection":
            return onNoSelection(event);
        case "draggingobject":
            return onDraggingObject(event, state);
        case "selected":
            return onSelected(event, state);
    }
}
function onNoSelection(event) {
    // Ensure nothing is selected
    paper.project.deselectAll();
    // Early exit to avoid hittest unless mouse down
    switch (event.type) {
        case "mousemove":
            return { type: "noselection" };
        case "keydown":
            return { type: "noselection" };
        case "mouseup":
            return { type: "noselection" };
    }
    // hittest
    var mouseEvent = event.event;
    var hitResult = paper.project.hitTest(mouseEvent.point);
    if (!hitResult) {
        return { type: "noselection" };
    }
    var hitResultItem = hitResult.item;
    switch (event.type) {
        case "mousedown":
            hitResultItem.selected = true;
            return {
                type: "draggingobject",
                initialPoint: mouseEvent.point,
                delta: new paper.Point(0, 0)
            };
    }
}
function onDraggingObject(event, state) {
    switch (event.type) {
        case "keydown":
            if (event.event.key == "escape") {
                paper.project.deselectAll();
                return { type: "noselection" };
            }
            return __assign({}, state);
    }
    var delta = event.event.point.subtract(state.initialPoint);
    switch (event.type) {
        case "mousemove":
            paper.project.selectedItems.forEach(function (selected) {
                selected.position = selected.position.subtract(state.delta).add(delta);
            });
            return __assign(__assign({}, state), { delta: delta });
        case "mouseup":
            return { type: "selected" };
        // Escape hatch, pretend we are noSelection
        case "mousedown":
            return onNoSelection(event);
    }
}
function onSelected(event, state) {
    switch (event.type) {
        case "keydown":
            if (event.event.key == "escape") {
                paper.project.deselectAll();
                return { type: "noselection" };
            }
            return __assign({}, state);
    }
    // Early exit to avoid hittest unless mouse down
    switch (event.type) {
        case "mousemove":
            return __assign({}, state);
        case "mouseup":
            return __assign({}, state);
    }
    // hittest
    var mouseEvent = event.event;
    var hitResult = paper.project.hitTest(mouseEvent.point);
    var hitResultItem = hitResult.item;
    if (!hitResultItem) {
        return { type: "noselection" };
    }
    switch (event.type) {
        case "mousedown":
            hitResultItem.selected = true;
            return {
                type: "draggingobject",
                initialPoint: mouseEvent.point,
                delta: new paper.Point(0, 0)
            };
    }
}
//# sourceMappingURL=tools.js.map