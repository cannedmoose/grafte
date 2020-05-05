import * as paper from "paper";
import { button, text, select, option, queryOrThrow, checkbox, div } from "./utils/dom";
import { AttachedPaneer } from "./paneer/paneer";
import { Tab } from "./components/panes/pane";
import { Pan } from "./paneer/template";
import { Serializer } from "./utils/deserializer";
import { Resource, Store } from "./utils/store";

export class Load extends AttachedPaneer implements Tab {
  tab: true = true;
  label = "Load";
  project: Resource<paper.Project>;

  constructor(project: Resource<paper.Project>) {
    super(Pan/*html*/`<div></div>`);
    this.fileUpload = this.fileUpload.bind(this);
    this.project = project;

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
        this.project.content.clear();
      }
      for (var i = 0; i < curFiles.length; i++) {
        const file = curFiles[i];
        if (file.type == "image/svg+xml") {
          this.project.content.importSVG(URL.createObjectURL(file), (item: paper.Item) => {
            this.project.content.view.viewSize = item.bounds.size.clone();
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

  loadlocal() {
    const json = window.localStorage.getItem("saved");
    if (json) {
      if ((queryOrThrow("#loadclear") as HTMLInputElement).checked) {
        this.project.content.clear();
      }
      this.project.content.importJSON(json);
      this.project.content.deselectAll();
    }
  }

}

Serializer.register(
  Load,
  (raw: any) => {
    //@ts-ignore
    const ctx: any = window.ctx;
    return new Load(Store.getResource("project", "default"));
  },
  (raw: Load) => {
    return {};
  }
);