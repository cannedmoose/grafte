import * as paper from "paper";
import { v4 as uuidv4 } from 'uuid';

export type NodeDirection = "Horizontal" | "Vertical";

export type Paneer = PaneerNode | PaneerLeaf | PaneerDOM;

const PANEER_ID_ATTRIB = "data-paneer-id";
// TODO(P3) maybe this shouldn't be global...
let NodeMap: Map<string, Paneer> = new Map();

function elementToPaneer(element: Element | null): Paneer | undefined {
  if (!element) {
    return undefined;
  }
  const id = element.getAttribute(PANEER_ID_ATTRIB);
  if (!id) {
    return undefined;
  }
  return NodeMap.get(id);
}

interface Pane {
  element: HTMLElement;

  // TODO(P3) currently passing leaf so we can hook into resize to set styles
  // consider doing this another way
  resize?(paneer: PaneerLeaf): void;
}

/**
 * Dom interface for Paneer, creates dom element and links it to a paneer node.
 */
class PaneerDOM implements Pane {
  _type = "DOM";
  // TODO(P2) add border here (so we can have sections)

  private _element: HTMLElement;
  private _id: string;

  // Sizing for this element
  // NOTE is just a track value for css grid.
  private _sizing: string;

  constructor(sizing: string) {
    this._element = document.createElement("div");
    this._id = uuidv4();
    this._element.setAttribute(PANEER_ID_ATTRIB, this._id);
    NodeMap.set(this._id, this);

    this._sizing = sizing;
  }

  get element(): HTMLElement {
    return this._element;
  }

  get parent(): PaneerNode | undefined {
    if (this._element.parentElement) {
      return elementToPaneer(this._element.parentElement) as PaneerNode;
    }
    else {
      return undefined;
    }
  }

  // TODO(P1) maybe move sizing back into node... doesn't really have anything to do with DOM
  get sizing(): string {
    return this._sizing;
  }
  
  set sizing(sizing: string) {
    this._sizing = sizing;
    window.requestAnimationFrame(() => this.parent?.resize());
  }

  delete() {
    const parent = this.parent;
    if (parent) {
      parent.remove(this);
    }
    NodeMap.delete(this._id);
  }

  resize() { }
}

export class PaneerNode extends PaneerDOM {
  _type = "Node";

  // Direction this Nodes child elements are arranged in
  // NOTE the element takes up all available space in this direction
  private _direction: NodeDirection;

  // Whether to have resize handles
  private _resizable: boolean;

  constructor(direction: NodeDirection, sizing: string = "1fr", resizable: boolean = true, children?: Paneer[]) {
    super(sizing);

    this._direction = direction;
    this._resizable = resizable;

    if (children) this.appendAll(children);
  }

  get children(): Paneer[] {
    const children: Paneer[] = [];
    for (let i = 0; i < this.element.children.length; i++) {
      const childId = this.element.children[i].getAttribute(PANEER_ID_ATTRIB);
      if (childId) {
        const child = NodeMap.get(childId);
        if (child) {
          children.push(child);
        }
      }
    }
    return children;
  }

  get direction(): NodeDirection {
    return this._direction;
  }

  set direction(direction: NodeDirection) {
    this._direction = direction;
    this.resize();
  }

  // TODO(P1) Remove child, for layers.
  append(child : Paneer) {
    this.appendAll([child]);
  }

  appendAll(children: Paneer[]) {
    if (this._resizable) {
      for (let i = 1; i < children.length; i += 2) {
        children.splice(i, 0, new PaneerHandle());
      }
    }

    children.forEach(
      child => {
        this.element.appendChild(child.element);
      }
    );

    this.resize();
  }

  remove(child: Paneer) {
    // TODO(P2) handle resize handles
    this.element.removeChild(child.element);
    this.resize();
  }

  resize() {
    this.element.style.display = "grid";
    this.element.style.height = "100%";

    // Set up tracks for children
    const tracks = this.children
      .map((child, index) => `[line${index}] ${child.sizing}`)
      .concat([`[line${this.children.length}]`]) // Add end line
      .join(" ");
    if (this.direction == "Horizontal") {
      this.element.style.gridTemplateColumns = tracks;
      this.element.style.gridTemplateRows = "[start] 100% [end]";
    } else {
      this.element.style.gridTemplateRows = tracks;
      this.element.style.gridTemplateColumns = "[start] 100% [end]";
    }

    // Line children up
    this.children.forEach(
      (child, index) => {
        if (this.direction == "Horizontal") {
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

    this.children.forEach(child => { child.resize(); })
  }
}

export class PaneerLeaf extends PaneerDOM {
  _type = "Leaf";
  // This node in the DOM
  pane: Pane;

  constructor(pane: Pane, sizing: string = "1fr") {
    super(sizing);
    this.pane = pane;
    this.element.appendChild(pane.element);
  }

  resize() {
    this.element.style.height = "100%";
    this.element.style.overflow = "hidden";
    this.element.style.border = "2px outset #999999"
    if (this.pane.resize)
      this.pane.resize(this);
  }
}

type DragState = { state: "null" } | { state: "dragging", startPoint: paper.Point, lastPoint: paper.Point };

class PaneerHandle extends PaneerLeaf {
  _type = "Handle";
  mouseover: boolean;
  dragState: DragState;

  constructor() {
    super({ element: document.createElement("div") }, "4px");
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
      this.parent?.children.forEach(child => {
        const rect = child.element.getBoundingClientRect();
        const pixelSize = this.parent?.direction == "Horizontal" ? rect.width : rect.height;
        if (child._type != "Handle") {
          child.sizing = `${pixelSize}fr`
        }
      });

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
    super.resize();
    this.setStyles();
  }

  setStyles() {
    this.element.style.height = "100%";
    this.element.style.overflow = "hidden";
    if (this.mouseover) {
      this.element.style.border = "2px solid #0099ff";
      if (this.parent?.direction == "Horizontal") {
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

    const previous = elementToPaneer(this.element.previousElementSibling);
    const next = elementToPaneer(this.element.nextElementSibling);

    if (!previous || !next) {
      window.removeEventListener("mousemove", this.mousedragging);
      window.removeEventListener("mouseup", this.mouseup);
      return;
    }

    const currentPoint = new paper.Point(e.screenX, e.screenY);
    const delta = currentPoint.subtract(this.dragState.lastPoint);

    const prevRect = previous.element.getBoundingClientRect();
    const nextRect = next.element.getBoundingClientRect();

    if (this.parent?.direction == "Horizontal") {
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

    this.dragState = { ...this.dragState, lastPoint: currentPoint };
  }

  mouseup(event: MouseEvent) {
    this.dragState = { state: "null" };
    window.removeEventListener("mousemove", this.mousedragging);
    window.removeEventListener("mouseup", this.mouseup);
  }
}