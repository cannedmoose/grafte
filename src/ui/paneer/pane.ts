import * as paper from "paper";
import { PaneerDOM, isAny } from "./paneerdom";
import { ButtonGrid } from "./buttongrid";

// Root node
export class Pane extends PaneerDOM implements Directed {
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

  addPane(direction: "V" | "H", sizing: string): PaneNode {
    // adds a pane and returns it
    if (this.descendent(isAny)) {
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
    if (this.descendent(isAny)) {
      // Add resize handle
      this.append(new PaneHandle());
    }
    const node = new PaneLeaf(sizing);
    this.append(node);
    this.resize();
    return node;
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
}

class PaneNode extends Pane implements Sized {
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
}

// PaneLeaf actually holds tabs...
class PaneLeaf extends PaneerDOM implements Sized {
  sizing: string;
  resizable = true;
  header: Header;
  content: PaneerDOM;

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

    this.tabContainer = new PaneerDOM();
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

    this.append(this.tabContainer);
    this.append(buttonContainer);

    this.tabContainer.style = { display: "flex", flexDirection: "row" };
  }
}

export class LeafTab extends PaneerDOM {
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
      [...directedAncestor.descendents(isSized, 1)].forEach(child => {
        const rect = child.element.getBoundingClientRect();
        const pixelSize = directedAncestor.direction == "H" ? rect.width : rect.height;
        if (child.resizable) {
          child.sizing = `${pixelSize}fr`;
        }
      })

      directedAncestor.resize();

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

export class DragBoss extends PaneerDOM {
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

interface Tab extends PaneerDOM {
  pane: PaneerDOM;
}

function isTab(el: PaneerDOM): el is Tab {
  return el && !!(el as Tab).pane;
}

interface TabContainer extends PaneerDOM {
  tabContent?: PaneerDOM;
  removeTab(tab: LeafTab): void;
  addTab(tab: LeafTab): void;
}

function isTabContainer(el: PaneerDOM): el is TabContainer {
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
}

function isDirected(e: PaneerDOM): e is Directed {
  return e && !!(e as Directed).direction;
}