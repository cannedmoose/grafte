import * as paper from "paper";

export function selectTool(history): paper.Tool {
  const selectTool = new paper.Tool();
  selectTool.name = "select";

  let selectionRectangle: paper.Shape | undefined;

  /**
   * Note if it complains about return it means we're missing a switch
   */
  selectTool.onMouseDown = function(event: paper.ToolEvent) {
    var hitResult = paper.project.hitTest(event.point, {
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
          paper.project.deselectAll();
          hitResult.item.selected = true;
        } else {
          hitResult.item.selected = true;
        }
      }

      if (event.modifiers.alt) {
        paper.project.selectedItems.forEach(item => {
          var cloned = item.clone();
          cloned.selected = false;
        });
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
      // TODO(P2) Implement guides so selection rect doesnt appear in layers
      //selectionRectangle.guide = true;

      selectionRectangle.strokeColor = new paper.Color("red");
      selectionRectangle.strokeWidth = 1;
      selectionRectangle.fillColor = null;
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
    } else {
      paper.project.selectedItems.forEach(item => {
        item.translate(event.delta);
      });
    }
  };

  selectTool.onMouseUp = function(event: paper.ToolEvent) {
    if (selectionRectangle) {
      paper.project.activeLayer
        .getItems({ inside: selectionRectangle.bounds })
        .forEach(item => (item.selected = true));
      selectionRectangle = undefined;
    } else if (
      paper.project.selectedItems.length > 0 &&
      event.downPoint.getDistance(event.point)
    ) {
      history.commit();
    }
  };

  return selectTool;
}
