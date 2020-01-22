import * as paper from "paper";
import { GrafeTool, ToolContext } from "./tool";
/**
 * TOOL RUNNING
 * On mousedown we check for hit objects, first on tool then canvas layer
 *  if hit on tool layer then
 *    if control/handle start dragging
 *    if curve/line add handle and start dragging
 *    if in fill start dragging
 *  if hit on canvas layer then select whatever under mouse (if anything)
 *    if shift is held keep current selection
 *    otherwise clear current selection
 * On mouse drag
 *  if dragging something then move it + other selected
 * On mouse up
 *  write drag to canvas (ONLY SAVE POINT)
 *  if no movement from position deselect
 *
 * Notes
 * Once something is deselected from tool layer we remove it
 * we keep a reference between the tool layer and canvas layer item ids
 *
 * Need to figure out style changes
 */

interface ItemSelect {
  type: "itemselect";
}

interface MovingItem {
  type: "movingitem";
}

interface MovingBounds {
  type: "movingbounds";
  handle: "topright" | "topleft" | "bottomright" | "bottomleft";
}

interface SegmentSelect {
  type: "segmentselect";
}

interface MovingSegment {
  type: "movingsegment";
}

interface MovingHandle {
  type: "movinghandle";
  handle: "handle-in" | "handle-out";
  start: paper.Point;
  last: paper.Point;
}

type DragState =
  | ItemSelect
  | MovingItem
  | MovingSegment
  | MovingHandle
  | MovingBounds
  | SegmentSelect;

/**
 * Returns selected segments of selected shapes in project
 * @param project
 */
function selectedSegments(project: paper.Project): paper.Segment[] {
  let selected: paper.Segment[] = [];
  const paths = project.selectedItems
    .filter(item => item.className == "Path")
    .map(item => item as paper.Path);
  for (let i = 0; i < paths.length; i++) {
    let path = paths[i];
    for (let k = 0; k < path.segments.length; k++) {
      let segment = path.segments[k];
      if (segment.selected) {
        selected.push(segment);
      }
    }
  }
  return selected;
}

export function doSelect(ctx: ToolContext, item: paper.Item) {
  // Clone from canvas into tool project
  let cloned = item.clone({
    insert: false,
    deep: true
  });
  cloned.data.original = item;
  cloned.data.style = {};
  ctx.select.addChild(cloned);
  cloned.selected = true;
}

