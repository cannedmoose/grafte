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
  paper.setup(canvas);
  let path = new paper.Path();

  path.moveTo(new paper.Point(0, 0));
  path.lineTo(rtoPoint(paper.view.bounds));
  path.strokeColor = new paper.Color("black");
  path.strokeWidth = 10;

  paper.view.onResize = event => {
    path.lastSegment.point = rtoPoint(paper.view.bounds);
  };

  let circleTool = new paper.Tool();
  let circlePath = new paper.Path();

  circleTool.onMouseDrag = function(event) {
    circlePath.removeSegments();
    circlePath = new paper.Path.Circle({
      center: event.downPoint,
      radius: event.downPoint.getDistance(event.point)
    });
    circlePath.strokeColor = new paper.Color("blue");
    circlePath.fillColor = new paper.Color(0, 0, 0, 0);
  };

  circleTool.onMouseUp = function(event) {
    circlePath.strokeColor = new paper.Color("black");
    circlePath.fillColor = new paper.Color("white");
    circlePath = new paper.Path();
  };
};
