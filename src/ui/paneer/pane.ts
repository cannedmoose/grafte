import * as paper from "paper";
import { PaneerDOM } from "./paneerdom";
import { div, text } from "../utils/dom";

// Root node
export class Pane extends PaneerDOM {
  _type = "PaneRoot";
  direction: "V" | "H";

  constructor(direction: "V" | "H") {
    super();

    // TODO getter/setter (maybs)
    this.direction = direction;
  }

  addPane(direction: "V" | "H", sizing: string): PaneNode {
    // adds a pane and returns it
    if (this.children.length > 0) {
      // Add resize handle
      this.append(new PaneHandle());
    }
    const node = new PaneNode(direction, sizing);
    this.append(node);
    this.resize();
    return node;
  }

  addLeaf(sizing: string): PaneLeaf {
    // adds a pane and returns it
    if (this.children.length > 0) {
      // Add resize handle
      this.append(new PaneHandle());
    }
    const node = new PaneLeaf(sizing);
    this.append(node);
    this.resize();
    return node;
  }

  resize() {
    this.style.display = "grid";
    this.style.height = "100%";
    this.style.width = "100%";
    this.style.overflow = "hidden";

    // Set up tracks for children
    const tracks = this.children
      .map((child, index) => {
        if (child.is<PaneNode | PaneHandle | PaneLeaf>("PaneNode", "PaneHandle", "PaneLeaf")) {
          return `[line${index}] ${child.sizing}`;
        } else {
          return `[line${index}] auto`;
        }
      })
      .concat([`[line${this.children.length}]`]) // Add end line
      .join(" ");
    if (this.direction == "H") {
      this.style.gridTemplateColumns = tracks;
      this.style.gridTemplateRows = "[start] 100% [end]";
    } else {
      this.style.gridTemplateRows = tracks;
      this.style.gridTemplateColumns = "[start] 100% [end]";
    }

    // Line children up
    this.children.forEach(
      (child, index) => {
        if (this.direction == "H") {
          child.style.gridColumnStart = `line${index}`;
          child.style.gridColumnEnd = `line${index + 1}`;

          child.style.gridRowStart = `start`;
          child.style.gridRowEnd = `end`;
        } else {
          child.style.gridRowStart = `line${index}`;
          child.style.gridRowEnd = `line${index + 1}`;

          child.style.gridColumnStart = `start`;
          child.style.gridColumnEnd = `end`;
        }
      }
    )
    super.resize();
  }
}

class PaneNode extends Pane {
  _type = "PaneNode";
  // 
  // height = width / aspect
  // 
  direction: "V" | "H";
  sizing: string;

  constructor(direction: "V" | "H", sizing: string) {
    super(direction);
    // TODO getter/setter
    this.sizing = sizing;
  }

  resize() {
    super.resize();
  }
}

// Leaf contains multiple tabs
// Leaf can be split (either horizontally/vertically) or merged
// leafs children should be in a tab thingy... so they don't consider theheader part of their space...
// SHOULD only allow split when there are multiple tabs in editor?

class PaneLeaf extends PaneerDOM {
  _type = "PaneLeaf";
  sizing: string;
  tabs: PaneerDOM[];
  header: Header;
  content: PaneerDOM;


  constructor(sizing: string) {
    super();
    this.sizing = sizing;
    this.tabs = [];
    this.header = new Header();

    const contentContainer = new PaneerDOM();
    contentContainer.style.width = "100%";
    contentContainer.style.flex = "1";
    //contentContainer.style.height = "100%";

    this.content = new PaneerDOM();

    this.append(this.header);
    this.append(contentContainer.append(this.content));
  }

  addTab(tab: PaneerDOM): PaneLeaf {
    this.tabs.push(tab);
    if (this.content.children.length < 1) {
      this.content.append(tab);
    }
    this.resize();
    return this;
  }

  resize() {
    this.style.overflow = "hidden";
    this.style.border = "2px groove #999999";

    this.style.display = "flex";
    this.style.flexDirection = "column";

    this.content.style.width = "100%";
    this.content.style.height = "100%";
    this.content.style.position = "relative";

    super.resize();
  }
}

class Header extends PaneerDOM {
  parent: PaneLeaf;
  tabs: PaneerDOM;
  buttons: PaneerDOM;
  tabMap: Map<string, PaneerDOM>;

  constructor() {
    super();
    this.tabMap = new Map();

    this.style.width = "100%";
    this.style.display = "flex";
    this.style.flexDirection = "row";
    this.style.justifyContent = "space-between";
    this.style.backgroundColor = "#333333";

    this.tabs = new PaneerDOM();
    this.buttons = new PaneerDOM();

    this.append(this.tabs);
    this.append(this.buttons);

    this.tabs.style.display = "flex";
    this.tabs.style.flexDirection = "row";
  }

