import { PPaneer, AttachedPaneer, PaneerAppend, isAttached, Paneer } from "../../paneer/newPaneer";
import { FlexSized, NewTab, isTab } from "./pane";

export class PaneLeaf extends PPaneer implements FlexSized {
  flexsized: true = true;

  size: string;

  tabLabels: AttachedPaneer;
  content: AttachedPaneer;

  tabs: NewTab[];
  selectedIndex: number;

  constructor(size: string) {
    super();
    this.size = size;
  }

  attached(el: HTMLElement) {
    this.tabs = this.children(isTab);
    this.clear();

    this.style = {
      overflow: "hidden",
      border: "2px groove #999999",
      display: "flex",
      flexDirection: "column"
    };

    PaneerAppend(el)/*html*/`
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
    el.addEventListener("mouseenter", () => {
      //const boss = this.ancestor(isDragCoordinator);
      //if (boss && boss.dragPreview.descendent(isAny)) {
        this.style = { border: "4px solid #0099ff" };
        //boss.dropTarget = this;
      //}
    });

    el.addEventListener("mouseleave", () => {
      this.style = { border: "2px groove #999999" };
      // Let next element reset drop target.
    });

    this.currentTab = this.tabs.find(() => true);
  }

  get currentTab(): NewTab | undefined {
    return this.content.child(isTab);
  }

  set currentTab(tab: NewTab | undefined) {
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

  addTab(tab: NewTab) {
    if(!isAttached(tab) || !isAttached(this)) return;

    this.tabs.push(tab);
    if (!this.currentTab) this.currentTab = tab;
    this.updateLabels();
  }

  removeTab(tab: NewTab) {
    if(!isAttached(tab) || !isAttached(this)) return;

    const tabsLength = this.tabs.length;
    this.tabs = this.tabs.filter( t => t!== tab);

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
        {backgroundColor: "white", borderBottom: "none" } :
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
            el.addEventListener("mousedown", () => {
              this.currentTab = tab;
            });
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

  resize() {
    if (this.currentTab?.resize) {
      this.currentTab.resize();
    }
  }
}