import * as paper from "paper";
import { div, slider, color, button, text, select, option, queryOrThrow, checkbox } from "./utils";

export function createLoadMenu(document: paper.View) {

  function fileUpload() {
    const el = (queryOrThrow("#fileInput") as HTMLInputElement);
    el.removeEventListener("change", fileUpload);
  
    const curFiles = el.files;
    if (!curFiles || curFiles.length === 0) {
      return;
    } else {
      if ((queryOrThrow("#loadclear") as HTMLInputElement).checked) {
        paper.project.clear();
      }
      for(var i = 0; i< curFiles.length; i++) {
        const file = curFiles[i];
        if(file.type == "image/svg+xml") {
           paper.project.importSVG(URL.createObjectURL(file), (item) => {
             // TODO come up with some way to refresh viewport/canvas when document resizes.
             document.viewSize = item.bounds.size.clone();
            });
        } else if(file.type == "image/png" || file.type == "image/png") {
          let l = new paper.Raster(URL.createObjectURL(file));
          l.smoothing = false;
        } else {
          console.log(file.type);
        }
      }
    }
  }

  return div({ class: "vertical" }, [
    button(
      {
        id: "loadlocalbutton",
        class: "horizontal"
      },
      [text("loadlocal")],
      {
        click: event => {
          const json = window.localStorage.getItem("saved");
          if (json) {
            if ((queryOrThrow("#loadclear") as HTMLInputElement).checked) {
              paper.project.clear();
            }
            paper.project.importJSON(json);
            paper.project.deselectAll();
          }
        }
      }),
    button(
      {
        id: "loadbutton",
        class: "horizontal"
      },
      [text("load")],
      {
        click: event => {
          var e = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
          });
          const el = (queryOrThrow("#fileInput") as HTMLInputElement);
          el.addEventListener("change", fileUpload);
          (queryOrThrow("#fileInput") as HTMLInputElement).dispatchEvent(e);
        }
      }
    ),
    checkbox({id: "loadclear", checked: "true"}, {})
  ]);
}