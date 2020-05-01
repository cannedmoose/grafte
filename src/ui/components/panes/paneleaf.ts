import { PPaneer, AttachedPaneer, PaneerAppend, isAttached, Paneer } from "../../paneer/newPaneer";
import { FlexSized, Tab, isTab, TabContainer } from "./pane";
import { isOverlay } from "./dragoverlay";

export class PaneLeaf extends PPaneer implements FlexSized, TabContainer {
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

    PaneerAppend(this.element)/*html*/`
    <div ${{
        width: "100%",
        height: "1.5em",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: "#333333"
      }}>
      <div
        ${el => { this.tabLabels = new AttachedPaneer(el) }}
        ${{ display: "flex", flexDirection: "row", maxHeight: "1.5em", overflow: "hidden" }}></div>
      <div></div>
    </div>
    
    <div ${{ flex: "1", width: "100%" }}>
      <div ${{ position: "relative", width: "100%", height: "100%" }}>
        <div 
          ${el => { this.content = new AttachedPaneer(el) }}
          ${{ position: "absolute", top: "0", bottom: "0", left: "0", right: "0", overflow: "hidden" }}></div>
      </div>
    </div>
    `
    // TODO(P2) should remove these on detach...
    // also actually reimplemnt dragondrop
    this.element.addEventListener("mouseenter", () => {
      //const boss = this.ancestor(isDragCoordinator);
      //if (boss && boss.dragPreview.descendent(isAny)) {
      this.style = { border: "4px solid #0099ff" };
      //boss.dropTarget = this;
      //}
    });

    this.element.addEventListener("mouseleave", () => {
      this.style = { border: "2px groove #999999" };
      // Let next element reset drop target.
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
      this.tabLabels.append(Paneer/*html*/`
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

  onTabMouseMove(e: MouseEvent) {
    this.Ancestor(isOverlay).top.append(Paneer/*html*/`<div>TEST</div>`);
    window.removeEventListener("mousemove", this.onTabMouseMove);
    window.removeEventListener("mouseup", this.onTabMouseUp);
    this.clickedTab = undefined;
    // Break off tab, it belongs to the drag overlay now...

  }

  onTabMouseUp(e: MouseEvent) {
    this.currentTab = this.clickedTab;
    this.clickedTab = undefined;
    window.removeEventListener("mousemove", this.onTabMouseMove);
    window.removeEventListener("mouseup", this.onTabMouseUp);
  }

  updateSelection() {
    // TODO(P3) actually update labels instead of recreating...
    this.updateLabels();
  }

  resize() {
    if (this.currentTab?.resize) {
      this.currentTab.resize();
    }
  }
}

class DraggedTab extends AttachedPaneer {
  tab: Tab;
  constructor(tab: Tab) {
    super(Paneer/*html*/`<div></div>`);
    this.style = {
      padding: "2px",
      width: "min-content",
      borderLeft: "1px solid #333333",
      borderRight: "1px solid #333333",
      borderTop: "1px solid #333333",
      borderTopRightRadius: "2px",
      borderTopLeftRadius: "2px",
      cursor: "select",
      userSelect: "none",
      backgroundColor: "white", borderBottom: "1px solid black"
    };


    this.tab = tab;
  }

}