export function selectTool(ctx: ToolContext): GrafeTool {
  const { canvas, foreground, select, snap, style } = ctx;
  const selectTool = new GrafeTool(ctx);
  let dragState: DragState = {
    type: "itemselect"
  };
  selectTool.onActivate = function() {
    dragState = {
      type: "itemselect"
    };
  };

  selectTool.onDeactivate = function() {};

  selectTool.onKeyDown = function(event: KeyboardEvent) {
    console.log(event);
    if (event.key === "control") {
      select.children.forEach(child => {
        child.selected = false;
      });
      select.bounds.selected = true;
      select.position.selected = true;
      select.bounds.center.selected = true;
    }
  };
  selectTool.onKeyUp = function(event: KeyboardEvent) {
    if (event.key === "control") {
      select.children.forEach(child => {
        child.selected = true;
      });
      select.bounds.selected = false;
      select.position.selected = false;
    }
  };

  selectTool.onMouseDown = function(event: paper.ToolEvent) {
    // Check to see if we hit handles/segments
    const handleHit = select.hitTest(event.point, {
      segments: true,
      handles: true,
      fill: false,
      stroke: false,
      match: result => result.type == "segment" || result.segment.selected,
      tolerance: 10
    });

    if (handleHit) {
      if (handleHit.type == "segment") {
        if (!event.modifiers.shift && !handleHit.segment.selected) {
          selectedSegments(foreground).forEach(segment => {
            segment.selected = false;
          });
        }
        handleHit.segment.selected = true;
        //handleHit.segment.handleIn.selected = false;
        dragState = { type: "movingsegment" };
      } else {
        if (handleHit.type == "handle-in") {
          dragState = {
            type: "movinghandle",
            handle: "handle-in",
            start: handleHit.segment.handleIn.clone(),
            last: handleHit.segment.handleIn.clone()
          };
        } else {
          dragState = {
            type: "movinghandle",
            handle: "handle-out",
            start: handleHit.segment.handleOut.clone(),
            last: handleHit.segment.handleOut.clone()
          };
        }
      }
      return;
    }

    // Check to see if we hit already selected shapes
    const toolHit = select.hitTest(event.point);
    if (toolHit) {
      selectedSegments(foreground).forEach(segment => {
        segment.selected = false;
      });
      if (event.modifiers.shift) {
        let toRemove: paper.Item[] = [];
        for (let i = 0; i < select.children.length; i++) {
          let child = select.children[i];
          if (child.id == toolHit.item.id) continue;
          if (child.data.original) {
            let original: paper.Item = child.data.original;
            original.copyContent(child);
            original.selected = false;
          }
          toRemove.push(child);
        }
        toRemove.forEach(child => child.remove());
      }
      dragState = { type: "movingitem" };
      return;
    }

    // Check to see if we hit any canvas shapes
    const canvasHit = canvas.hitTest(event.point);

    if (!event.modifiers.shift) {
      for (let i = 0; i < select.children.length; i++) {
        let child = select.children[i];
        if (child.data.original) {
          let original: paper.Item = child.data.original;
          original.copyContent(child);
          original.selected = false;
        }
      }
      select.removeChildren();
    }
    if (!canvasHit) {
      dragState = {
        type: "itemselect"
      };
      return;
    }

    // Clone from canvas into tool project
    doSelect(ctx, canvasHit.item);
    dragState = {
      type: "movingitem"
    };
  };

  selectTool.onMouseDrag = function(event: paper.ToolEvent) {
    if (dragState.type == "itemselect") {
      return;
    }

    if (dragState.type == "movingsegment") {
      selectedSegments(foreground).forEach(segment => {
        segment.point = segment.point.add(event.delta);
      });
      return;
    }

    if (dragState.type == "movinghandle") {
      const controlState: MovingHandle = dragState;
      let newHandle = event.point
        .subtract(event.downPoint)
        .add(dragState.start)
        .clone();
      let initialAngleDelta = newHandle.angle - dragState.start.angle;
      let initialScale = newHandle.length / dragState.start.length;

      let currentHandleDelta = dragState.last.angle - dragState.start.angle;
      let currentScale = dragState.last.length / dragState.start.length;

      selectedSegments(foreground).forEach(segment => {
        if (controlState.handle == "handle-in") {
          // angle between initial handle and current handle
          segment.handleIn.angle =
            segment.handleIn.angle - currentHandleDelta + initialAngleDelta;
          segment.handleIn.length =
            (segment.handleIn.length * initialScale) / currentScale;
          if (!event.modifiers.shift) {
            segment.handleOut.angle =
              segment.handleOut.angle - currentHandleDelta + initialAngleDelta;
            segment.handleOut.length =
              (segment.handleOut.length * initialScale) / currentScale;
          }
        } else {
          segment.handleOut.angle =
            segment.handleOut.angle - currentHandleDelta + initialAngleDelta;
          segment.handleOut.length =
            (segment.handleOut.length * initialScale) / currentScale;
          if (!event.modifiers.shift) {
            segment.handleIn.angle =
              segment.handleIn.angle - currentHandleDelta + initialAngleDelta;
            segment.handleIn.length =
              (segment.handleIn.length * initialScale) / currentScale;
          }
        }
      });
      dragState = { ...dragState, last: newHandle };
      return;
    }

    if (dragState.type == "movingitem") {
      for (let i = 0; i < select.children.length; i++) {
        let item = select.children[i];
        item.position = item.position.add(event.delta);
      }
    }
  };

  selectTool.onMouseUp = function(event: paper.ToolEvent) {
    if (dragState.type == "itemselect") {
      return;
    }

    dragState = { type: "itemselect" };

    for (let i = 0; i < select.children.length; i++) {
      let child = select.children[i];
      if (child.data.original) {
        let original: paper.Item = child.data.original;
        original.copyContent(child);
        original.selected = false;
      }
    }
  };

  return selectTool;
}
