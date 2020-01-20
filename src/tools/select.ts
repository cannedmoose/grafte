import * as paper from "paper";
import { GrafeTool, ToolContext } from "./tool";
import { GrafeScope } from "../grafe";

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

interface NotDragging {
  type: "notdragging";
}

interface DraggingItem {
  type: "draggingitem";
}

interface DraggingSegment {
  type: "draggingsegment";
}

interface DraggingControl {
  type: "draggingcontrol";
}

type DragState = NotDragging | DraggingItem | DraggingSegment | DraggingControl;

export function selectTool(ctx: ToolContext): GrafeTool {
  const { canvas, foreground, tool, snap, style } = ctx;
  const selectTool = new GrafeTool(ctx);
  let dragState: DragState = {
    type: "notdragging"
  };
  selectTool.onActivate = function() {
    dragState = {
      type: "notdragging"
    };
  };

  selectTool.onMouseDown = function(event: paper.ToolEvent) {
    // hittest
    const toolHit = tool.hitTest(event.point);
    if (toolHit) {
      dragState = { type: "draggingitem" };
      return;
    }

    if (!event.modifiers.shift) {
      for (let i = 0; i < tool.children.length; i++) {
        let child = tool.children[i];
        if (child.data.original) {
          let original: paper.Item = child.data.original;
          original.copyContent(child);
          original.visible = true;
        }
      }
      tool.removeChildren();
    }

    const canvasHit = canvas.hitTest(event.point);
    if (!canvasHit) {
      dragState = {
        type: "notdragging"
      };
      return;
    }

    let cloned = canvasHit.item.clone({ insert: false, deep: true });
    canvasHit.item.visible = false;
    cloned.data.original = canvasHit.item;
    tool.addChild(cloned);
    cloned.selected = true;
    dragState = { type: "draggingitem" };
  };

  selectTool.onMouseDrag = function(event: paper.ToolEvent) {
    if (dragState.type == "notdragging") {
      return;
    }

    for (let i = 0; i < foreground.selectedItems.length; i++) {
      let item = foreground.selectedItems[i];
      item.position = item.position.add(event.delta);
    }
  };

  selectTool.onMouseUp = function(event: paper.ToolEvent) {
    if (dragState.type == "notdragging") {
      return;
    }

    dragState = { type: "notdragging" };

    for (let i = 0; i < tool.children.length; i++) {
      let child = tool.children[i];
      if (child.data.original) {
        let original: paper.Item = child.data.original;
        original.copyContent(child);
      }
    }
  };

  return selectTool;
}

