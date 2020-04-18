import * as paper from "paper";
import { PaneerDOM } from "./paneerdom";
import { div, text } from "../utils/dom";
import { ButtonGrid } from "./buttongrid";

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
    this.style = {
      display: "grid",
      height: "100%",
      width: "100%",
      overflow: "hidden"
    }

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
      this.style = {
        gridTemplateColumns: tracks,
        gridTemplateRows: "[start] 100% [end]"
      };
    } else {
      this.style = {
        gridTemplateColumns: "[start] 100% [end]",
        gridTemplateRows: tracks
      }
    }

    // Line children up
    this.children.forEach(
      (child, index) => {
        if (this.direction == "H") {
          child.style = {
            gridColumnStart: `line${index}`,
            gridColumnEnd: `line${index + 1}`,

            gridRowStart: `start`,
            gridRowEnd: `end`
          }
        } else {
          child.style = {
            gridRowStart: `line${index}`,
            gridRowEnd: `line${index + 1}`,

            gridColumnStart: `start`,
            gridColumnEnd: `end`
          }
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
  header: Header;
  content: PaneerDOM;
  parent: PaneNode;

  // TODO figure out serialization/deserialization


  constructor(sizing: string) {
    super();
    this.sizing = sizing;
    this.header = new Header();

    this.style = {
      overflow: "hidden",
      border: "2px groove #999999",
      display: "flex",
      flexDirection: "column"
    }

    const contentContainer = new PaneerDOM();
    contentContainer.style = {
      flex: "1",
      width: "100%"
    }

    const contentContainer2 = new PaneerDOM();
    contentContainer2.style = {
      position: "relative",
      width: "100%",
      height: "100%"
    }

    this.content = new PaneerDOM();
    this.content.style = {
      position: "absolute",
      top: "0",
      bottom: "0",
      left: "0",
      right: "0",
      overflow: "scroll"
    };

    this.append(this.header);
    this.append(contentContainer.append(contentContainer2.append(this.content)));

    this.element.addEventListener("mouseenter", () => {
      let el: PaneerDOM | undefined = this.parent;
      while (el && el._type != "DragBoss") {
        el = el.parent;
      }

      if (!el) {
        return;
      }

      const boss = (el as DragBoss);
      if (boss.dragPreview.children.length > 0) {
        this.style = { border: "4px solid #0099ff" };
        boss.dropTarget = this;
      }
    });

    this.element.addEventListener("mouseleave", () => {
      this.style = { border: "2px groove #999999" };
      let el: PaneerDOM | undefined = this.parent;
      while (el && el._type != "DragBoss") {
        el = el.parent;
      }

      if (!el) {
        return;
      }
      if ((el as DragBoss).dropTarget == this) {
        (el as DragBoss).dropTarget = undefined;
      }
    })
  }

  addTab2(tab: LeafTab): PaneLeaf {
    this.header.addTab(tab);
    tab.leaf = this;
    if (this.content.children.length == 0) {
      this.content.append(tab.pane);
    }
    this.resize();
    return this;
  }

  addTab(tab: PaneerDOM): PaneLeaf {
    this.header.addTab(new LeafTab(this, tab));
    if (this.content.children.length == 0) {
      this.content.append(tab);
    }
    this.resize();
    return this;
  }

  resize() {
    super.resize();
  }
}

class Header extends PaneerDOM {
  parent: PaneLeaf;
  tabs: PaneerDOM;
  buttons: ButtonGrid;

  constructor() {
    super();

    this.style = {
      width: "100%",
      display: "flex", flexDirection: "row",
      justifyContent: "space-between",
      backgroundColor: "#333333",
    };

    this.tabs = new PaneerDOM();
    this.buttons = new ButtonGrid({ aspectRatio: 1, width: "1.4em" });
    this.buttons.add({
      alt: "Horizontal Split", icon: "icons/hsplit.svg", onClick: () => {
      }
    });
    this.buttons.add({
      alt: "Vertical Split", icon: "icons/vsplit.svg", onClick: () => {
      }
    });
    this.buttons.add({
      alt: "Close", icon: "icons/cross.svg", onClick: () => {
        // TODO
        // Figure out how to do remove nicely
        // ALSO SHOULD FIGURE OUT INSERTION WHIlE WERE AT it...
      }
    });
    this.buttons.style = { minWidth: "4.2em" };

    const buttonContainer = new PaneerDOM().append(this.buttons);
    buttonContainer.style = { flexBasis: "content" };

    this.append(this.tabs);
    this.append(buttonContainer);

    this.tabs.style = { display: "flex", flexDirection: "row" };
  }

  addTab(child: LeafTab) {
    this.tabs.append(child);
  }

  resize() {
    super.resize();
  }
}

class LeafTab extends PaneerDOM {
  leaf: PaneLeaf;
  pane: PaneerDOM;
  dragState?: DragState;

  constructor(leaf: PaneLeaf, pane: PaneerDOM) {
    super();

    this.mouseDown = this.mouseDown.bind(this);
    this.mouseMove = this.mouseMove.bind(this);
    this.mouseUp = this.mouseUp.bind(this);

    this.leaf = leaf;
    this.pane = pane;
    this.style = {
      padding: "2px",
      width: "min-content",
      borderLeft: "1px solid #333333",
      borderRight: "1px solid #333333",
      borderTop: "1px solid #333333",
      borderTopRightRadius: "2px",
      borderTopLeftRadius: "2px",
      cursor: "select",
      userSelect: "none"
    }
    this.element.textContent = pane.label;

    this.element.addEventListener("mousedown", this.mouseDown);
  }

  resize() {
    if (this.pane.id == this.leaf.content.children[0].id) {
      this.style = { backgroundColor: "white", borderBottom: "none" };
    } else {
      this.style = { backgroundColor: "#999999", borderBottom: "1px solid black" };
    }
  }

  mouseDown(event: MouseEvent) {
    window.addEventListener("mousemove", this.mouseMove);
    window.addEventListener("mouseup", this.mouseUp);
  }

  mouseMove(event: MouseEvent) {
    this.dragState = {
      state: "dragging",
      startPoint: new paper.Point(event.screenX, event.screenY),
      lastPoint: new paper.Point(event.screenX, event.screenY)
    };

    let el = this.parent;

    while (el && el._type != "DragBoss") {
      el = el.parent;
    }

    if (!el) {
      return;
    }

    const boss = el as DragBoss;
    this.style = {
      position: "absolute",
      top: `${event.clientY}px`,
      left: `${event.clientX}px`
    }
    boss.dragPreview.append(this);

    this.leaf.content.remove(this.pane);
    if (this.leaf.content.children.length == 0 && this.leaf.header.tabs.children.length > 0) {
      this.leaf.content.append((this.leaf.header.tabs.children[0] as LeafTab).pane);
    }
    this.leaf.resize();
  }

  mouseUp(event: MouseEvent) {
    window.removeEventListener("mousemove", this.mouseMove);
    window.removeEventListener("mouseup", this.mouseUp);
    if (!this.dragState || this.dragState.state != "dragging") {
      if (this.leaf.content.children.length == 0) {
        this.leaf.content.append(this.pane);
      } else if (this.pane.id != this.leaf.content.children[0].id) {
        this.leaf.content.remove(this.leaf.content.children[0]);
        this.leaf.content.append(this.pane);
      }
      this.leaf.resize();
    } else if (this.dragState && this.dragState.state == "dragging") {
      let el = this.parent;

      while (el && el._type != "DragBoss") {
        el = el.parent;
      }

      if (!el) {
        return;
      }

      const db = el as DragBoss;
      if (db.dropTarget) {
        const leaf = db.dropTarget as PaneLeaf;
        leaf.addTab2(this);
      }

      this.style = { position: '', top: '', left: '' }

    }

    this.dragState = undefined;
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

    this.element.ondragstart = function () {
      return false;
    };

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
    this.style = { height: "100%", overflow: "hidden" };
    if (this.mouseover) {
      this.style = {
        border: "2px solid #0099ff",
        cursor: this.parent?.direction == "H" ? "col-resize" : "row-resize"
      };
    } else {
      this.style = { border: "2px solid white" };
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

export class DragBoss extends PaneerDOM {
  _type = "DragBoss";

  dragPreview: PaneerDOM;
  rest: PaneerDOM;

  dropTarget?: PaneerDOM;

  constructor() {
    super();

    this.dragPreview = new PaneerDOM();
    this.rest = new PaneerDOM();

    this.rest = new PaneerDOM();
    this.rest.style = {
      width: "100%",
      height: "100%",
      position: "absolute"
    }
    this.append(this.rest);

    this.dragPreview.style = {
      position: "absolute",
      width: "100%",
      height: "100%",
      pointerEvents: "none"
    }

    this.append(this.dragPreview);
  }
}

interface Draggable {
  // The actual item being dragged
  item: PaneerDOM;

  // What is shown in the drag preview layer
  preview: PaneerDOM;

  // Called when item is dropped
  // How do we re-arrange items so it fits properly in dom..
  onDrop(droppable: Droppable): void;

  onEnter(droppable: Droppable): void;
  onLeave(droppable: Droppable): void;
};

interface Droppable {
  accepts(draggable: Draggable): boolean;

  onEnter(draggable: Draggable): void;
  onLeave(draggable: Draggable): void;
}

/**
 * Root element is Drag Boss (coordinates dragging)
 *
 * Tabs are draggable
 * Leaves are droppable
 *
 * Handles are draggable?
 * Root node is droppable?
 */