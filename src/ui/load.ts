import * as paper from "paper";
import { button, text, select, option, queryOrThrow, checkbox, div } from "./utils/dom";
import { AttachedPaneer } from "./paneer/paneer";
import { Tab } from "./components/panes/pane";
import { Pan } from "./paneer/template";
import { Serializer } from "./utils/deserializer";
import { Resource, Store, ActiveProject } from "./utils/store";

export class Load extends AttachedPaneer implements Tab {
  tab: true = true;
  label = "Load";

  constructor() {
    super(Pan/*html*/`<div></div>`);
    this.fileUpload = this.fileUpload.bind(this);
    this.style = {height: "100%"};

    this.element.appendChild(div({}, [checkbox({ id: "loadclear", checked: "true" }, {}), text("Clear on load")]));
    this.element.appendChild(button({}, [text("load")], { click: () => this.load() }));
  }

  load() {
    var e = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true
    });
    const el = (queryOrThrow("#fileInput") as HTMLInputElement);
    el.addEventListener("change", this.fileUpload);
    (queryOrThrow("#fileInput") as HTMLInputElement).dispatchEvent(e);
  }

  fileUpload() {
    const el = (queryOrThrow("#fileInput") as HTMLInputElement);
    el.removeEventListener("change", this.fileUpload);

    const curFiles = el.files;
    if (!curFiles || curFiles.length === 0) {
      return;
    } else {
      if ((queryOrThrow("#loadclear") as HTMLInputElement).checked) {
        ActiveProject.content.clear();
      }
      for (var i = 0; i < curFiles.length; i++) {
        const file = curFiles[i];
        if (file.type == "image/svg+xml") {
          ActiveProject.content.importSVG(URL.createObjectURL(file), (item: paper.Item) => {
            ActiveProject.content.view.viewSize = item.bounds.size.clone();
          });
        } else if (file.type == "image/png" || file.type == "image/jpeg") {
          let l = new paper.Raster(URL.createObjectURL(file));
          // TODO(P3) resize this.project.content
          l.smoothing = false;
        } else {
          console.log(file.type);
        }
      }
    }
  }
}

Serializer.register(
  Load,
  (raw: any) => {
    //@ts-ignore
    const ctx: any = window.ctx;
    return new Load();
  },
  (raw: Load) => {
    return {};
  }
);