/* EVENTS */
/*
export function selectionToolUpdate(
  scope: GrafeScope,
  event: ToolEventType
): GrafeScope {
  scope.canvas.activate();
  switch (scope.tool.type) {
    case "noselection":
      return onNoSelection(scope, event);
    case "draggingobject":
      return onDraggingObject(scope, event);
    case "selected":
      return onSelected(scope, event);
    case "draggingcontrol":
      return onDraggingControl(scope, event);
    case "dragginghandle":
      return onDraggingHandle(scope, event);
    default:
      return scope;
  }
}

function onNoSelection(scope: GrafeScope, event: ToolEventType): GrafeScope {
  // Ensure nothing is selected
  paper.project.deselectAll();

  // Early exit to avoid hittest unless mouse down
  switch (event.type) {
    case "mousemove":
    case "keydown":
    case "keyup":
    case "mouseup":
      return { ...scope, tool: { type: "noselection" } };
  }

  console.log("MOUSE DOWN");

  // hittest
  const mouseEvent = event.event;
  const hitResult = paper.project.hitTest(mouseEvent.point);
  if (!hitResult) {
    return { ...scope, tool: { type: "noselection" } };
  }
  const hitResultItem = hitResult.item;
  if (hitResultItem.className == "Path") {
    // Note fully selected should change depending if there are multiple...
    (hitResultItem as paper.Path).selected = true;
  }

  switch (event.type) {
    case "mousedown":
      hitResultItem.selected = true;
      return {
        ...scope,
        tool: {
          type: "draggingobject",
          initialPoint: mouseEvent.point,
          delta: new paper.Point(0, 0)
        }
      };
  }
}

function onDraggingObject(scope: GrafeScope, event: ToolEventType): GrafeScope {
  switch (event.type) {
    case "keydown":
      if (event.event.key == "escape") {
        paper.project.deselectAll();
        return { ...scope, tool: { type: "noselection" } };
      }
      return { ...scope };
    case "keyup":
      return { ...scope };
  }

  if (!(scope.tool.type == "draggingobject")) return { ...scope };
  let tool = scope.tool;

  let delta = event.event.point.subtract(event.event.downPoint);

  switch (event.type) {
    case "mousemove":
      paper.project.selectedItems.forEach(selected => {
        selected.position = selected.position.subtract(tool.delta).add(delta);
      });
      return { ...scope, tool: { ...tool, delta } };
    case "mouseup":
      return { ...scope, tool: { type: "selected" } };

    // Escape hatch, pretend we are noSelection
    case "mousedown":
      return onNoSelection(scope, event);
  }
}

function onSelected(scope: GrafeScope, event: ToolEventType): GrafeScope {
  switch (event.type) {
    case "keydown":
      if (event.event.key == "escape") {
        paper.project.deselectAll();
        return { ...scope, tool: { type: "noselection" } };
      }
      return { ...scope };
    case "keyup":
    case "mousemove":
    case "mouseup":
      return { ...scope };
  }

  // hittest controls of currently selected
  const mouseEvent = event.event;

  for (let i = 0; i < paper.project.selectedItems.length; i++) {
    const selected = paper.project.selectedItems[i];
    // TODO skip handles unless segment is selected
    const handleHit = selected.hitTest(mouseEvent.point, {
      segments: true,
      handles: true,
      fill: false,
      stroke: false,
      match: result => result.type == "segment" || result.segment.selected,
      tolerance: 10
    });

    if (!handleHit) {
      continue;
    }

    handleHit.segment.selected = true;

    if (handleHit.type == "handle-in") {
      return {
        ...scope,
        tool: {
          type: "dragginghandle",
          handle: "in",
          initialPoint: handleHit.segment.point,
          initialHandle: handleHit.segment.handleIn,
          handleDelta: handleHit.segment.handleIn
        }
      };
    } else if (handleHit.type == "handle-out") {
      return {
        ...scope,
        tool: {
          type: "dragginghandle",
          handle: "out",
          initialPoint: handleHit.segment.point,
          initialHandle: handleHit.segment.handleOut,
          handleDelta: handleHit.segment.handleOut
        }
      };
    } else if (handleHit.type == "segment") {
      return {
        ...scope,
        tool: {
          type: "draggingcontrol",
          initialPoint: mouseEvent.point,
          delta: new paper.Point(0, 0)
        }
      };
    }
  }

  // No handles...
  if (!event.event.modifiers.shift == true) {
    paper.project.deselectAll();
  }

  const hitResult = paper.project.hitTest(mouseEvent.point);
  // Hittest everything else
  if (!hitResult) {
    return {
      ...scope,
      tool: { type: "noselection" }
    };
  }
  const hitResultItem = hitResult.item;
  if (hitResultItem.className == "Path") {
    // Note fully selected should change depending if there are multiple...
    (hitResultItem as paper.Path).selected = true;
  }
  return {
    ...scope,
    tool: {
      type: "draggingobject",
      initialPoint: mouseEvent.point,
      delta: new paper.Point(0, 0)
    }
  };
}

function onDraggingControl(
  scope: GrafeScope,
  event: ToolEventType
): GrafeScope {
  switch (event.type) {
    case "keydown":
      if (event.event.key == "escape") {
        return {
          ...scope,
          tool: { type: "selected" }
        };
      }
      return { ...scope };
    case "mouseup":
      return {
        ...scope,
        tool: { type: "selected" }
      };
    // Escape hatch, pretend we aen't dragging
    case "mousedown":
      return {
        ...scope,
        tool: { type: "selected" }
      };
    case "keyup":
      return { ...scope };
  }

  if (scope.tool.type != "draggingcontrol") return { ...scope };
  let tool: DraggingControl = scope.tool;
  let delta = event.event.point.subtract(event.event.downPoint);

  paper.project.selectedItems
    .filter(item => item.className == "Path")
    .map(item => item as paper.Path)
    .forEach(item =>
      item.segments
        .filter(segment => segment.selected == true)
        .forEach(segment => {
          segment.point = segment.point.subtract(tool.delta).add(delta);
        })
    );
  return { ...scope, tool: { ...tool, delta } };
}

function onDraggingHandle(scope: GrafeScope, event: ToolEventType): GrafeScope {
  switch (event.type) {
    case "keydown":
      if (event.event.key == "escape") {
        return { ...scope, tool: { type: "selected" } };
      }
      return { ...scope };
    case "mouseup":
      return { ...scope, tool: { type: "selected" } };
    // Escape hatch, pretend we aen't dragging
    case "mousedown":
      return { ...scope, tool: { type: "selected" } };
    case "keyup":
      return { ...scope };
  }

  let newHandle = event.event.point.subtract(event.event.downPoint);
  if (scope.tool.type != "dragginghandle") return { ...scope };
  let tool: DraggingHandle = scope.tool;
  //let handleDelta = newHandle.subtract(state.initialHandle);
  // Angle between new handle and initial handle
  let initialAngleDelta = newHandle.angle - tool.initialHandle.angle;
  let initialScale = newHandle.length / tool.initialHandle.length;
  let currentHandleDelta = tool.handleDelta.angle - tool.initialHandle.angle;
  let currentScale = tool.handleDelta.length / tool.initialHandle.length;

  paper.project.selectedItems
    .filter(item => item.className == "Path")
    .map(item => item as paper.Path)
    .forEach(item =>
      item.segments
        .filter(segment => segment.selected == true)
        .forEach(segment => {
          if (tool.handle == "in") {
            // angle between initial handle and current handle
            segment.handleIn.angle =
              segment.handleIn.angle + currentHandleDelta + initialAngleDelta;
            segment.handleIn.length =
              segment.handleIn.length * initialScale * currentScale;
            if (!event.event.modifiers.shift) {
              segment.handleOut.angle =
                segment.handleOut.angle +
                currentHandleDelta +
                initialAngleDelta;
              segment.handleOut.length =
                segment.handleOut.length * initialScale * currentScale;
            }
          } else {
            segment.handleOut.angle =
              segment.handleOut.angle +
              (currentHandleDelta + initialAngleDelta);
            segment.handleOut.length =
              segment.handleOut.length * initialScale * currentScale;
            if (!event.event.modifiers.shift) {
              segment.handleIn.angle =
                segment.handleIn.angle + currentHandleDelta + initialAngleDelta;
              segment.handleIn.length =
                segment.handleIn.length * initialScale * currentScale;
            }
          }
        })
    );
  return { ...scope, tool: { ...tool, handleDelta: newHandle } };
}
*/
