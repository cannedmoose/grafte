import * as paper from "paper";

export function pointsTool({ canvas }: { canvas: paper.Project }): paper.Tool {
  const pointsTool = new paper.Tool();
  pointsTool.name = "points";

  /**
   * Note if it complains about return it means we're missing a switch
   */
  pointsTool.onMouseDown = function(event: paper.ToolEvent) {
    var hitResult = canvas.hitTest(event.point);

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
      canvas.deselectAll();
    } // TODO else drag points, need to implement guides...
  };

  pointsTool.onMouseDrag = function(event: paper.ToolEvent) {
    canvas.selectedItems.forEach(item => {
      item.translate(event.delta);
    });
  };

  pointsTool.onMouseUp = function(event: paper.ToolEvent) {};

  pointsTool.onKeyDown = function(event: paper.KeyEvent) {
    // TODO figure out delete key
    console.log(event.key);
    if(event.key == "backspace") {
      paper.project.selectedItems.forEach(item => item.remove());
    }
  };

  return pointsTool;
}