  maybeMakeTab(child: PaneerDOM) {
    const id = child.id;
    if (!this.tabMap.has(id)) {
      const dom = new PaneerDOM(div({}, [], {
        click: () => {
          if (this.parent.content.children.length == 0) {
            this.parent.content.append(child);
          } else if (id != this.parent.content.children[0].id) {
            this.parent.content.remove(this.parent.content.children[0]);
            this.parent.content.append(child);
          }
          this.parent.resize();
        }
      }));
      this.tabMap.set(id, dom);
      this.tabs.append(dom);

      dom.style.padding = "2px";
      dom.style.width = "min-content";
      dom.style.borderLeft = "1px solid #333333";
      dom.style.borderRight = "1px solid #333333";
      dom.style.borderTop = "1px solid #333333";
      dom.style.borderTopRightRadius = "2px";
      dom.style.borderTopLeftRadius = "2px";
      dom.style.cursor = "select";
      dom.style.userSelect = "none";
    }
  }

  resize() {
    this.parent.tabs.forEach(child => {
      const id = child.id;
      this.maybeMakeTab(child);
      const tab = this.tabMap.get(id);

      if (!tab) {
        return;
      }

      tab.element.textContent = child.label;
      if (child.id != this.parent.content.children[0].id) {
        tab.style.backgroundColor = "#999999";
        tab.style.borderBottom = "1px solid black";
      } else {
        tab.style.backgroundColor = "white";
      }
    });
  }
}

type DragState = { state: "null" } | { state: "dragging", startPoint: paper.Point, lastPoint: paper.Point };

class PaneHandle extends PaneerDOM {
  _type = "PaneHandle";
  mouseover: boolean;
  dragState: DragState;
  parent: Pane;
  sizing: string;

  constructor() {
    super();
    this.sizing = "4px";
    this.mouseover = false;
    this.dragState = { state: "null" };
    this.mousedragging = this.mousedragging.bind(this);
    this.mouseup = this.mouseup.bind(this);

    this.element.addEventListener("mouseenter", () => {
      this.mouseover = true;
      this.setStyles();
    });
    this.element.addEventListener("mouseleave", () => {
      this.mouseover = false
      this.setStyles();
    });

    this.element.addEventListener("mousedown", (e: MouseEvent) => {
      // Convert to pixel sizing.
      this.parent.children.forEach(child => {
        const rect = child.element.getBoundingClientRect();
        const pixelSize = this.parent.direction == "H" ? rect.width : rect.height;
        if (child.is<PaneNode | PaneLeaf>("PaneNode", "PaneLeaf")) {
          child.sizing = `${pixelSize}fr`;
        }
      });

      this.parent.resize();

      this.dragState = {
        state: "dragging",
        startPoint: new paper.Point(e.screenX, e.screenY),
        lastPoint: new paper.Point(e.screenX, e.screenY)
      };

      window.addEventListener("mousemove", this.mousedragging);
      window.addEventListener("mouseup", this.mouseup);
    });
  }

  resize() {
    this.setStyles();
  }

  setStyles() {
    this.style.height = "100%";
    this.style.overflow = "hidden";
    if (this.mouseover) {
      this.style.border = "2px solid #0099ff";
      if (this.parent?.direction == "H") {
        this.style.cursor = "col-resize";
      } else {
        this.style.cursor = "row-resize";
      }
    } else {
      this.style.border = "2px solid white"
    }
  }

  mousedragging(e: MouseEvent) {
    if (this.dragState.state == "null") {
      window.removeEventListener("mousemove", this.mousedragging);
      window.removeEventListener("mouseup", this.mouseup);
      return;
    }

    const previous = this.previous;
    const next = this.next;

    if (!previous
      || !next
      || !next.is<PaneNode | PaneLeaf>("PaneNode", "PaneLeaf")
      || !previous.is<PaneNode | PaneLeaf>("PaneNode", "PaneLeaf")) {
      console.warn("Improper pane nodes.", next, previous);
      window.removeEventListener("mousemove", this.mousedragging);
      window.removeEventListener("mouseup", this.mouseup);
      return;
    }

    const currentPoint = new paper.Point(e.screenX, e.screenY);
    const delta = currentPoint.subtract(this.dragState.lastPoint);

    const prevRect = previous.element.getBoundingClientRect();
    const nextRect = next.element.getBoundingClientRect();

    if (this.parent?.direction == "H") {
      const prevSize = prevRect.width + delta.x;
      const nextSize = nextRect.width - delta.x;

      previous.sizing = `${prevSize}fr`;
      next.sizing = `${nextSize}fr`;
    } else {
      const prevSize = prevRect.height + delta.y;
      const nextSize = nextRect.height - delta.y;
      previous.sizing = `${prevSize}fr`;
      next.sizing = `${nextSize}fr`;
    }

    this.parent.resize();

    this.dragState = { ...this.dragState, lastPoint: currentPoint };
  }

  mouseup(event: MouseEvent) {
    this.dragState = { state: "null" };
    window.removeEventListener("mousemove", this.mousedragging);
    window.removeEventListener("mouseup", this.mouseup);
  }
}