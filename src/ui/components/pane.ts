import * as paper from "paper";
import { PaneerDOM, isAny } from "../paneer/paneerdom";
import { ButtonGrid } from "./buttongrid";
import { NewPane } from "../newpane";


interface DragCoordinator extends PaneerDOM {
  // IS THERE A WAY TO RESTRICT TO ONE CHILD?
  // DO WE LET elements put their own preview on?
  dragPreview: PaneerDOM;
  dropTarget?: PaneerDOM;
}

function isDragCoordinator(el: PaneerDOM): el is DragCoordinator {
  const test = el as DragCoordinator;
  return test && test.dragPreview ? true : false;
}

export interface Tab extends PaneerDOM {
  pane: PaneerDOM;
}

export function isTab(el: PaneerDOM): el is Tab {
  return el && !!(el as Tab).pane;
}

export interface TabContainer extends Sized {
  tabContent?: PaneerDOM;
  removeTab(tab: Tab): void;
  addTab(tab: Tab): void;
}

export function isTabContainer(el: PaneerDOM): el is TabContainer {
  const e = el as TabContainer;
  return e && e.removeTab != null && e.addTab != null;
}


interface Sized extends PaneerDOM {
  sizing: string;
  resizable: boolean;
}

function isSized(e: PaneerDOM): e is Sized {
  const s = (e as Sized);
  return s.sizing !== undefined && s.resizable != undefined;
}

interface Directed extends PaneerDOM {
  direction: "H" | "V";
  extend(child: Sized, after?: PaneerDOM): void;
  dextend(child: PaneerDOM): void;
  frSize(): void;
}

function isDirected(e: PaneerDOM): e is Directed {
  return e && !!(e as Directed).direction && !!(e as Directed).extend;
}

export interface Serializable extends PaneerDOM {
  serialize(): { type: string };
}

export function isSerializable(e: PaneerDOM): e is Serializable {
  return e && !!(e as Serializable).serialize;
}

// Root node
export class Pane extends PaneerDOM implements Directed, Serializable {
  // TODO(P2) handle all children being deleted...
  direction: "V" | "H";

  constructor(direction: "V" | "H") {
    super();

    this.direction = direction;

    this.style = {
      display: "grid",
      height: "100%",
      width: "100%",
      overflow: "hidden"
    }
  }

  extend(child: Sized, after?: PaneerDOM) {
    // adds a pane and returns it
    const needsHandle = !!this.descendent(isAny);
    if (needsHandle && !after) {
      // Add resize handle
      this.append(new PaneHandle());
    }

    if (after) {
      after.insert(child);
    } else {
      this.append(child);
    }

    if (needsHandle && after) {
      // Add resize handle
      after.insert(new PaneHandle());
    }
    this.resize();
  }

  dextend(child: PaneerDOM) {
    const next = child.next(isSized);
    const prev = child.previous(isSized);

    if (next) {
      this.remove(next);
    } else if (prev) {
      this.remove(prev);
    }

    this.remove(child);
    this.resize();
  }

  addPane(direction: "V" | "H", sizing: string): PaneNode {
    const node = new PaneNode(direction, sizing);
    this.extend(node);
    return node;
  }

  addLeaf(sizing: string): PaneLeaf {
    const node = new PaneLeaf(sizing);
    this.extend(node);
    return node;
  }

  frSize() {
    [...this.descendents(isSized, 1)].forEach(child => {
      const rect = child.element.getBoundingClientRect();
      const pixelSize = this.direction == "H" ? rect.width : rect.height;
      if (child.resizable) {
        child.sizing = `${pixelSize}fr`;
      }
    })
  }

  resize() {
    // Set up tracks for children
    const children = [...this.descendents(isSized, 1)];
    const tracks = children
      .map((child, index) => {
        if (isSized(child)) {
          return `[line${index}] ${child.sizing}`;
        } else {
          return `[line${index}] auto`;
        }
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
      }
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
    super.resize();
  }

  serialize() {
    return {
      type: "pane",
      direction: this.direction,
      children: [...this.descendents(isSerializable, 1)].map(child => child.serialize())
    };
  }

  static deserialize(raw: any, deserializer: (raw: { type: string }) => any): Pane {
    const node = new Pane(raw.direction);
    raw.children
      .map(deserializer)
      .forEach((pane: Sized) => node.extend(pane));
    return node;
  }
}

export class PaneNode extends Pane implements Sized {
  // 
  // height = width / aspect
  // 
  direction: "V" | "H";
  sizing: string;
  resizable = true;

  constructor(direction: "V" | "H", sizing: string) {
    super(direction);
    this.sizing = sizing;
  }

  serialize() {
    return {
      ...super.serialize(),
      type: "node",
      sizing: this.sizing
    };
  }

  static deserialize(raw: any, deserializer: (raw: { type: string }) => any): PaneNode {
    const node = new PaneNode(raw.direction, raw.sizing);
    raw.children
      .map(deserializer)
      .forEach((pane: Sized) => node.extend(pane));
    return node;
  }
}

// TODO Paneleaf has most of the logic maybe take this out to another class
export class PaneLeaf extends PaneerDOM implements Sized, TabContainer, Serializable {
  sizing: string;
  resizable = true;
  header: Header;
  content: PaneerDOM;

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
      overflow: "hidden"
    };

    this.append(this.header);
    this.append(contentContainer.append(contentContainer2.append(this.content)));

    this.element.addEventListener("mouseenter", () => {
      const boss = this.ancestor(isDragCoordinator);
      if (boss && boss.dragPreview.descendent(isAny)) {
        this.style = { border: "4px solid #0099ff" };
        boss.dropTarget = this;
      }
    });

