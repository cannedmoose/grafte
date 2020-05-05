import { AttachedPaneer } from "./paneer/paneer";
import { Tab } from "./components/panes/pane";
import { textArea } from "./utils/dom";
import { Serializer } from "./utils/deserializer";

export class DOMConsole extends AttachedPaneer implements Tab {
  tab: true = true;
  label = "Console";

  constructor() {
    super(textArea({readonly: "true"}));
    const el = this.element as HTMLTextAreaElement; 
    this.element.style.width = "100%";
    this.element.style.height = "100%";
    this.element.style.border = "none";
    this.element.style.resize = "none";

    // @ts-ignore
    window.console = {
      log:(...optionalParams: any[]) => {
        el.value += ("> " + JSON.stringify(optionalParams) + "\n");
        el.scrollTop = el.scrollHeight;
      },
      error:(...optionalParams: any[]) => {
        el.value += ("> " + JSON.stringify(optionalParams) + "\n");
        el.scrollTop = el.scrollHeight;
      },
      clear: () => { el.value = ""},
      warn:(...optionalParams: any[]) => {
        el.value += ("> " + JSON.stringify(optionalParams) + "\n");
        el.scrollTop = el.scrollHeight;
      },
    }
  }
}

Serializer.register(
  DOMConsole,
  (raw: any) => {
    return new DOMConsole();
  },
  (raw: DOMConsole) => {
    return {};
  }
);