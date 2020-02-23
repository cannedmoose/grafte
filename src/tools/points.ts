import * as paper from "paper";

export function pointTool({ canvas }: { canvas: paper.Project }): paper.Tool {
  const selectTool = new paper.Tool();
  selectTool.name = "point";

  let selectionRectangle: paper.Shape | undefined;
  var dragType: "handle-in" | "handle-out" | "segment" | undefined;
  var dragSegment: paper.Segment | undefined;

  /**
   * Note if it complains about return it means we're missing a switch
   */
  selectTool.onMouseDown = function(event: paper.ToolEvent) {
    // First look for selected segments/handles
    var hitResult = canvas.hitTest(event.point, {
      tolerance: 5,
      segments: true,
      handles: true,
      match: (match:paper.HitResult) => match.type == "segment" || match.segment.selected
    });

    console.log(hitResult);
    if (hitResult) {
      if (
        hitResult.type == "handle-in" ||
        hitResult.type == "handle-out" ||
        hitResult.type == "segment"
      ) {
        dragType = hitResult.type;
        dragSegment = hitResult.segment;
        dragSegment.selected = true;
        return;
      }
    }

    hitResult = canvas.hitTest(event.point, {
      tolerance: 5,
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
          canvas.deselectAll();
          hitResult.item.selected = true;
        } else {
          hitResult.item.selected = true;
        }
      }
    } else {
      if (!event.modifiers.shift) {
        canvas.deselectAll();
      }
      selectionRectangle = new paper.Shape.Rectangle(
        event.point,
        new paper.Size(0, 0)
      );
      selectionRectangle.removeOnUp();
      // TODO
      //selectionRectangle.guide = true;

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
      if (dragType == "handle-in") {
        dragSegment.handleOut = dragSegment.handleOut.subtract(event.delta);
        dragSegment.handleIn = dragSegment.handleIn.add(event.delta);
      } else if (dragType == "handle-out") {
        dragSegment.handleOut = dragSegment.handleOut.add(event.delta);
        dragSegment.handleIn = dragSegment.handleIn.subtract(event.delta);
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
      dragSegment = undefined;
      dragType = undefined;
    }
  };

  selectTool.onKeyDown = function(event: paper.KeyEvent) {
    // TODO figure out delete key
    console.log(event.key);
    if (event.key == "backspace") {
      paper.project.selectedItems.forEach(item => item.remove());
    }
  };

  return selectTool;
}