    this.element.addEventListener("mouseleave", () => {
      this.style = { border: "2px groove #999999" };
      // Let next element reset drop target.
    })
  }

  get tabContent(): PaneerDOM | undefined {
    return this.content.descendent(isAny);
  }

  set tabContent(dom: PaneerDOM | undefined) {
    const content = this.content.descendent(isAny);
    if (content) {
      this.content.remove(content);
    }
    if (dom) {
      this.content.append(dom);
    }
  }

  addTab(tab: Tab): PaneLeaf {
    this.header.tabContainer.append(tab);
    if (!this.tabContent) {
      this.tabContent = tab.pane;
    }
    this.resize();
    return this;
  }

  removeTab(tab: Tab) {
    this.header.tabContainer.remove(tab);
    if (this.tabContent && this.tabContent.id == tab.pane.id) {
      this.tabContent = this.descendent(isTab)?.pane;
    }
  }

  serialize() {
    const panes =
      [...this.header.tabContainer.descendents(isTab)]
        .map(tab => tab.pane)
        .filter(isSerializable)
        .map(s => s.serialize());
    return {
      type: "leaf",
      sizing: this.sizing,
      panes
    };
  }

  static deserialize(raw: any, deserializer: (raw: { type: string }) => any): PaneLeaf {
    const leaf = new PaneLeaf(raw.sizing);
    raw.panes
      .map(deserializer)
      .forEach((pane: PaneerDOM) => {
        leaf.addTab(new LeafTab(pane))
      });
    return leaf;
  }
}

class Header extends PaneerDOM {
  tabContainer: PaneerDOM;
  buttons: ButtonGrid;

  constructor() {
    super();

    this.style = {
      width: "100%",
      display: "flex", flexDirection: "row",
      justifyContent: "space-between",
      backgroundColor: "#333333",
    };

    this.split = this.split.bind(this);

    this.tabContainer = new PaneerDOM();
    this.buttons = new ButtonGrid({ aspectRatio: 1, width: "1.4em" });
    this.buttons.add({
      alt: "Horizontal Split", icon: "icons/hsplit.svg", onClick: () => {
        this.split("H");
      }
    });
    this.buttons.add({
      alt: "Vertical Split", icon: "icons/vsplit.svg", onClick: () => {
        this.split("V");
      }
    });
    this.buttons.add({
      alt: "New Pane", icon: "icons/plus.svg", onClick: () => {
        this.newTab();
      }
    });
    this.buttons.add({
      alt: "Close", icon: "icons/cross.svg", onClick: () => {
        this.close();
      }
    });
    this.buttons.style = { minWidth: `${1.4*4}em` };

    const buttonContainer = new PaneerDOM().append(this.buttons);
    buttonContainer.style = { flexBasis: "content" };

    this.append(this.tabContainer);
    this.append(buttonContainer);

    this.tabContainer.style = { display: "flex", flexDirection: "row", maxHeight:"1.5em", overflow: "hidden" };
  }

  split(direction: "H" | "V") {
    const directedAncestor = this.Ancestor(isDirected);
    directedAncestor.frSize();
    const containerAncestor = this.Ancestor(isTabContainer);
    const bounds = containerAncestor.element.getBoundingClientRect();
    const splitSize = direction == "H" ? `${bounds.width / 2}fr` : `${bounds.height / 2}fr`;
    if (directedAncestor.direction == direction) {
      directedAncestor.extend(new PaneLeaf(splitSize), containerAncestor);
      containerAncestor.sizing = splitSize;
    } else {
      const node = new PaneNode(direction, containerAncestor.sizing);
      containerAncestor.replace(node);
      node.extend(containerAncestor);
      node.extend(new PaneLeaf(splitSize));
      containerAncestor.sizing = splitSize;
      directedAncestor.resize();
    }
  }

  close() {
    let directedAncestor = this.Ancestor(isDirected);
    const containerAncestor = this.Ancestor(isTabContainer);

    directedAncestor.dextend(containerAncestor);
    while (!directedAncestor.descendent(isSized)) {
      const nn = directedAncestor.Ancestor(isDirected);
      nn.dextend(directedAncestor);
      directedAncestor = nn;
    }
  }

  newTab() {
    const containerAncestor = this.Ancestor(isTabContainer);
    const pane= new NewPane();
    containerAncestor.addTab(new LeafTab(pane));

    containerAncestor.tabContent = pane;
    containerAncestor.resize();
  }
}

export class LeafTab extends PaneerDOM implements Tab {
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
}

type DragState = { state: "null" } | { state: "dragging", startPoint: paper.Point, lastPoint: paper.Point };

class PaneHandle extends PaneerDOM implements Sized {
  mouseover: boolean;
  dragState: DragState;
  sizing = "4px";
  resizable = false;

  constructor() {
    super();
    this.dragState = { state: "null" };

    this.mousedragging = this.mousedragging.bind(this);
    this.mouseup = this.mouseup.bind(this);

    this.style = { height: "100%", overflow: "hidden" };

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
      directedAncestor.frSize();
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

    const previous = this.previous(isSized);
    const next = this.next(isSized);

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

      previous.sizing = `${prevSize}fr`;
      next.sizing = `${nextSize}fr`;
    } else {
      const prevSize = prevRect.height + delta.y;
      const nextSize = nextRect.height - delta.y;
      previous.sizing = `${prevSize}fr`;
      next.sizing = `${nextSize}fr`;
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

export class DragBoss extends PaneerDOM implements DragCoordinator {
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