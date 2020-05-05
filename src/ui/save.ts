import * as paper from "paper";
import { button, text, select, option, queryOrThrow, checkbox, div } from "./utils/dom";
import { AttachedPaneer } from "./paneer/paneer";
import { Tab } from "./components/panes/pane";
import { Pan } from "./paneer/template";
import { Serializer } from "./utils/deserializer";
import { Resource, Store } from "./utils/store";

export class Save extends AttachedPaneer implements Tab {
  tab: true = true;
  label = "Save";

  project: Resource<paper.Project>;
  // TODO(P1) save/load should use active project/ allow project select
  
  constructor(project: Resource<paper.Project>) {
    super(Pan/*html*/`<div></div>`);

    this.project = project;

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

    const savePng = () => {
      let png = this.project.content.view.element.toDataURL();
      this.project.content.view.off("updated", savePng);
      fetch(png)
        .then(response => response.blob())
        .then(blob => downloadBlob(blob, "image.png"));
    }

    switch (typeSelector.value) {
      case "png":
        this.project.content.view.markDirty();
        this.project.content.view.on("updated", savePng);
        this.project.content.view.update();
        break;
      case "svg":
        let svg = this.project.content.exportSVG({ asString: true, bounds: this.project.content.view.bounds }) as string;
        blob = new Blob(
          [svg],
          { type: 'image/svg' }
        );
        downloadBlob(blob, "image.svg");
        break;
      case "json":
        blob = new Blob(
          [this.project.content.exportJSON({ asString: true })],
          { type: 'text/json' }
        );
        downloadBlob(blob, "image.json");
        break;
      case "local":
        const json = this.project.content.exportJSON({ asString: true });
        window.localStorage.setItem("saved", json);
        break;
    }
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


Serializer.register(
  Save,
  (raw: any) => {
    //@ts-ignore
    const ctx: any = window.ctx;
    return new Save(Store.getResource("project", "default"));
  },
  (raw: Save) => {
    return {};
  }
);
