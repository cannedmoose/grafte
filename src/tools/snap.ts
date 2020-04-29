import * as paper from "paper";
/**
SNAP only really happens for mouse interactions
 
We want before the tool gets passed the mouse position we run it through our SNAP

types of snap:
  - snap to grid (of certain size)
    this is a little has a few modes
      - Snap to points on the grid (intersection of grid lines)
      - Snap to grid lines
  - snap to curve
  - snap to guide lines
    - guide lines are lines passing through existing points at specified angles

So a snap is a transform of mouse corrdinated before they are used. How should multiple snaps behave?
  - apply first snap that matches
    - some snaps we will always want to match (if working on a grid say)
  - try to apply overlapping snaps
    - if there's 2 perpendicular guidelines we should tend towards their Intersection
  a combination????

Snapping rules also have a minimum distance. We shouldn't try snapping to something far away...

I kind of see snaps happening in phases. Maybe it's more like a flow chart?

want to say something like
  Consider this group of lines/curves
  if we are close to any:
    check for an intersection within that closeness range
      - when do you snap to the intersection rather than the line?
        MAYBE JUST ALWAYS INTERSECTION IF IT IS CLOSE ENOUGH...
      - in some circumstances we always want to check intersections

Maybe to handle multiple snapping phases:
  - register a phase - phases run in order of registration (we could rearrange them though)
  - a phase returns an ordered list of snap results
    - snap results are a point but they contain context of the line they came from?
    - this extra info may not exist....
  - a phase can then take the 

THINGS THAT MIGHT BE NICE FOR THIS:
Guides in paper js
  - These are not part of a project
  - Though they could be
  - Should be drawn similar to selection

infinite lines in paper js
  - should support everything other lines do
curve generators in paper js
  - sine waves etc...
  - fakes line segments when asked to draw/hittest
  - need to figure out hwo to do bounds etc.

DAY 2

What about anchor points? Shapes should snap on bounds as well as center
we may want to display snapping to more than one guide at more than one point...
How do we do that?

interface:
Pass in array of points
return a delta + lines to get the largest number of those points to snap?

Maybe we're trying to fit too much in...
whats more important? Shape guides or grid guides?


there's also 2 elements:
finding the snap
  - What is the delta from the current point
communicating the snap
  - how do you display the snapped shape
interface should be something like:
findSnap(anchors: paper.Point[], tolerence: number): {delta: paper.Point, visual: paper.Shape[]}
how does that work for grid snap
*/

export interface SnapResult {
  delta: paper.Point;
}

export interface Grid {
  size: paper.Size;
  offset: paper.Point;
}

export function gridSnap(grid: Grid, d: paper.Point, anchors: paper.Point[], tolerence: number): SnapResult {
  // if a point is on the grid no delta...
  // otherwise find the point with the lowest delta to being on the grid
  const deltas = anchors.map(point =>
    point
      .add(d)
      .subtract(grid.offset)
      .modulo(new paper.Point(grid.size)))
  const origin = new paper.Point(0,0);
  
  let closest: paper.Point | undefined = undefined;
  for (const delta of deltas) {
    const distance = delta.getDistance(origin);
    if (!closest) {
      if (distance < tolerence){
        closest = delta;
      }
      continue;
    }
    if (distance < closest.getDistance(origin)) {
      closest = delta;
      continue;
    }
  }

  if (!closest) {
    closest = origin;
  }

  return {
    delta: closest.add(d)
  };
}

/**

SNAP WITH MOUSE DELTAS
in what cases do we want to snap?
and in what way do we want to snap?

dragging a shape:
  each shape has anchors it can try to snap to other anchors
    by default anchors can just be bounds + center
  




*/