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

type Corner = "topright" | "topleft" | "bottomright" | "bottomleft";
interface MovingBounds {
  type: "movingbounds";
  handle: Corner;
}

interface RotatingItem {
  //TODO;
  type: "movingbounds";
}

interface SegmentSelect {
  type: "segmentselect";
}

interface SegmentMovingItem {
  type: "segmentmovingitem";
}

interface MovingSegment {
  type: "movingsegment";
  wasSelected: boolean;
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
  | SegmentSelect
  | RotatingItem
  | SegmentMovingItem;

export function selectTool(ctx: ToolContext): GrafeTool {
  const { canvas, foreground, select, snap, style } = ctx;
  const selectTool = new GrafeTool(ctx);
  let dragState: DragState = {
    type: "itemselect"
  };
  selectTool.onActivate = function() {
    dragState = {
      type: "segmentselect"
    };
  };

  selectTool.onDeactivate = function() {};

  /**
   * Note if it complains about return it means we're missing a switch
   */
  selectTool.onMouseDown = function(event: paper.ToolEvent): DragState {
    switch (dragState.type) {
      case "itemselect": {
        // Test for select layer bounds (all selected)
        const boundsHit = hitTestBounds(event.point, select);
        if (boundsHit) {
          select.applyMatrix = false;
          select.strokeScaling = false;
          dragState = { type: "movingbounds", handle: boundsHit };
          return updateSelection(ctx, dragState);
        }
        // Test for allready selected item
        const selectHit = select.hitTest(event.point, {
          fill: true,
          stroke: true
        });
        if (selectHit) {
          if (!event.modifiers.shift) {
            deselectAll(ctx, selectHit.item);
          }
          dragState = { type: "movingitem" };
          return updateSelection(ctx, dragState);
        }
        // Test for hit on whole canvas
        const canvasHit = canvas.hitTest(event.point, {
          fill: true,
          stroke: true
        });
        if (canvasHit) {
          if (!event.modifiers.shift) {
            deselectAll(ctx, canvasHit.item);
          } else {
            doSelect(ctx, canvasHit.item);
          }
          dragState = { type: "movingitem" };
          return updateSelection(ctx, dragState);
        }
        // No hit
        deselectAll(ctx);
        return updateSelection(ctx, dragState);
      }
      case "segmentselect": {
        // Segments and selected and selected segment in/out handles
        const handleHit = select.hitTest(event.point, {
          segments: true,
          handles: true,
          fill: false,
          stroke: false,
          match: result => result.type == "segment" || result.segment.selected,
          tolerance: paper.settings.handleSize
        });
        if (handleHit) {
          const wasSelected = handleHit.segment.selected;
          if (handleHit.type == "segment") {
            if (event.modifiers.shift) {
              handleHit.segment.selected = !handleHit.segment.selected;
              if (!handleHit.segment.selected) {
                dragState = { type: "segmentselect" };
              } else {
                dragState = { type: "movingsegment", wasSelected };
              }
            } else {
              if (!wasSelected) {
                selectedSegments(foreground).forEach(segment => {
                  segment.selected = false;
                });
              }
              handleHit.segment.selected = true;
              dragState = { type: "movingsegment", wasSelected };
            }
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
          return updateSelection(ctx, dragState);
        }
        // Test for allready selected item
        const selectHit = select.hitTest(event.point, {
          fill: true,
          stroke: true
        });
        if (selectHit) {
          if (!event.modifiers.shift) {
            deselectAll(ctx, selectHit.item);
          }
          dragState = { type: "segmentmovingitem" };
          return updateSelection(ctx, dragState);
        }
        // Test for hit on whole canvas
        const canvasHit = canvas.hitTest(event.point, {
          fill: true,
          stroke: true
        });
        if (canvasHit) {
          if (!event.modifiers.shift) {
            deselectAll(ctx, canvasHit.item);
          } else {
            doSelect(ctx, canvasHit.item);
          }
          dragState = { type: "segmentmovingitem" };
          return updateSelection(ctx, dragState);
        }
        // No hit
        deselectAll(ctx);
        return updateSelection(ctx, dragState);
      }
      // Default case
      case "movingitem":
      case "segmentmovingitem":
      case "movingsegment":
      case "movinghandle":
      case "movingbounds":
        return updateSelection(ctx, dragState);
    }
  };

  selectTool.onMouseDrag = function(event: paper.ToolEvent): DragState {
    switch (dragState.type) {
      case "itemselect":
      case "segmentselect":
        return updateSelection(ctx, dragState);

      case "movingsegment":
        selectedSegments(foreground).forEach(segment => {
          segment.point = segment.point.add(event.delta);
        });
        return updateSelection(ctx, dragState);
      case "segmentmovingitem":
      case "movingitem":
        for (let i = 0; i < select.children.length; i++) {
          let item = select.children[i];
          item.position = item.position.add(event.delta);
        }
        return updateSelection(ctx, dragState);
      case "movinghandle":
        dragState = draggingHandle(ctx, event, dragState as MovingHandle);
        return updateSelection(ctx, dragState);
      case "movingbounds":
        dragState = draggingBounds(ctx, event, dragState as MovingBounds);
        return updateSelection(ctx, dragState);
    }
  };

  selectTool.onMouseUp = function(event: paper.ToolEvent): DragState {
    if (
      dragState.type == "movingsegment" ||
      dragState.type == "segmentselect"
    ) {
      // TODO make ConstPoint child class of Point
      const zero = new paper.Point(0, 0);
      if (event.delta.isClose(zero, 1)) {
        const handleHit = select.hitTest(event.point, {
          segments: true,
          handles: true,
          fill: false,
          stroke: false,
          match: result => result.type == "segment" || result.segment.selected,
          tolerance: paper.settings.handleSize
        });
        if (handleHit) {
          const wasSelected = handleHit.segment.selected;
          if (handleHit.type == "segment") {
            if (event.modifiers.shift) {
              dragState = { type: "segmentselect" };
            } else if (event.modifiers.alt) {
              const zeroIn = handleHit.segment.handleIn.isClose(zero, 0);
              const zeroOut = handleHit.segment.handleOut.isClose(zero, 0);
              if (zeroIn && zeroOut) {
                // TODO base on prev/next segment
                handleHit.segment.handleOut = new paper.Point(10, 10);
              } else if (!zeroIn && !zeroOut) {
                handleHit.segment.handleOut = new paper.Point(0, 0);
                handleHit.segment.handleIn = new paper.Point(0, 0);
              } else if (zeroIn) {
                handleHit.segment.handleIn = handleHit.segment.handleOut
                  .clone()
                  .multiply(-1);
              } else {
                handleHit.segment.handleOut = new paper.Point(10, 10);
                handleHit.segment.handleIn = new paper.Point(0, 0);
              }
              dragState = { type: "segmentselect" };
            } else {
              selectedSegments(foreground).forEach(segment => {
                segment.selected = false;
              });
              handleHit.segment.selected = wasSelected;
              dragState = { type: "segmentselect" };
            }
            return updateSelection(ctx, dragState);
          }
        }
      }
    }
    // TODO CHECK FOR DOUBLE CLICK
    switch (dragState.type) {
      case "itemselect":
      case "segmentselect":
        return updateSelection(ctx, dragState);

      case "movingbounds":
        select.applyMatrix = true;
      case "movingsegment":
      case "segmentmovingitem":
      case "movingitem":
      case "movinghandle":
        for (let i = 0; i < select.children.length; i++) {
          let child = select.children[i];
          if (child.data.original) {
            let original: paper.Item = child.data.original;
            original.copyContent(child);
            original.selected = false;
          }
        }
        if (
          dragState.type === "movingitem" ||
          dragState.type === "movingbounds"
        ) {
          dragState = { type: "itemselect" };
        } else {
          dragState = { type: "segmentselect" };
        }
        return updateSelection(ctx, dragState);
    }
  };

  return selectTool;
}

function updateSelection(ctx: ToolContext, state: DragState): DragState {
  switch (state.type) {
    case "itemselect":
    case "movingitem":
    case "movingbounds":
      ctx.foreground.deselectAll();
      ctx.select.bounds.selected = true;
      ctx.select.position.selected = true;
      ctx.select.strokeWidth = 1;
      ctx.select.strokeColor = new paper.Color("#009dec");
      ctx.select.fillColor = null;
      ctx.select.opacity = 1;
      return state;

    case "segmentselect":
    case "movingsegment":
    case "segmentmovingitem":
    case "movinghandle":
      ctx.select.bounds.selected = false;
      ctx.select.position.selected = false;
      ctx.select.children.forEach(child => {
        child.selected = true;
      });
      ctx.select.style = new paper.Style({});
      ctx.select.opacity = 0;
      return state;
  }
}

function draggingBounds(
  ctx: ToolContext,
  event: paper.ToolEvent,
  controlState: MovingBounds
): DragState {
  const og = event.downPoint.subtract(ctx.select.bounds.center);
  const delta = event.point.subtract(ctx.select.bounds.center);
  ctx.select.scaling = delta.divide(og);
  switch (controlState.handle) {
    case "topleft":
    case "topright":
    case "bottomright":
    case "bottomleft":
      return controlState;
  }
}

function draggingHandle(
  ctx: ToolContext,
  event: paper.ToolEvent,
  controlState: MovingHandle
): DragState {
  let newHandle = event.point
    .subtract(event.downPoint)
    .add(controlState.start)
    .clone();
  let initialAngleDelta = newHandle.angle - controlState.start.angle;
  let initialScale = newHandle.length / controlState.start.length;

  let currentHandleDelta = controlState.last.angle - controlState.start.angle;
  let currentScale = controlState.last.length / controlState.start.length;

  selectedSegments(ctx.foreground).forEach(segment => {
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
  return { ...controlState, last: newHandle };
}

/** Deselect everything except supplied exception */
export function deselectAll(ctx: ToolContext, except?: paper.Item) {
  let toRemove: paper.Item[] = [];
  let seenExcept = false;
  for (let i = 0; i < ctx.select.children.length; i++) {
    let child = ctx.select.children[i];
    if (except && child.id == except.id) {
      seenExcept = true;
      continue;
    }
    if (child.data.original) {
      let original: paper.Item = child.data.original;
      original.copyContent(child);
      original.selected = false;
    }
    toRemove.push(child);
  }
  toRemove.forEach(child => child.remove());
  if (!seenExcept && except) {
    doSelect(ctx, except);
  }
}

/**
 * Returns selected segments of selected shapes in project
 * @param project
 */
function hitTestBounds(point: paper.Point, item: paper.Item): Corner | null {
  if (item.bounds.topLeft.isClose(point, paper.settings.handleSize)) {
    return "topleft";
  }
  if (item.bounds.bottomLeft.isClose(point, paper.settings.handleSize)) {
    return "bottomleft";
  }
  if (item.bounds.bottomRight.isClose(point, paper.settings.handleSize)) {
    return "bottomright";
  }
  if (item.bounds.topRight.isClose(point, paper.settings.handleSize)) {
    return "topright";
  }
  return null;
}

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

// Select an item
export function doSelect(ctx: ToolContext, item: paper.Item) {
  // Clone from canvas into tool project
  let cloned = item.clone({
    insert: false,
    deep: true
  });
  cloned.data.original = item;
  ctx.select.addChild(cloned);
}
