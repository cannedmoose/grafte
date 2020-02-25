import * as paper from "paper";

export class GrafteHistory {
  history: string[];
  project: paper.Project;

  present: number;

  constructor(project: paper.Project) {
    this.project = project;

    this.history = [];
    this.present = 0;
  }

  commit() {
    this.history = [...this.history.slice(0, this.present + 1)];
    this.history.push(this.project.exportJSON({ asString: true }));
    this.present = this.history.length - 1;
  }

  undo() {
    if (this.present < 0) {
      return;
    }
    this.present = this.present - 1;
    this.project.deselectAll();
    this.project.clear();
    this.project.importJSON(this.history[this.present]);
    this.reselect();
  }

  redo() {
    if (this.present >= this.history.length - 1) {
      return;
    }
    this.present = this.present + 1;
    this.project.deselectAll();
    this.project.clear();
    this.project.importJSON(this.history[this.present]);
    this.reselect();
  }

  reselect() {
    const selected = [...this.project.selectedItems];
    selected
      .filter(item => item.className == "Layer")
      .forEach(item => (item.selected = false));
    selected
      .filter(item => item.className != "Layer")
      .forEach(item => (item.selected = true));
  }
}
