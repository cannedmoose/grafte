import { text, option, select, button } from "./utils/dom";
import { ToolBelt } from "./tools";
import { Editor } from "./editor";
import { LayerControls } from "./layers";
import { Preview } from "./preview";
import { Load } from "./load";
import { AttachedPaneer } from "./paneer/paneer";
import { isTabContainer, Tab } from "./components/panes/pane";
import { Pan } from "./paneer/template";
import { Save } from "./save";
import { DOMConsole } from "./domconsole";
import { Store } from "./utils/store";
import { Viewport } from "./viewport";

export class NewPane extends AttachedPaneer {
  tab: true = true;
  label = "New Pane";

  selector: HTMLSelectElement;

  constructor() {
    super(Pan/*html*/`<div></div>`);

    this.selector = select({},
      ["toolbelt", "editor", "domconsole", "layers", "preview", "save", "load", "viewport"].map(s =>
        option({ value: s }, [text(s)]))
    );

    this.element.appendChild(this.selector);

    this.element.appendChild(button({}, [text("new pane")], { click: () => this.create() }));
  }

  create() {
    let pane: Tab | null;

    //@ts-ignore
    const ctx: any = window.ctx;

    switch(this.selector.value){
      case "toolbelt":
        pane = new ToolBelt(ctx.history, ctx.keyboard);
        break;
      case "editor":
        pane = new Editor(Store.getResource("string", "code"), ctx.keyboard, ctx.history);
        break;
      case "domconsole":
        pane = new DOMConsole();
        break;
      case "layers":
        pane = new LayerControls(Store.getResource("project", "default"));
        break;
      case "preview":
        pane = new Preview(Store.getResource("project", "default"));
        break;
      case "save":
        pane = new Save();
        break;
      case "load":
        pane = new Load();
        break;
      case "viewport":
        pane = new Viewport(Store.getResource("project", "default"));
        break;
      default:
        pane = null;
    }
    
    if (pane) {
      const container = this.Ancestor(isTabContainer);
      container.addTab(pane);
      container.removeTab(this);
      container.currentTab = pane;
    }
  }
}