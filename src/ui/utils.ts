export function text(data): Node {
  return document.createTextNode(data);
}

export function select(
  attribs: { [key: string]: string },
  children: Node[],
  events: { [key: string]: (event) => void } = {}
): HTMLSelectElement {
  const el = document.createElement("select");
  elHelper(el, attribs, children, events);
  return el;
}

export function option(
  attribs: { [key: string]: string },
  children: Node[]
): HTMLOptionElement {
  const el = document.createElement("option");
  elHelper(el, attribs, children);
  return el;
}

export function div(
  attribs: { [key: string]: string },
  children: Node[],
  events: { [key: string]: (event) => void } = {}
): HTMLDivElement {
  const el = document.createElement("div");
  elHelper(el, attribs, children, events);
  return el;
}

export function canvas(
  attribs: { [key: string]: string },
  events: { [key: string]: (event) => void } = {}
): HTMLCanvasElement {
  const el = document.createElement("canvas");
  elHelper(el, attribs, [], events);
  return el;
}

export function button(
  attribs: { [key: string]: string },
  children: Node[],
  events: { [key: string]: (event) => void } = {}
): HTMLButtonElement {
  const el = document.createElement("button");
  elHelper(el, attribs, children, events);
  return el;
}

export function checkbox(
  attribs: { [key: string]: string },
  events: { [key: string]: (event) => void } = {}
): HTMLInputElement {
  const el = document.createElement("input");
  el.setAttribute("type", "checkbox");
  elHelper(el, attribs, [], events);
  return el;
}

export function slider(
  attribs: { [key: string]: string },
  events: { [key: string]: (event) => void } = {}
): HTMLInputElement {
  const el = document.createElement("input");
  el.setAttribute("type", "range");
  elHelper(el, attribs, [], events);
  return el;
}

export function color(
  attribs: { [key: string]: string },
  events: { [key: string]: (event) => void } = {}
): HTMLInputElement {
  const el = document.createElement("input");
  el.setAttribute("type", "color");
  elHelper(el, attribs, [], events);
  return el;
}

function elHelper(
  el: HTMLElement,
  attribs: { [key: string]: string },
  children: Node[],
  events: { [key: string]: (event) => void } = {}
): void {
  Object.entries(attribs).forEach(([key, value]) => {
    if (value) el.setAttribute(key, value);
  });

  Object.entries(events).forEach(([key, value]) =>
    el.addEventListener(key, value)
  );

  for (let i = 0; i < children.length; i++) {
    el.appendChild(children[i]);
  }
}

export function queryOrThrow(query: string): Element {
  let el = document.querySelector(query);
  if (!el) {
    throw "No element for query selector " + query;
  }
  return el;
}
