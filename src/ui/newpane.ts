import { text, option, select, button } from "./utils/dom";
import { ToolBelt } from "./tools";
import { Editor, DOMConsole } from "./editor";
import { LayerControls } from "./layers";
import { Preview } from "./preview";
import { Save, Load } from "./saveload";
import { AttachedPaneer } from "./paneer/paneer";
import { isTabContainer, Tab } from "./components/panes/pane";
import { Pan } from "./paneer/template";

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
        pane = new Editor(ctx.keyboard, ctx.history);
        break;
      case "domconsole":
        pane = new DOMConsole();
        break;
      case "layers":
        pane = new LayerControls(ctx.viewport);
        break;
      case "preview":
        pane = new Preview(ctx.viewport.project, ctx.viewport);
        break;
      case "save":
        pane = new Save(ctx.viewport.page);
        break;
      case "load":
        pane = new Load(ctx.viewport.page);
        break;
      case "viewport":
        pane = ctx.viewport;
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