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
function createMenu(id, children, menu) {
    var existingDom = document.querySelector("#" + id);
    if (existingDom && existingDom.parentElement) {
        existingDom.parentElement.removeChild(existingDom);
    }
    // Copy menu, keep as closure
    menu = __assign({}, menu);
    var title = utils_1.createDiv("", "titlebar", [
        utils_1.createDiv("", "title", [document.createTextNode(menu.title)]),
        utils_1.createDiv("", "minimize", [
            utils_1.createCheckBox("", "", !menu.minimized, function (event) {
                menu.minimized = !event.target.checked;
                draw();
            })
        ])
    ]);
    var content = utils_1.createDiv("", "menucontent", children);
    var handle = utils_1.createDiv("", "resizehandle", [document.createTextNode("░")]);
    var initalDragPoint;
    var initalRectPoint;
    window.addEventListener("mousemove", function (event) {
        if (initalDragPoint && initalRectPoint) {
            var currentDragPoint = new paper.Point(event.screenX, event.screenY);
            menu.bounds.point = initalRectPoint.add(currentDragPoint.subtract(initalDragPoint));
            console.log(event.pageX, event.pageY, initalDragPoint, initalRectPoint, currentDragPoint);
            draw();
        }
    });
    title.addEventListener("mousedown", function (event) {
        console.log("dragstart");
        initalDragPoint = new paper.Point(event.screenX, event.screenY);
        initalRectPoint = menu.bounds.point;
    });
    title.addEventListener("mouseup", function (event) {
        console.log("dragend");
        initalDragPoint = undefined;
        initalRectPoint = undefined;
    });
    var resizeInitalDragPoint;
    var resizeInitalRectsSize;
    window.addEventListener("mousemove", function (event) {
        if (resizeInitalDragPoint && resizeInitalRectsSize) {
            var currentDragPoint = new paper.Point(event.screenX, event.screenY);
            menu.bounds.size = resizeInitalRectsSize.add(currentDragPoint.subtract(resizeInitalDragPoint));
            draw();
        }
    });
    handle.addEventListener("mousedown", function (event) {
        resizeInitalDragPoint = new paper.Point(event.screenX, event.screenY);
        resizeInitalRectsSize = menu.bounds.size;
    });
    handle.addEventListener("mouseup", function (event) {
        resizeInitalRectsSize = undefined;
        resizeInitalDragPoint = undefined;
    });
    var dom = utils_1.createDiv(id, "menu", [
        // Title bar
        title,
        // Content
        content,
        // Resize
        handle
    ]);
    function draw() {
        if (menu.minimized) {
            content.setAttribute("style", "display:none");
            handle.setAttribute("style", "display:none");
            dom.setAttribute("style", "top:" + menu.bounds.topLeft.y + "px;\n  left:" + menu.bounds.topLeft.x + "px;");
        }
        else {
            content.setAttribute("style", "");
            handle.setAttribute("style", "");
            dom.setAttribute("style", "top:" + menu.bounds.topLeft.y + "px;\n  left:" + menu.bounds.topLeft.x + "px;\n  width:" + menu.bounds.width + "px;\n  height:" + menu.bounds.height + "px;");
        }
    }
    draw();
    return dom;
}
exports.createMenu = createMenu;
//# sourceMappingURL=menu.js.map