import * as paper from "paper";
import { button, text, select, option, queryOrThrow, checkbox, div } from "./utils/dom";
import { AttachedPaneer } from "./paneer/paneer";
import { Tab } from "./components/panes/pane";
import { Pan } from "./paneer/template";

export class Save extends AttachedPaneer implements Tab {
  tab: true = true;
  label = "Save";

  page: paper.View;
  constructor(page: paper.View) {
    super(Pan/*html*/`<div></div>`);

    this.page = page;

    this.element.appendChild(select({ id: "savemodeselector" }, [
      option({ value: "png", selected: "true" }, [text("png")]),
      option({ value: "svg" }, [text("svg")]),
      option({ value: "json" }, [text("json")]),
      option({ value: "local" }, [text("local")])
    ]));

    this.element.appendChild(button({}, [text("save")], { click: () => this.save() }));
  }

  save() {
    let blob;
    var typeSelector: HTMLSelectElement = queryOrThrow("#savemodeselector") as HTMLSelectElement;

    function savePng() {
      let png = this.page.element.toDataURL();
      this.page.off("updated", savePng);
      fetch(png)
        .then(response => response.blob())
        .then(blob => downloadBlob(blob, "image.png"));
    }

    switch (typeSelector.value) {
      case "png":
        this.page.markDirty();
        this.page.on("updated", savePng.bind(this));
        break;
      case "svg":
        let svg = paper.project.exportSVG({ asString: true, bounds: this.page.bounds }) as string;
        blob = new Blob(
          [svg],
          { type: 'image/svg' }
        );
        downloadBlob(blob, "image.svg");
        break;
      case "json":
        blob = new Blob(
          [paper.project.exportJSON({ asString: true })],
          { type: 'text/json' }
        );
        downloadBlob(blob, "image.json");
        break;
      case "local":
        const json = paper.project.exportJSON({ asString: true });
        window.localStorage.setItem("saved", json);
        break;
    }
  }

  serialize() {
    return {
      type: "save"
    };
  }

  static deserialize(raw: any, deserializer: (raw: { type: string }) => any): Save {
    // @ts-ignore
    const ctx:any = window.ctx;
    return new Save(ctx.viewport.page);
  }
}

function downloadBlob(blob: any, filename: string) {
  // Create an object URL for the blob object
  const url = URL.createObjectURL(blob);

  // Create a new anchor element
  const a = document.createElement('a');

  // Set the href and download attributes for the anchor element
  // You can optionally set other attributes like `title`, etc
  // Especially, if the anchor element will be attached to the DOM
  a.href = url;
  a.download = filename || 'download';

  // Click handler that releases the object URL after the element has been clicked
  // This is required for one-off downloads of the blob content
  const clickHandler = () => {
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.removeEventListener('click', clickHandler);
    }, 150);
  };

  // Add the click event listener on the anchor element
  // Comment out this line if you don't want a one-off download of the blob content
  a.addEventListener('click', clickHandler, false);

  // Programmatically trigger a click on the anchor element
  // Useful if you want the download to happen automatically
  // Without attaching the anchor element to the DOM
  // Comment out this line if you don't want an automatic download of the blob content
  a.click();

  // Return the anchor element
  // Useful if you want a reference to the element
  // in order to attach it to the DOM or use it in some other way
  return a;
}


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

  serialize() {
    return {
      type: "load"
    };
  }

  static deserialize(raw: any, deserializer: (raw: { type: string }) => any): Load {
    // @ts-ignore
    const ctx:any = window.ctx;
    return new Load(ctx.viewport.page);
  }
}
