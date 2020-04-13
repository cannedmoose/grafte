import * as paper from "paper";
import { PaneerDOM } from "./paneerdom";
import { div } from "../utils/dom";

// Root node
export class Pane extends PaneerDOM {
  _type = "PaneRoot";
  direction: "V" | "H";

  constructor(direction: "V" | "H") {
    super(div({}, []));

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

  addLeaf(child: PaneerDOM, sizing: string): PaneLeaf {
    // adds a pane and returns it
    if (this.children.length > 0) {
      // Add resize handle
      this.append(new PaneHandle());
    }
    const node = new PaneLeaf(child, sizing);
    this.append(node);
    this.resize();
    return node;
  }

  resize() {
    this.element.style.display = "grid";
    this.element.style.height = "100%";
    this.element.style.width = "100%";
    this.element.style.overflow = "hidden";

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
      this.element.style.gridTemplateColumns = tracks;
      this.element.style.gridTemplateRows = "[start] 100% [end]";
    } else {
      this.element.style.gridTemplateRows = tracks;
      this.element.style.gridTemplateColumns = "[start] 100% [end]";
    }

    // Line children up
    this.children.forEach(
      (child, index) => {
        if (this.direction == "H") {
          child.element.style.gridColumnStart = `line${index}`;
          child.element.style.gridColumnEnd = `line${index + 1}`;

          child.element.style.gridRowStart = `start`;
          child.element.style.gridRowEnd = `end`;
        } else {
          child.element.style.gridRowStart = `line${index}`;
          child.element.style.gridRowEnd = `line${index + 1}`;

          child.element.style.gridColumnStart = `start`;
          child.element.style.gridColumnEnd = `end`;
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

class PaneLeaf extends PaneerDOM {
  _type = "PaneLeaf";
  sizing: string;

  constructor(child: PaneerDOM, sizing: string) {
    super(div({}, []));
    this.sizing = sizing;
    this.append(child);
  }

  resize() {
    this.element.style.overflow = "hidden";
    this.element.style.border = "2px groove #999999";
    super.resize();
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
    super(div({}, []));
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
    this.element.style.height = "100%";
    this.element.style.overflow = "hidden";
    if (this.mouseover) {
      this.element.style.border = "2px solid #0099ff";
      if (this.parent?.direction == "H") {
        this.element.style.cursor = "col-resize";
      } else {
        this.element.style.cursor = "row-resize";
      }
    } else {
      this.element.style.border = "2px solid white"
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