import * as paper from "paper";

export function selectTool({ canvas }: { canvas: paper.Project }): paper.Tool {
  const selectTool = new paper.Tool();

  /**
   * Note if it complains about return it means we're missing a switch
   */
  selectTool.onMouseDown = function(event: paper.ToolEvent) {
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
    } // TODO else drag select
  };

  selectTool.onMouseDrag = function(event: paper.ToolEvent) {
    canvas.selectedItems.forEach(item => {
      item.translate(event.delta);
    });
  };

  selectTool.onMouseUp = function(event: paper.ToolEvent) {};

  return selectTool;
}
