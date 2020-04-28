import { PaneerDOM } from "./paneer/paneerdom";
import { text, option, select, button } from "./utils/dom";
import { ToolBelt } from "./tools";
import { Editor, DOMConsole } from "./editor";
import { LayerControls } from "./layers";
import { Preview } from "./preview";
import { Save, Load } from "./saveload";
import { isTab, isTabContainer, LeafTab } from "./paneer/pane";

export class NewPane extends PaneerDOM {
  label = "New Pane";

  selector: HTMLSelectElement;

  constructor() {
    super();

    this.selector = select({},
      ["toolbelt", "editor", "domconsole", "layers", "preview", "save", "load", "viewport"].map(s =>
        option({ value: s }, [text(s)]))
    );

    this.element.appendChild(this.selector);

    this.element.appendChild(button({}, [text("new pane")], { click: () => this.create() }));
  }

  create() {
    let pane: PaneerDOM | null;

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
      container.addTab(new LeafTab(pane));
      container.tabContent = pane;
      [...container.descendents(isTab)]
        .filter(tab => tab.pane == this)
        .forEach(tab => container.removeTab(tab));
      container.resize();
    }

  }
}