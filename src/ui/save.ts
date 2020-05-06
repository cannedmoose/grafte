import * as paper from "paper";
import { button, text, select, option, queryOrThrow, checkbox, div } from "./utils/dom";
import { AttachedPaneer } from "./paneer/paneer";
import { Tab } from "./components/panes/pane";
import { Pan, AppendPan } from "./paneer/template";
import { Serializer } from "./utils/deserializer";
import { Resource, Store, ActiveProject } from "./utils/store";

export class Button extends AttachedPaneer {
  constructor(label: string) {
    super(Pan/*html*/`<button>${label}</button>`);

    this.style = {
      display: "block",
      margin: ".5em"
    }
  }

  get onclick(): ((this: GlobalEventHandlers, ev: MouseEvent) => any) | null {
    return this.element.onclick;
  }

  set onclick(fn: ((this: GlobalEventHandlers, ev: MouseEvent) => any) | null) {
    this.element.onclick = fn;
  }
}

// HMM maybe this shouldn't be an attached paneer...
export class Selector<T> extends AttachedPaneer {
  selected: T;
  options: T[];
  display: (v: T) => string;
  selectEl: HTMLSelectElement;

  constructor(label: string, options: T[], display: (v: T) => string) {
    super(Pan/*html*/`<div></div>`);

    this.style = {
      display: "flex",
      flexDirection: "row",
      flexWrap: "wrap",
      alignContent: "center",
      width: "100%",
      marginBottom: ".5em",
      maxWidth: "15em"
    };

    AppendPan(this.element)/*html*/`
    <div ${{ height: "min-conent", margin: ".5em" }}>
      ${label || ""}
    </div>
    <div ${{ flexGrow: "100" }}>
    </div>
    <div ${{display: "flex"}}>
      <select ${el => this.selectEl = el as HTMLSelectElement}></select>
    </div>`

    this.options = options;
    this.selected = options[0];
    this.display = display;

    this.refreshOptions();

    this.selectEl.style.margin = ".5em";

    this.selectEl.addEventListener("selectionchange", e => {
      this.selected = this.options[Number(this.selectEl.value)];
    })
  }

  refreshOptions() {
    while(this.selectEl.firstElementChild) {
      this.selectEl.firstElementChild.remove();
    }
    this.options.forEach((o, i) =>
      this.selectEl.append(Pan/*html*/`<option value = "${i}" ${this.selected === o ? `selected="true"` : 0}>${this.display(o)}</option>`)
    )
  }
}

type ExportTypes = "PNG" | "SVG" | "JSON";

export class Save extends AttachedPaneer implements Tab {
  tab: true = true;
  label = "Save";

  selector: Selector<ExportTypes>;

  constructor() {
    super(Pan/*html*/`<div></div>`);

    this.selector = new Selector("Format", ["PNG", "SVG", "JSON"], a => a);

    const saveButton = new Button("Export");
    saveButton.onclick = () => this.save();

    this.append(this.selector);
    this.append(saveButton);
    this.style = {height: "100%"};
  }

  save() {
    let blob;

    const savePng = () => {
      let png = ActiveProject.content.view.element.toDataURL();
      ActiveProject.content.view.off("updated", savePng);
      fetch(png)
        .then(response => response.blob())
        .then(blob => downloadBlob(blob, "image.png"));
    }

    switch (this.selector.selected) {
      case "PNG":
        ActiveProject.content.view.markDirty();
        ActiveProject.content.view.on("updated", savePng);
        ActiveProject.content.view.update();
        break;
      case "SVG":
        let svg = ActiveProject.content.exportSVG({ asString: true, bounds: ActiveProject.content.view.bounds }) as string;
        blob = new Blob(
          [svg],
          { type: 'image/svg' }
        );
        downloadBlob(blob, "image.svg");
        break;
      case "JSON":
        blob = new Blob(
          [ActiveProject.content.exportJSON({ asString: true })],
          { type: 'text/json' }
        );
        downloadBlob(blob, "image.json");
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
    return new Save();
  },
  (raw: Save) => {
    return {};
  }
);
