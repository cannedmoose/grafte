

// TODO accept HTMLElement/PaneerDOM as well :)
type RefCallback = ((t: HTMLElement) => void) | Partial<CSSStyleDeclaration> | string;

export function WrappedPaneer(strings: TemplateStringsArray, ...params: RefCallback[]): HTMLElement {
  // Note this should maybe be randomized
  const REF = "data-ref"

  const callbacks: { ref: string, param: ((t: HTMLElement) => void) | Partial<CSSStyleDeclaration> }[] = [];
  // Combine the templates together
  // Adding ref attributes at splits
  const template = strings
    .reduce((prev: string, current: string, index: number) => {
      const paramIndex = index - 1;
      const param = params[paramIndex]
      if (typeof param == "string") {
        return `${prev}${param}${current}`
      } else {
        const ref = `${REF}${index}`;
        callbacks.push({ ref, param });
        return `${prev} ${ref}="" ${current}`
      }
    });

  const container = document.createElement("div");
  container.innerHTML = template;

  callbacks.map(({ ref, param }) => {
    const el = container.querySelector(`[${ref}]`);
    el?.removeAttribute(ref);
    return { el, param };
  }).forEach(({ el, param }) => {
    if (!el) {
      return;
    }
    const hel = el as HTMLElement;
    if (typeof param === 'function') {
      // is callback function
      param(hel);
    } else {
      for (let key in param) {
        const s = param[key];
        if (s) {
          hel.style[key] = s;
        } else {
          hel.style[key] = "";
        }
      }
    }
  })
  return container;
}

export function PaneerAppend(parent: HTMLElement): (strings: TemplateStringsArray, ...params: RefCallback[]) => HTMLElement {
  return function (strings: TemplateStringsArray, ...params: RefCallback[]) {
    const el = WrappedPaneer(strings, ...params);
    while (el.firstElementChild) {
      parent.append(el.firstElementChild);
    }
    return parent;
  }
}

export function Paneer(strings: TemplateStringsArray, ...params: RefCallback[]): HTMLElement {
  const el = WrappedPaneer(strings, ...params);
  const child = el.firstElementChild;
  if (!child) {
    throw "No Paneer Element";
  }
  return child as HTMLElement;
}