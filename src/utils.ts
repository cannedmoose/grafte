export function querySelectorOrThrow(query: string): Element {
  let el = document.querySelector(query);
  if (!el) {
    throw "No element for query selector " + query;
  }
  return el;
}

export function createDiv(
  id: string,
  classes: string,
  children: Node[] = []
): HTMLElement {
  let ele = document.createElement("div");
  ele.setAttribute("class", classes);
  if (id) {
    ele.setAttribute("id", id);
  }
  for (let i = 0; i < children.length; i++) {
    ele.appendChild(children[i]);
  }

  return ele;
}

export function createButton(
  classes: string = "",
  text: string = "",
  onClick: (event) => void
): HTMLElement {
  let button = document.createElement("button");
  button.innerText = text;
  button.addEventListener("click", onClick);
  button.setAttribute("class", classes);
  return button;
}

export function createCheckBox(
  classes: string,
  text: string,
  isChecked: Boolean,
  onChange: (event) => void
): HTMLElement {
  let ele = document.createElement("input");
  ele.setAttribute("type", "checkbox");
  ele.setAttribute("class", classes);
  ele.innerText = text;
  if (isChecked) {
    ele.setAttribute("checked", "");
  }
  ele.addEventListener("change", onChange);
  return ele;
}

export function createSlider(
  id: string,
  classes: string,
  value: number,
  min: number,
  max: number,
  onChange: (event) => void
): HTMLElement {
  let ele = document.createElement("input");
  if (id) {
    ele.setAttribute("id", id);
  }
  ele.setAttribute("type", "range");
  ele.setAttribute("class", classes);
  ele.setAttribute("min", min.toString());
  ele.setAttribute("max", max.toString());
  ele.setAttribute("step", "0.01");
  ele.setAttribute("value", value.toString());
  ele.addEventListener("change", onChange);
  return ele;
}

export function createColor(
  id: string,
  classes: string,
  value: string,
  onChange: (event) => void
): HTMLElement {
  let ele = document.createElement("input");
  ele.setAttribute("type", "color");
  if (id) {
    ele.setAttribute("id", id);
  }
  ele.setAttribute("class", classes);
  ele.setAttribute("value", value);
  ele.addEventListener("change", onChange);
  return ele;
}
