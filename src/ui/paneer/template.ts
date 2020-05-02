import { AttachedPaneer, isAttached, Paneer } from "./paneer";

type PaneerRef =
  RefCallback
  | string
  | number;

type RefCallback =
  ((t: HTMLElement) => void) // Callback function taking a html element
  | Partial<CSSStyleDeclaration> // A style decleration
  | Element // An element to include in the document
  | AttachedPaneer; // An element to include in the document;


function isElement(el: any): el is Element {
  // NOTE hackey, assume if we have a tagName it's an element.
  return el && !!(el as Element).tagName;
}

function WrappedPaneer(strings: TemplateStringsArray, ...params: PaneerRef[]): HTMLElement {
  // Note this should maybe be randomized
  const REF = "data-ref"

  const callbacks: Map<string, RefCallback> = new Map();
  // Combine the templates together
  // Adding ref attributes at splits
  const template = strings
    .reduce((prev: string, current: string, index: number) => {
      const paramIndex = index - 1;
      const param = params[paramIndex]
      if (typeof param == "string" || typeof param == "number") {
        // For strings and numbers insert as is.
        return `${prev}${param}${current}`;
      }
      else if (isElement(param) || isAttached(param)) {
        const ref = `${REF}${index}`;
        callbacks.set(ref, param);
        return `${prev}<div ${ref}="elem"></div>${current}`;
      } else if (typeof param == "function") {
        const ref = `${REF}${index}`;
        callbacks.set(ref, param);
        return `${prev} ${ref}="fn" ${current}`;
      } else {
        const ref = `${REF}${index}`;
        callbacks.set(ref, param);
        return `${prev} ${ref}="style" ${current}`;
      }
    });

  let container = document.createElement("div") as HTMLElement;
  container.innerHTML = template;

  // NOW TRAVERSE CONTAINER FROM BOTTOM UP CALLING CALLBACKS
  // THAT WAY WHEN A REF IS EVALUATED WE KNOW IT'S SUBTREES HAVE ALREADY BEEN
  // 
  function recursiveRefResolve(node: Element, callbacks: Map<string, RefCallback>): HTMLElement | null {
    let child = node.firstElementChild;
    while (child) {
      child = recursiveRefResolve(child, callbacks);
      // Child could have replaced itself...
      child = child?.nextElementSibling || null;
    }

    /* DO ANY REF REPLACEMENT */
    const refs = [...node.attributes].filter(attrib => /^(data-ref\d+)$/.test(attrib.name));
    refs.forEach(ref => {
      const param = callbacks.get(ref.name);
      node.removeAttribute(ref.name);
      if (!param) return;
      const el = node as HTMLElement;
      if (typeof param === 'function') {
        // is callback function
        param(el);
      } else if (isElement(param)) {
        el.replaceWith(param);
        node = param;
      } else if (isAttached(param)) {
        el.replaceWith(param.element)
        node = param.element;
      } else {
        for (let key in param) {
          const s = param[key];
          if (s) {
            el.style[key] = s;
          } else {
            el.style[key] = "";
          }
        }
      }
    });

    return node as HTMLElement;
  }

  container = recursiveRefResolve(container, callbacks) || container;
  return container;
}

export function AppendPan(parent: HTMLElement): (strings: TemplateStringsArray, ...params: PaneerRef[]) => HTMLElement {
  return function (strings: TemplateStringsArray, ...params: RefCallback[]) {
    const el = WrappedPaneer(strings, ...params);
    while (el.firstElementChild) {
      parent.append(el.firstElementChild);
    }
    return parent;
  }
}

export function Pan(strings: TemplateStringsArray, ...params: PaneerRef[]): HTMLElement {
  const el = WrappedPaneer(strings, ...params);
  const child = el.firstElementChild;
  if (!child) {
    throw "No Paneer Element";
  }
  return child as HTMLElement;
}

export function attach(paneer: Paneer): (el: HTMLElement) => void {
  return el => paneer.attach(el);
}