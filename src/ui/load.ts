import * as paper from "paper";
import { button, text, select, option, queryOrThrow, checkbox, div } from "./utils/dom";
import { AttachedPaneer } from "./paneer/paneer";
import { Tab } from "./components/panes/pane";
import { Pan } from "./paneer/template";
import { Serializer } from "./paneer/deserializer";

export class Load extends AttachedPaneer implements Tab {
  tab: true = true;
  label = "Load";
  page: paper.View;
  constructor(page: paper.View) {
    super(Pan/*html*/`<div></div>`);
    this.fileUpload = this.fileUpload.bind(this);

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
        paper.project.clear();
      }
      for (var i = 0; i < curFiles.length; i++) {
        const file = curFiles[i];
        if (file.type == "image/svg+xml") {
          paper.project.importSVG(URL.createObjectURL(file), (item: paper.Item) => {
            this.page.viewSize = item.bounds.size.clone();
          });
        } else if (file.type == "image/png" || file.type == "image/jpeg") {
          let l = new paper.Raster(URL.createObjectURL(file));
          // TODO(P3) resize paper.project
          l.smoothing = false;
        } else {
          console.log(file.type);
        }
      }
    }
  }

  loadlocal() {
    const json = window.localStorage.getItem("saved");
    if (json) {
      if ((queryOrThrow("#loadclear") as HTMLInputElement).checked) {
        paper.project.clear();
      }
      paper.project.importJSON(json);
      paper.project.deselectAll();
    }
  }

}

Serializer.register(
  Load,
  (raw: any) => {
    //@ts-ignore
    const ctx: any = window.ctx;
    return new Load(ctx.viewport.page);
  },
  (raw: Load) => {
    return {};
  }
);