import * as paper from "paper";
import { PaneerDOM } from "../../paneer/paneerdom";
import { PPaneer, Paneer, style, isPaneer, isAttached, AttachedPaneer } from "../../paneer/newPaneer";

export interface NewTab extends PPaneer {
  tab: true;

  label: string;
  resize?(): void;
}

export function isTab(el: any): el is NewTab {
  return el && el.tab;
}

interface Directed extends PPaneer {
  directed: true;
  direction: "H" | "V";
  flexSizeChildren(): void;

  resize(): void;
}

function isDirected(e: any): e is Directed {
  return e && e.directed;
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
  return el && !!el.flexsized && isAttached(el);
}

function isFixSized(el: any): el is FixedSized & AttachedPaneer {
  return el && !!el.fixedsized;
}

function isSized(el: any): el is (FlexSized | FixedSized) & AttachedPaneer {
  return isFixSized(el) || (isFlexSized(el));
}
/**
 * Root node for panes.
 */
export class Pane extends PPaneer implements Directed {
  directed: true = true;
  direction: "V" | "H";
  addHandles: boolean;

  constructor(direction: "V" | "H", addHandles: boolean = true) {
    // TODO(P1) add an overlay for drag/drop and menus.
    super();
    this.direction = direction;
    this.addHandles = addHandles;
  }

  attached(el: HTMLElement) {
    // TODO(P3) handle non-sized children nicely
    // Set Styles
    style(el,
      {
        display: "grid",
        height: "100%",
        width: "100%",
        overflow: "hidden"
      });

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
        next.remove();
      } else if (prev) {
        prev.remove();
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
  fixedsized:true = true;
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

/*export class DragBoss extends PaneerDOM implements DragCoordinator {
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
}*/


/*export class LeafTab extends PaneerDOM implements Tab {
  pane: PaneerDOM;
  dragState?: DragState;

  constructor(pane: PaneerDOM) {
    super();
    this.pane = pane;
    this.element.textContent = pane.label;

    this.mouseDown = this.mouseDown.bind(this);
    this.mouseMove = this.mouseMove.bind(this);
    this.mouseUp = this.mouseUp.bind(this);

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

    this.element.addEventListener("mousedown", this.mouseDown);
  }

  resize() {
    const leaf = this.ancestor(isTabContainer);
    if (leaf && this.pane == leaf.tabContent) {
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

    const boss = this.ancestor(isDragCoordinator);
    const leaf = this.ancestor(isTabContainer);

    if (!boss) {
      return;
    }

    // Note leaf moving only happens on first drag
    if (leaf) {
      boss.dropTarget = leaf;
      leaf.removeTab(this);
      leaf.resize();
    }

    boss.dragPreview.append(this);
    const domRect = this.element.getBoundingClientRect();

    this.style = {
      position: "absolute",
      top: `${event.clientY - domRect.height / 2}px`,
      left: `${event.clientX - domRect.width / 2}px`,
      border: '2px solid #0099ff',
      backgroundColor: "white"
    }
  }

  mouseUp(event: MouseEvent) {
    window.removeEventListener("mousemove", this.mouseMove);
    window.removeEventListener("mouseup", this.mouseUp);

    if (!this.dragState || this.dragState.state != "dragging") {
      const leaf = this.ancestor(isTabContainer);

      if (!leaf) {
        return;
      }

      leaf.tabContent = this.pane;
      leaf.resize();
    } else if (this.dragState && this.dragState.state == "dragging") {
      const boss = this.ancestor(isDragCoordinator);
      if (boss && boss.dropTarget && isTabContainer(boss.dropTarget)) {
        boss.dropTarget.addTab(this);
      } else {
        // TODO HANDLE CASE WHERE WE ARE NOT OVER A DROP TARGET properly
      }
      this.style = {
        position: '', top: '', left: '',
        borderLeft: "1px solid #333333",
        borderRight: "1px solid #333333",
        borderTop: "1px solid #333333",
        borderTopRightRadius: "2px",
        borderTopLeftRadius: "2px"
      };
    }

    this.dragState = undefined;
  }
}*/
