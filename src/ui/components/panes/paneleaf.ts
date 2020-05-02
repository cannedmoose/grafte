import { Paneer, AttachedPaneer, isAttached } from "../../paneer/paneer";
import { FlexSized, Tab, isTab, TabContainer, isTabContainer, isDirected, Pane, PaneNode, isSized } from "./pane";
import { isOverlay } from "./dragoverlay";
import { AppendPan, Pan } from "../../paneer/template";
import { ToolTip } from "../tooltip";

export class PaneLeaf extends Paneer implements FlexSized, TabContainer {
  flexsized: true = true;
  tabcontainer: true = true;

  size: string;

  tabLabels: AttachedPaneer;
  content: AttachedPaneer;

  tabs: Tab[];
  selectedIndex: number;

  clickedTab?: Tab;

  constructor(size: string) {
    super();
    this.size = size;

    this.onTabMouseMove = this.onTabMouseMove.bind(this);
    this.onTabMouseUp = this.onTabMouseUp.bind(this);
    this.closeTab = this.closeTab.bind(this);
    this.vsplit = this.vsplit.bind(this);
    this.hsplit = this.hsplit.bind(this);
  }

  attached() {
    if (!isAttached(this)) return;
    this.tabs = this.children(isTab);
    this.clear();

    this.style = {
      overflow: "hidden",
      border: "2px groove #999999",
      display: "flex",
      flexDirection: "column"
    };

    this.tabLabels = new AttachedPaneer(
      Pan/*html*/`<div ${{ display: "flex", flexDirection: "row", maxHeight: "1.5em", overflow: "hidden" }}></div>`);
    this.content = new AttachedPaneer(
      Pan/*html*/`<div ${{ position: "absolute", top: "0", bottom: "0", left: "0", right: "0", overflow: "hidden" }}></div>`);

    
    AppendPan(this.element)/*html*/`
    <div ${{
        width: "100%",
        height: "1.5em",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        // TODO(P2) make colors adjustable via css vars
        // (loadable via file)
        backgroundColor: "pink"
      }}>
      ${this.tabLabels}
      <div ${{display: "flex", flexDirection: "row"}}>
        ${new ToolTip({icon: "icons/vsplit.svg", alt: "VSplit", size:"1.5em", onClick: this.vsplit})}
        ${new ToolTip({icon: "icons/hsplit.svg", alt: "HSplit", size:"1.5em", onClick: this.hsplit})}
        ${new ToolTip({icon: "icons/cross.svg", alt: "Close", size:"1.5em", onClick: this.closeTab})}
      </div>
    </div>
    
    <div ${{ flex: "1", width: "100%" }}>
      <div ${{ position: "relative", width: "100%", height: "100%", backgroundColor: "pink" }}>
        ${this.content}
      </div>
    </div>
    `

    this.element.addEventListener("mouseenter", (e) => {
      this.onMouseEnter(e);
    });

    this.currentTab = this.tabs.find(() => true);
  }

  get currentTab(): Tab | undefined {
    return this.content.child(isTab);
  }

  set currentTab(tab: Tab | undefined) {
    if (this.currentTab) {
      this.currentTab.remove();
    }

    let existed = true;

    if (isAttached(tab)) {
      if (this.tabs.indexOf(tab) === -1) {
        this.tabs.push(tab);
        existed = false;
      }

      this.content.append(tab);
      tab.style.backgroundColor = "white";
      if (tab.resize) tab.resize();
    }

    if (existed) {
      this.updateSelection();
    } else {
      this.updateLabels();
    }
  }

  addTab(tab: Tab) {
    if (!isAttached(tab) || !isAttached(this)) return;

    this.tabs.push(tab);
    if (!this.currentTab) this.currentTab = tab;
    this.updateLabels();
  }

  removeTab(tab: Tab) {
    if (!isAttached(tab) || !isAttached(this)) return;

    const tabsLength = this.tabs.length;
    this.tabs = this.tabs.filter(t => t !== tab);

    if (this.currentTab == tab) {
      this.currentTab = this.tabs.find(() => true);
    }

    if (tabsLength !== this.tabs.length) {
      this.updateLabels();
    }
  }

