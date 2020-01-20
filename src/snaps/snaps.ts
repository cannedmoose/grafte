import * as paper from "paper";

export interface Snap {
  // Maps points
  fn: (point: paper.Point) => paper.Point;

  // Some visulization of this snap
  view: (point: paper.Point) => void;
}

export function snapMap(from: Snap, to: Snap): Snap {
  return {
    fn: point => to.fn(from.fn(point)),
    view: point => to.view(from.fn(point))
  };
}

export const identity = {
  fn: p => p,
  view: p => p
};

export function gridSnap(size: paper.Point, offset: paper.Point): Snap {
  if (size.x == 0 || size.y == 0) return identity;

  function fn(point: paper.Point): paper.Point {
    return point
      .divide(size)
      .floor()
      .multiply(size)
      .add(offset);
  }

  function view(point: paper.Point) {
    const overshoot = new paper.Point(3, 3);
    const lastPoint = fn(new paper.Point(paper.view.size).divide(size).floor());
    for (let i = -overshoot.x; i < lastPoint.x + overshoot.x; i++) {
      new paper.Path.Line(
        new paper.Point(i, 0).multiply(size).add(offset),
        new paper.Point(i, 0)
          .multiply(size)
          .add(new paper.Point(0, paper.view.size.height))
          .add(offset)
      );
    }

    for (let k = -overshoot.y; k < lastPoint.y + overshoot.y; k++) {
      new paper.Path.Line(
        new paper.Point(0, k).multiply(size).add(offset),
        new paper.Point(0, k)
          .multiply(size)
          .add(new paper.Point(paper.view.size.width, 0))
          .add(offset)
      );
    }
  }
  return { fn, view };
}

export function sineySnap(amp: number, offset: number, mul: number): Snap {
  function fn(point: paper.Point): paper.Point {
    return point.add(
      new paper.Point(0, Math.sin(point.x * amp + offset)).multiply(mul)
    );
  }

  function view(point: paper.Point) {
    const overshoot = new paper.Point(3, 3);
    const size = new paper.Point(2, 80);
    const lastPoint = new paper.Point(paper.view.size).divide(size);
    let prev = new paper.Point(0, 0);
    for (let k = -overshoot.y; k < lastPoint.y + overshoot.y; k++) {
      prev = new paper.Point(0, k).multiply(size);
      for (let i = -overshoot.x; i < lastPoint.x + overshoot.x; i++) {
        let n = new paper.Point(i, k).multiply(size);
        new paper.Path.Line(fn(prev), fn(n));
        prev = n;
      }
    }
  }
  return { fn, view };
}
