"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function querySelectorOrThrow(query) {
    var el = document.querySelector(query);
    if (!el) {
        throw "No element for query selector " + query;
    }
    return el;
}
exports.querySelectorOrThrow = querySelectorOrThrow;
function createDiv(id, classes, children) {
    if (children === void 0) { children = []; }
    var ele = document.createElement("div");
    ele.setAttribute("class", classes);
    if (id) {
        ele.setAttribute("id", id);
    }
    for (var i = 0; i < children.length; i++) {
        ele.appendChild(children[i]);
    }
    return ele;
}
exports.createDiv = createDiv;
function createButton(classes, text, onClick) {
    if (classes === void 0) { classes = ""; }
    if (text === void 0) { text = ""; }
    var button = document.createElement("button");
    button.innerText = text;
    button.addEventListener("click", onClick);
    button.setAttribute("class", classes);
    return button;
}
exports.createButton = createButton;
function createCheckBox(classes, text, isChecked, onChange) {
    var ele = document.createElement("input");
    ele.setAttribute("type", "checkbox");
    ele.setAttribute("class", classes);
    ele.innerText = text;
    if (isChecked) {
        ele.setAttribute("checked", "");
    }
    ele.addEventListener("change", onChange);
    return ele;
}
exports.createCheckBox = createCheckBox;
function createSlider(id, classes, value, min, max, onChange) {
    var ele = document.createElement("input");
    if (id) {
        ele.setAttribute("id", id);
    }
    ele.setAttribute("type", "range");
    ele.setAttribute("class", classes);
    ele.setAttribute("min", min.toString());
    ele.setAttribute("max", max.toString());
    ele.setAttribute("step", "0.01");
    ele.setAttribute("value", value.toString());
    ele.addEventListener("change", onChange);
    return ele;
}
exports.createSlider = createSlider;
function createColor(id, classes, value, onChange) {
    var ele = document.createElement("input");
    ele.setAttribute("type", "color");
    if (id) {
        ele.setAttribute("id", id);
    }
    ele.setAttribute("class", classes);
    ele.setAttribute("value", value);
    ele.addEventListener("change", onChange);
    return ele;
}
exports.createColor = createColor;
//# sourceMappingURL=utils.js.map