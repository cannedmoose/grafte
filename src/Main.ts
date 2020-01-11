import * as grafte from "./Grafte";

interface NoShape {
  kind: "noshape";
  mouse: grafte.Vector2;
}

interface AShape {
  kind: "shape";
  shape: grafte.Shape;
  mouse: grafte.Vector2;
}

type Model = NoShape | AShape;

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let model: Model;

window.onload = function() {
  canvas = document.querySelector("#canvas");
  ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  model = { kind: "noshape", mouse: { x: 0, y: 0 } };

  canvas.addEventListener("mousedown", onDown);
  canvas.addEventListener("mousemove", onMove);
  canvas.addEventListener("mouseup", onUp);
};

function onDown(event: MouseEvent) {
  model.mouse = { x: event.clientX, y: event.clientY };
  window.requestAnimationFrame(drawCanvas);
}

function onMove(event: MouseEvent) {
  model.mouse = { x: event.clientX, y: event.clientY };
  window.requestAnimationFrame(drawCanvas);
}

function onUp(event: MouseEvent) {
  model.mouse = { x: event.clientX, y: event.clientY };

  switch (model.kind) {
    case "shape":
      if (model.shape.segments.length == 0) {
        model.shape.segments.push({ kind: "move", coords: model.mouse });
      } else {
        model.shape.segments.push({ kind: "line", coords: model.mouse });
      }
      break;
  }

  window.requestAnimationFrame(drawCanvas);
}

function drawCanvas(delta: number) {
  switch (model.kind) {
    case "shape":
      grafte.drawShape(ctx, model.shape);
      grafte.drawControls(ctx, model.shape, model.mouse);
      break;
  }
}
