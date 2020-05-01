import * as paper from "paper";
import { PPaneer, Paneer, isPaneer, isAttached, AttachedPaneer } from "../../paneer/newPaneer";

export interface Tab extends PPaneer {
  tab: true;

  label: string;
  resize?(): void;
}

export function isTab(el: any): el is Tab {
  return el && (el as Tab).tab;
}

interface Directed extends PPaneer {
  directed: true;
  direction: "H" | "V";
  flexSizeChildren(): void;

  resize(): void;
}

function isDirected(e: any): e is Directed {
  return e && (e as Directed).directed;
}

export interface FlexSized extends PPaneer {
  flexsized: true;

  size: string;
  resize?(): void;
}

interface FixedSized extends PPaneer {
  fixedsized: true;
  size: string;
}

function isFlexSized(el: any): el is FlexSized & AttachedPaneer {
  return el && (el as FlexSized).flexsized && isAttached(el);
}

function isFixSized(el: any): el is FixedSized & AttachedPaneer {
  return el && (el as FixedSized).fixedsized && isAttached(el);
}

function isSized(el: any): el is (FlexSized | FixedSized) & AttachedPaneer {
  return isFixSized(el) || (isFlexSized(el));
}

export interface TabContainer extends PPaneer {
  tabcontainer: true;
  currentTab: Tab | undefined;

  addTab(tab: Tab): void;
  removeTab(tab: Tab): void;
}

export function isTabContainer(el: any): el is TabContainer {
  return el && (el as TabContainer).tabcontainer;
}

/**
 * Root node for panes.
 */
export class Pane extends PPaneer implements Directed {
  directed: true = true;
  direction: "V" | "H";
  addHandles: boolean;

  constructor(direction: "V" | "H", addHandles: boolean = true) {
    super();
    this.direction = direction;
    this.addHandles = addHandles;
  }

  attached() {
    // TODO(P3) handle non-sized children nicely
    // Set Styles
    this.style = {
      display: "grid",
      height: "100%",
      width: "100%",
      overflow: "hidden"
    };

    // Add handles to children.
    if (this.addHandles) {
      this.children(isFlexSized).forEach(child => {
        child.insertAdjacant(new PaneHandle());
      });
    }

    // Resize
    this.resize();
  }

  insert(child: FlexSized, after: PPaneer) {
    // Make sure everything is attached
    if (!isAttached(this) || !isAttached(child) || !isAttached(after)) return;

    // Make sure insertion point is one of our children
    if (after.Ancestor(isPaneer).id === this.id) return;

    after.insertAdjacant(child);
    if (this.addHandles) {
      // Add resize handle
      after.insertAdjacant(new PaneHandle());
    }
    this.resize();
  }

  append<T extends AttachedPaneer>(child: T) {
    // Can only append sized children
    if (!isSized(child)) return;

    if (this.addHandles && isFlexSized(child)) {
      super.append(new PaneHandle());
    }
    super.append(child);
  }

  removeChild(child: FlexSized | FixedSized) {
    if (!isAttached(child)) return;
    if (child.Ancestor(isPaneer).id === this.id) return;

    if (this.addHandles) {
      const next = child.next(isFixSized);
      const prev = child.previous(isFixSized);

      if (next) {
        next.remove(true);
      } else if (prev) {
        prev.remove(true);
      }
    }

    child.remove();
    this.resize();
  }

  flexSizeChildren() {
    this.children(isFlexSized).forEach(child => {
      const rect = child.element.getBoundingClientRect();
      const pixelSize = this.direction == "H" ? rect.width : rect.height;
      child.size = `${pixelSize}fr`;
    })
  }

  resize() {
    // Set up tracks for children
    const children = this.children(isSized);
    const tracks = children
      .map((child, index) => {
        return `[line${index}] ${child.size}`;
      })
      .concat([`[line${children.length}]`]) // Add end line
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
      };
    }

    // Line children up
    children.forEach(
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

    this.children(isFlexSized).forEach(child => {
      if (child.resize) child.resize();
    })
  }
}

/**
 * A Non leaf, non root pane.
 */
export class PaneNode extends Pane implements FlexSized {
  flexsized: true = true;

  direction: "V" | "H";
  size: string;

  constructor(direction: "V" | "H", size: string) {
    super(direction);
    this.size = size;
  }
}

type DragState = { state: "null" } | { state: "dragging", startPoint: paper.Point, lastPoint: paper.Point };
/**
 * A Handle for dragging a pane.
 */
class PaneHandle extends AttachedPaneer implements FixedSized {
  fixedsized: true = true;
  mouseover: boolean;
  dragState: DragState;
  size = "4px";

  constructor() {
    super(Paneer/*html*/`<div ${{ height: "100%", overflow: "hidden" }}></div>`);
    this.dragState = { state: "null" };

    this.mousedragging = this.mousedragging.bind(this);
    this.mouseup = this.mouseup.bind(this);

    this.element.ondragstart = function () {
      return false;
    };

    this.element.addEventListener("mouseenter", () => {
      this.style = {
        border: "2px solid #0099ff",
        cursor: this.Ancestor(isDirected).direction == "H" ? "col-resize" : "row-resize"
      };
    });

    this.element.addEventListener("mouseleave", () => {
      this.style = { border: "2px solid white" };
    });

    this.element.addEventListener("mousedown", (e: MouseEvent) => {
      // Convert to pixel sizing.
      const directedAncestor = this.Ancestor(isDirected);
      directedAncestor.flexSizeChildren();
      this.dragState = {
        state: "dragging",
        startPoint: new paper.Point(e.screenX, e.screenY),
        lastPoint: new paper.Point(e.screenX, e.screenY)
      };

      window.addEventListener("mousemove", this.mousedragging);
      window.addEventListener("mouseup", this.mouseup);
    });
  }

  mousedragging(e: MouseEvent) {
    if (this.dragState.state == "null") {
      window.removeEventListener("mousemove", this.mousedragging);
      window.removeEventListener("mouseup", this.mouseup);
      return;
    }

    const previous = this.previous(isFlexSized);
    const next = this.next(isFlexSized);

    if (!previous || !next) {
      console.log("Improper pane nodes.", next, previous);
      window.removeEventListener("mousemove", this.mousedragging);
      window.removeEventListener("mouseup", this.mouseup);
      return;
    }


    const currentPoint = new paper.Point(e.screenX, e.screenY);
    const delta = currentPoint.subtract(this.dragState.lastPoint);

    const directedAncestor = this.Ancestor(isDirected);

    const prevRect = previous.element.getBoundingClientRect();
    const nextRect = next.element.getBoundingClientRect();

    if (directedAncestor.direction == "H") {
      const prevSize = prevRect.width + delta.x;
      const nextSize = nextRect.width - delta.x;

      previous.size = `${prevSize}fr`;
      next.size = `${nextSize}fr`;
    } else {
      const prevSize = prevRect.height + delta.y;
      const nextSize = nextRect.height - delta.y;
      previous.size = `${prevSize}fr`;
      next.size = `${nextSize}fr`;
    }

    directedAncestor.resize();

    this.dragState = { ...this.dragState, lastPoint: currentPoint };
  }

  mouseup(event: MouseEvent) {
    this.dragState = { state: "null" };
    window.removeEventListener("mousemove", this.mousedragging);
    window.removeEventListener("mouseup", this.mouseup);
  }
}
