export interface Vector2 {
  x: number;
  y: number;
}

export interface Move {
  kind: "move";
  coords: Vector2;
}

export interface Line {
  kind: "line";
  coords: Vector2;
}

export type Segment = Line | Move;

export interface Shape {
  segments: Segment[];
}

function assertNever(x: never): never {
  throw new Error("Unexpected object: " + x);
}

export function drawShape(ctx: CanvasRenderingContext2D, shape: Shape) {
  ctx.beginPath();

  ctx.save();
  ctx.strokeStyle = "black";
  for (let i = 0; i < shape.segments.length; i++) {
    let segment = shape.segments[i];
    switch (segment.kind) {
      case "move":
        ctx.moveTo(segment.coords.x, segment.coords.y);
        break;
      case "line":
        ctx.lineTo(segment.coords.x, segment.coords.y);
        break;
      default:
        assertNever(segment); // error here if there are missing cases
    }
  }

  ctx.restore();
  ctx.closePath();
}

export function drawControls(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  mouse: Vector2
) {
  ctx.save();
  if (shape.segments.length > 0) {
    let lastShape = shape.segments[shape.segments.length - 1];
    ctx.beginPath();
    ctx.moveTo(lastShape.coords.x, lastShape.coords.y);
    ctx.lineTo(mouse.x, mouse.y);
    ctx.strokeStyle = "blue";
    ctx.stroke();

    ctx.closePath();
  }

  ctx.fillStyle = "white";
  for (let i = 0; i < shape.segments.length; i++) {
    let segment = shape.segments[i];
    ctx.beginPath();

    ctx.rect(segment.coords.x - 5, segment.coords.y - 5, 10, 10);

    if (ctx.isPointInPath(mouse.x, mouse.y)) {
      ctx.strokeStyle = "blue";
    } else {
      ctx.strokeStyle = "black";
    }

    ctx.fill();
    ctx.stroke();
    ctx.closePath();
  }

  ctx.restore();
}
