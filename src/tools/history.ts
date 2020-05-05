import * as paper from "paper";
import { Keyboard } from "../ui/keyboard";
import { Resource } from "../ui/utils/store";

export class GrafteHistory {
  history: string[];
  project: Resource<paper.Project>;

  present: number;



  constructor(project: Resource<paper.Project>) {
    this.project = project;

    this.history = [];
    this.present = 0;
  }

  commit() {
    // TODO(P3) store as diff, this is pushing up our memory limits
    // Sketcher did it, look into their impl
    this.history = [...this.history.slice(0, this.present + 1)];
    this.history.push(this.project.content.exportJSON({ asString: true }));
    this.present = this.history.length - 1;
  }

  undo() {
    if (this.present < 0) {
      return;
    }
    this.present = this.present - 1;
    this.project.content.deselectAll();
    this.project.content.clear();
    this.project.content.importJSON(this.history[this.present]);
    this.reselect();
  }

  redo() {
    if (this.present >= this.history.length - 1) {
      return;
    }
    this.present = this.present + 1;
    this.project.content.deselectAll();
    this.project.content.clear();
    this.project.content.importJSON(this.history[this.present]);
    this.reselect();
  }

  reselect() {
    const selected = [...this.project.content.selectedItems];
    selected
      .filter(item => item.className == "Layer")
      .forEach(item => (item.selected = false));
    selected
      .filter(item => item.className != "Layer")
      .forEach(item => (item.selected = true));
  }
}
