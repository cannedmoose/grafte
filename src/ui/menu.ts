import * as paper from "paper";
import { div, checkbox, text } from "./utils";

/**
 * Menu is a movable and resizable container for children elements.
 */
type Menu = {
  title: string;
  minimized: boolean;
  class: string;
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

  let content = div({ class: "menucontent" }, children);

  let dom = div({ class: "menu " + (menu.class ? menu.class : "") }, [
    // Content
    content
  ]);

  return dom;
}
