import * as paper from "paper";
import { querySelectorOrThrow, createDiv, createCheckBox } from "./utils";

/**
 * Menu is a movable and resizable container for children elements.
 */
type Menu = {
  title: string;
  minimized: boolean;
  bounds: paper.Rectangle; // Does this include the title bar?
};

export function createMenu(
  id: string,
  children: HTMLElement[],
  menu: Menu
): HTMLElement {
  let existingDom = document.querySelector("#" + id);
  if (existingDom && existingDom.parentElement) {
    existingDom.parentElement.removeChild(existingDom);
  }

  // Copy menu, keep as closure
  menu = { ...menu };

  let title = createDiv("", "titlebar", [
    createDiv("", "title", [document.createTextNode(menu.title)]),
    createDiv("", "minimize", [
      createCheckBox("", "", !menu.minimized, event => {
        menu.minimized = !event.target.checked;
        draw();
      })
    ])
  ]);
  let content = createDiv("", "menucontent", children);
  let handle = createDiv("", "resizehandle", [document.createTextNode("░")]);

  let initalDragPoint;
  let initalRectPoint;
  window.addEventListener("mousemove", event => {
    if (initalDragPoint && initalRectPoint) {
      let currentDragPoint = new paper.Point(event.screenX, event.screenY);
      menu.bounds.point = initalRectPoint.add(
        currentDragPoint.subtract(initalDragPoint)
      );
      console.log(
        event.pageX,
        event.pageY,
        initalDragPoint,
        initalRectPoint,
        currentDragPoint
      );
      draw();
    }
  });

  title.addEventListener("mousedown", event => {
    console.log("dragstart");
    initalDragPoint = new paper.Point(event.screenX, event.screenY);
    initalRectPoint = menu.bounds.point;
  });

  title.addEventListener("mouseup", event => {
    console.log("dragend");
    initalDragPoint = undefined;
    initalRectPoint = undefined;
  });

  let resizeInitalDragPoint;
  let resizeInitalRectsSize;
  window.addEventListener("mousemove", event => {
    if (resizeInitalDragPoint && resizeInitalRectsSize) {
      let currentDragPoint = new paper.Point(event.screenX, event.screenY);
      menu.bounds.size = resizeInitalRectsSize.add(
        currentDragPoint.subtract(resizeInitalDragPoint)
      );
      draw();
    }
  });

  handle.addEventListener("mousedown", event => {
    resizeInitalDragPoint = new paper.Point(event.screenX, event.screenY);
    resizeInitalRectsSize = menu.bounds.size;
  });

  handle.addEventListener("mouseup", event => {
    resizeInitalRectsSize = undefined;
    resizeInitalDragPoint = undefined;
  });

  let dom = createDiv(id, "menu", [
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

      dom.setAttribute(
        "style",
        `top:${menu.bounds.topLeft.y}px;
  left:${menu.bounds.topLeft.x}px;`
      );
    } else {
      content.setAttribute("style", "");
      handle.setAttribute("style", "");

      dom.setAttribute(
        "style",
        `top:${menu.bounds.topLeft.y}px;
  left:${menu.bounds.topLeft.x}px;
  width:${menu.bounds.width}px;
  height:${menu.bounds.height}px;`
      );
    }
  }

  draw();

  return dom;
}