  updateLabels() {
    this.tabLabels.clear();
    const current = this.currentTab;

    this.tabs.forEach(tab => {
      const selectStyles = current == tab ?
        { backgroundColor: "white", borderBottom: "none" } :
        { backgroundColor: "#999999", borderBottom: "1px solid black" };
      this.tabLabels.append(Pan/*html*/`
        <div ${{
          padding: "2px",
          width: "min-content",
          borderLeft: "1px solid #333333",
          borderRight: "1px solid #333333",
          borderTop: "1px solid #333333",
          borderTopRightRadius: "2px",
          borderTopLeftRadius: "2px",
          cursor: "select",
          userSelect: "none",
          ...selectStyles
        }}
        ${
        el => {
          // TODO(P3) better event handling here
          // Don't want to have to set clicked tab, should be in some sort of closure...
          el.addEventListener("mousedown",
            (e) => {
              this.clickedTab = tab;
              window.addEventListener("mousemove", this.onTabMouseMove);
              window.addEventListener("mouseup", this.onTabMouseUp);
            }
          )
        }
        }
        >${tab.label}</div>
      `);
    })
  }

  updateSelection() {
    // TODO(P3) actually update labels instead of recreating...
    this.updateLabels();
  }

  onTabMouseMove(e: MouseEvent) {
    if (this.clickedTab) {
      this.Ancestor(isOverlay).top.append(new DraggedTab(this.clickedTab, e));
      this.removeTab(this.clickedTab);
      this.clickedTab = undefined;
    }
    window.removeEventListener("mousemove", this.onTabMouseMove);
    window.removeEventListener("mouseup", this.onTabMouseUp);

  }

  onTabMouseUp(e: MouseEvent) {
    this.currentTab = this.clickedTab;
    this.clickedTab = undefined;
    window.removeEventListener("mousemove", this.onTabMouseMove);
    window.removeEventListener("mouseup", this.onTabMouseUp);
  }

  onMouseEnter(e: MouseEvent) {
    if (!isAttached(this)) return;
    this.Ancestor(isOverlay).registerIntent("tabdrop", this);
  }

  closeTab() {
    const tab = this.currentTab;
    if (tab) {
      this.removeTab(tab);
      tab.remove(true);
    } if (!this.currentTab) {
      const parent = this.Ancestor(isDirected);
      parent.flexSizeChildren();
      parent.removeChild(this);
      this.remove(true);
    }
  }

  vsplit() {
    this.split("V");
  }

  hsplit() {
    this.split("H");
  }

  split(direction: "H" | "V") {
    if(!isSized(this)) return;
    const parent = this.Ancestor(isDirected);
    if (parent.direction == direction) {
      const newPane = new PaneLeaf(`auto`)
        .attach(Pan/*html*/`<div></div>`);
      parent.insert(newPane, this);
    } else {
      const newPane = new PaneNode(direction, this.size)
        .attach(Pan/*html*/`<div></div>`);
      parent.insert(newPane, this);
      parent.removeChild(this);
      this.size = "1fr";
      newPane.append(this);
      newPane.append(new PaneLeaf("1fr")
        .attach(Pan/*html*/`<div></div>`));

      parent.resize();
    }
  }

  resize() {
    if (this.currentTab?.resize) {
      this.currentTab.resize();
    }
  }
}

class DraggedTab extends AttachedPaneer {

  highlight: HTMLElement;
  dragging: HTMLElement;

  tab: Tab;

  constructor(tab: Tab, initalEvent: MouseEvent) {
    super(Pan/*html*/`<div></div>`);

    AppendPan(this.element)/*html*/`
    <div ${{
        position: "absolute",
        padding: "2px",
        width: "min-content",
        cursor: "select",
        userSelect: "none",
        backgroundColor: "white",
        border: '2px solid #0099ff',
        fontSize: "1.5em"
      }} ${el => this.dragging = el}>${tab.label}</div>
    <div ${{ position: "absolute" }} ${el => this.highlight = el}></div>
    `
    this.style = {
      position: "absolute",
      width: "100%",
      height: "100%"
    };

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);


    this.onMouseMove(initalEvent);
    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("mouseup", this.onMouseUp);

    this.tab = tab;
  }

  onMouseMove(event: MouseEvent) {
    const domRect = this.dragging.getBoundingClientRect();
    this.dragging.style.top = `${event.clientY - domRect.height / 2}px`;
    this.dragging.style.left = `${event.clientX - domRect.width / 2}px`;

    const drop = this.ancestor(isOverlay)?.getIntent("tabdrop");

    if (drop) {
      const dropRect = drop.element.getBoundingClientRect()
      this.highlight.style.top = dropRect.top + "px";
      this.highlight.style.left = dropRect.left + "px";
      this.highlight.style.width = dropRect.width + "px";
      this.highlight.style.height = dropRect.height + "px";

      this.highlight.style.border = "solid 6px #0099ff";
    }
  }

  onMouseUp(event: MouseEvent) {
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("mouseup", this.onMouseUp);

    const drop = this.ancestor(isOverlay)?.getIntent("tabdrop");
    if (isTabContainer(drop)) {
      drop.addTab(this.tab);
    }

    this.remove(true);
  }
}