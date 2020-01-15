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

  let content = createDiv("", "menucontent", children);
  let handle = createDiv("", "resizehandle", [document.createTextNode("/")]);

  let dom = createDiv(id, "menu", [
    // Title bar
    createDiv("", "titlebar", [
      createDiv("", "title", [document.createTextNode(menu.title)]),
      createDiv("", "minimize", [
        createCheckBox("", "", !menu.minimized, event => {
          if (event.target.checked) {
            maximize(id, { ...menu, minimized: false });
          } else {
            minimize(id, { ...menu, minimized: false });
          }
        })
      ])
    ]),

    // Content
    content,

    // Resize
    handle
  ]);

  if (menu.minimized) {
    content.setAttribute("style", "display:none");
    handle.setAttribute("style", "display:none");

    dom.setAttribute(
      "style",
      `top:${menu.bounds.topLeft.y}px;
  left:${menu.bounds.topLeft.x}px;`
    );
  } else {
    dom.setAttribute(
      "style",
      `top:${menu.bounds.topLeft.y}px;
  left:${menu.bounds.topLeft.x}px;
  width:${menu.bounds.width}px;
  height:${menu.bounds.height}px;`
    );
  }

  return dom;
}

function minimize(id: String, menu: Menu) {
  let dom = querySelectorOrThrow("#" + id);
  let content = querySelectorOrThrow("#" + id + " > .menucontent");
  let handle = querySelectorOrThrow("#" + id + " > .resizehandle");
  content.setAttribute("style", "display:none");
  handle.setAttribute("style", "display:none");

  dom.setAttribute(
    "style",
    `top:${menu.bounds.topLeft.y}px;
  left:${menu.bounds.topLeft.x}px;`
  );
}

function maximize(id: String, menu: Menu) {
  let dom = querySelectorOrThrow("#" + id);
  let content = querySelectorOrThrow("#" + id + " > .menucontent");
  let handle = querySelectorOrThrow("#" + id + " > .resizehandle");
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
