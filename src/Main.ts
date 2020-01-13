import * as paper from "paper";

function stoPoint(size: paper.Size) {
  return new paper.Point(
    paper.view.bounds.size.width,
    paper.view.bounds.size.height
  );
}

function rtoPoint(rect: paper.Rectangle) {
  return stoPoint(rect.size);
}

window.onload = function() {
  let canvas: HTMLCanvasElement = document.querySelector("#canvas");
  let project = new paper.Project(canvas);
  project.activate();
  let path = new paper.Path();

  path.add([0, 0]);
  path.add(rtoPoint(paper.view.bounds));
  path.strokeColor = new paper.Color("black");
  path.strokeWidth = 10;
};
