import * as paper from "paper";
import { GrafteHistory } from "./history";
import { Keyboard } from "../ui/keyboard";

export function pointTool(history: GrafteHistory, keyboard: Keyboard): paper.Tool {
  const selectTool = new paper.Tool();
  selectTool.name = "point";

  // Rectanglular selection region
  let selectionRectangle: paper.Shape | undefined;
  // When dragging a point or handle the type of drag.
  let dragType: "handle-in" | "handle-out" | "segment" | undefined;
  // When dragging a point or handle the segment for it.
  let dragSegment: paper.Segment | undefined;
  // Number of clicks without moving.
  let numClicks: number = 0;

  /**
   * Note if it complains about return it means we're missing a switch
   */
  selectTool.onMouseDown = function(event: paper.ToolEvent) {
    numClicks += 1;
    // First look for handles from selected segments
    let hitResult = paper.project.hitTest(event.point, {
      selected: true,
      handles: true,
      match: (result: paper.HitResult) => {
        if (result.type == "handle-in") {
          return !result.segment.handleIn.isZero();
        } else {
          return !result.segment.handleOut.isZero();
        }
      }
    });

    if (hitResult && (hitResult.type == "handle-in" || hitResult.type == "handle-out") ) {
      dragType = hitResult.type;
      dragSegment = hitResult.segment as paper.Segment;
      dragSegment.selected = true;
      return;
    }

    // Next look for segments on selected items
    // TODO make hitTestAll, so we can handle segments in the same spot.
    hitResult = paper.project.hitTest(event.point, {
      segments: true,
      match: (result: paper.HitResult) => result.item.selected
    });


    if (hitResult && hitResult.type == "segment") {
      // Unselect currently selected segments.
      paper.project.selectedItems.forEach(item => {
        item.selected = false;
        item.selected = true;
      });

      dragType = hitResult.type;
      dragSegment = hitResult.segment as paper.Segment;
      dragSegment.selected = true;
      return;
    }

    hitResult = paper.project.hitTest(event.point, {
      fill: true,
      stroke: true
    });

    if (hitResult) {
      if (event.modifiers.shift) {
        if (hitResult.item.selected) {
          hitResult.item.selected = false;
        } else {
          hitResult.item.selected = true;
        }
      } else {
        if (!hitResult.item.selected) {
          paper.project.deselectAll();
          hitResult.item.selected = true;
        } else {
          hitResult.item.selected = true;
        }
      }
    } else {
      if (!event.modifiers.shift) {
        paper.project.deselectAll();
      }
      selectionRectangle = new paper.Shape.Rectangle(
        event.point,
        new paper.Size(0, 0)
      );
      selectionRectangle.removeOnUp();

      selectionRectangle.strokeColor = new paper.Color("red");
    }
  };

  selectTool.onMouseDrag = function(event: paper.ToolEvent) {
    if (selectionRectangle) {
      selectionRectangle.size = new paper.Size(
        event.downPoint.subtract(event.point)
      );
      selectionRectangle.position = event.downPoint.subtract(
        event.downPoint.subtract(event.point).divide(2)
      );
    } else if (dragSegment && dragType) {
      numClicks = 0;
      if (dragType == "handle-in") {
        const oldLength = dragSegment.handleIn.length;
        const oldAngle = dragSegment.handleIn.angle;
        dragSegment.handleIn = dragSegment.handleIn.add(event.delta);
        const newLength = dragSegment.handleIn.length;
        const newAngle = dragSegment.handleIn.angle;

        dragSegment.handleOut.length *= newLength/oldLength;
        dragSegment.handleOut.angle += newAngle - oldAngle;
      } else if (dragType == "handle-out") {
        const oldLength = dragSegment.handleOut.length;
        const oldAngle = dragSegment.handleOut.angle;
        dragSegment.handleOut = dragSegment.handleOut.add(event.delta);
        const newLength = dragSegment.handleOut.length;
        const newAngle = dragSegment.handleOut.angle;

        dragSegment.handleIn.length *= newLength/oldLength;
        dragSegment.handleIn.angle +=  newAngle - oldAngle;
      } else {
        dragSegment.point = dragSegment.point.add(event.delta);
      }
    }
  };

  selectTool.onMouseUp = function(event: paper.ToolEvent) {
    if (selectionRectangle) {
      paper.project.activeLayer
        .getItems({ inside: selectionRectangle.bounds })
        .forEach(item => (item.selected = true));
      selectionRectangle = undefined;
    } else if (dragSegment && dragType) {
      if(numClicks == 2) {
        console.log(dragType);
        if (dragType == "segment") {
          dragSegment.remove();
        } else if (dragType == "handle-in") {
          dragSegment.handleIn = new paper.Point(0, 0);
        }  else {
          dragSegment.handleOut = new paper.Point(0, 0);
        }
        numClicks = 0;
      }
      dragSegment = undefined;
      dragType = undefined;
      history.commit();
    }
  };

  selectTool.onMouseMove = function () {

    numClicks = 0;
  }

  return selectTool;
}
