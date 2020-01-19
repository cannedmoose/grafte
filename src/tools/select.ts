import * as paper from "paper";

type ToolEventType =
  | MouseDownEvent
  | MouseUpEvent
  | MouseMoveEvent
  | KeyDownEvent;

export type SelectState =
  | NoSelection
  | DraggingObject
  | Selected
  | DraggingHandle
  | DraggingControl;

interface NoSelection {
  type: "noselection";
}

interface DraggingObject {
  type: "draggingobject";
  initialPoint: paper.Point;
  delta: paper.Point;
}

interface Selected {
  type: "selected";
}

interface DraggingControl {
  type: "draggingcontrol";
  initialPoint: paper.Point;
  delta: paper.Point;
}

interface DraggingHandle {
  type: "dragginghandle";
  handle: "in" | "out";
  initialHandle: paper.Point;
  handleDelta: paper.Point;
  initialPoint: paper.Point;
}

/* EVENTS */

interface MouseDownEvent {
  event: paper.MouseEvent;
  type: "mousedown";
}

interface MouseUpEvent {
  type: "mouseup";
  event: paper.MouseEvent;
}

interface MouseMoveEvent {
  type: "mousemove";
  event: paper.MouseEvent;
}

interface KeyDownEvent {
  type: "keydown";
  event: paper.KeyEvent;
}

export function selectionToolUpdate(
  state: SelectState,
  event: ToolEventType
): SelectState {
  switch (state.type) {
    case "noselection":
      return onNoSelection(event);
    case "draggingobject":
      return onDraggingObject(event, state);
    case "selected":
      return onSelected(event, state);
    case "draggingcontrol":
      return onDraggingControl(event, state);
    case "dragginghandle":
      return onDraggingHandle(event, state);
  }
}

function onNoSelection(event: ToolEventType): SelectState {
  // Ensure nothing is selected
  paper.project.deselectAll();

  // Early exit to avoid hittest unless mouse down
  switch (event.type) {
    case "mousemove":
      return { type: "noselection" };
    case "keydown":
      return { type: "noselection" };
    case "mouseup":
      return { type: "noselection" };
  }

  // hittest
  const mouseEvent = event.event;
  const hitResult = paper.project.hitTest(mouseEvent.point);
  if (!hitResult) {
    return { type: "noselection" };
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
        type: "draggingobject",
        initialPoint: mouseEvent.point,
        delta: new paper.Point(0, 0)
      };
  }
}

function onDraggingObject(
  event: ToolEventType,
  state: DraggingObject
): SelectState {
  switch (event.type) {
    case "keydown":
      if (event.event.key == "escape") {
        paper.project.deselectAll();
        return { type: "noselection" };
      }
      return { ...state };
  }

  let delta = event.event.point.subtract(state.initialPoint);

  switch (event.type) {
    case "mousemove":
      paper.project.selectedItems.forEach(selected => {
        selected.position = selected.position.subtract(state.delta).add(delta);
      });
      return { ...state, delta };
    case "mouseup":
      return { type: "selected" };

    // Escape hatch, pretend we are noSelection
    case "mousedown":
      return onNoSelection(event);
  }
}

function onSelected(event: ToolEventType, state: Selected): SelectState {
  switch (event.type) {
    case "keydown":
      if (event.event.key == "escape") {
        paper.project.deselectAll();
        return { type: "noselection" };
      }
      return { ...state };
  }

  // Early exit to avoid hittest unless mouse down
  switch (event.type) {
    case "mousemove":
      return { ...state };
    case "mouseup":
      return { ...state };
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
        type: "dragginghandle",
        handle: "in",
        initialPoint: handleHit.segment.point,
        initialHandle: handleHit.segment.handleIn,
        handleDelta: handleHit.segment.handleIn
      };
    } else if (handleHit.type == "handle-out") {
      return {
        type: "dragginghandle",
        handle: "out",
        initialPoint: handleHit.segment.point,
        initialHandle: handleHit.segment.handleOut,
        handleDelta: handleHit.segment.handleOut
      };
    } else if (handleHit.type == "segment") {
      return {
        type: "draggingcontrol",
        initialPoint: mouseEvent.point,
        delta: new paper.Point(0, 0)
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
    return { type: "noselection" };
  }
  const hitResultItem = hitResult.item;
  if (hitResultItem.className == "Path") {
    // Note fully selected should change depending if there are multiple...
    (hitResultItem as paper.Path).selected = true;
  }
  return {
    type: "draggingobject",
    initialPoint: mouseEvent.point,
    delta: new paper.Point(0, 0)
  };
}

function onDraggingControl(
  event: ToolEventType,
  state: DraggingControl
): SelectState {
  switch (event.type) {
    case "keydown":
      if (event.event.key == "escape") {
        return { type: "selected" };
      }
      return { ...state };
    case "mouseup":
      return { type: "selected" };
    // Escape hatch, pretend we aen't dragging
    case "mousedown":
      return { type: "selected" };
  }

  let delta = event.event.point.subtract(state.initialPoint);

  paper.project.selectedItems
    .filter(item => item.className == "Path")
    .map(item => item as paper.Path)
    .forEach(item =>
      item.segments
        .filter(segment => segment.selected == true)
        .forEach(segment => {
          segment.point = segment.point.subtract(state.delta).add(delta);
        })
    );
  return { ...state, delta };
}

function onDraggingHandle(
  event: ToolEventType,
  state: DraggingHandle
): SelectState {
  switch (event.type) {
    case "keydown":
      if (event.event.key == "escape") {
        return { type: "selected" };
      }
      return { ...state };
    case "mouseup":
      return { type: "selected" };
    // Escape hatch, pretend we aen't dragging
    case "mousedown":
      return { type: "selected" };
  }

  let newHandle = event.event.point.subtract(state.initialPoint);
  //let handleDelta = newHandle.subtract(state.initialHandle);
  // Angle between new handle and initial handle
  let initialAngleDelta = newHandle.angle - state.initialHandle.angle;
  let initialScale = newHandle.length / state.initialHandle.length;
  let currentHandleDelta = state.handleDelta.angle - state.initialHandle.angle;
  let currentScale = state.handleDelta.length / state.initialHandle.length;

  paper.project.selectedItems
    .filter(item => item.className == "Path")
    .map(item => item as paper.Path)
    .forEach(item =>
      item.segments
        .filter(segment => segment.selected == true)
        .forEach(segment => {
          if (state.handle == "in") {
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
  return { ...state, handleDelta: newHandle };
}
