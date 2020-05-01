import { v4 as uuidv4 } from 'uuid';

const DEBUG = true;

const PANEER_ID_ATTRIB = "data-paneer-id";
let NodeMap: Map<string, PPaneer> = new Map();

function elementToPaneer(element: Element): PPaneer | undefined {
  const id = element.getAttribute(PANEER_ID_ATTRIB);
  if (!id) {
    //throw "No id for element " + element;
    return undefined;
  }
  const node = NodeMap.get(id);
  if (!node) {
    throw "No node for id " + id;
  }
  return node;
}


export function attach(paneer: PPaneer): (el: HTMLElement) => void {
  return el => paneer.attach(el);
}

type PaneerRef =
  RefCallback
  | string
  | number;

type RefCallback =
  ((t: HTMLElement) => void) // Callback function taking a html element
  | Partial<CSSStyleDeclaration> // A style decleration
  | Element // An element to include in the document
  | AttachedPaneer; // An element to include in the document;

// TODO(P1) the difference between attached/non attached:
//  attached don't take children
//  non attached do (can be created then attached)
//  this could be avoided by taking children on creation...
//  can't think of a nice way to do the syntax in that case at the mo


function isElement(el: any): el is Element {
  // NOTE hackey, assume if we have a tagName it's an element.
  return el && !!(el as Element).tagName;
}

// TODO(P1) cleanup, attach helper 
export function WrappedPaneer(strings: TemplateStringsArray, ...params: PaneerRef[]): HTMLElement {
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

export function PaneerAppend(parent: HTMLElement): (strings: TemplateStringsArray, ...params: PaneerRef[]) => HTMLElement {
  return function (strings: TemplateStringsArray, ...params: RefCallback[]) {
    const el = WrappedPaneer(strings, ...params);
    while (el.firstElementChild) {
      parent.append(el.firstElementChild);
    }
    return parent;
  }
}

export function Paneer(strings: TemplateStringsArray, ...params: PaneerRef[]): HTMLElement {
  const el = WrappedPaneer(strings, ...params);
  const child = el.firstElementChild;
  if (!child) {
    throw "No Paneer Element";
  }
  return child as HTMLElement;
}


/****** NEW PANEER OBJECT FUNCTIONS */

// A class that can be linked to the dom
export interface PPaneer {
  paneer: true,
  id: string,
  element?: HTMLElement,

  attached?(): void,
  detached?(oldElement: HTMLElement): void
}

export class PPaneer {
  paneer: true = true;
  id: string;
  element?: HTMLElement;

  constructor() {
    this.id = uuidv4();
  }

  get style(): Partial<CSSStyleDeclaration> {
    if (!isAttached(this)) return {};
    return this.element.style;
  }

  set style(styles: Partial<CSSStyleDeclaration>) {
    if (!isAttached(this)) return;
    for (let key in styles) {
      const s = styles[key];
      if (s) {
        this.element.style[key] = s;
      } else {
        this.element.style[key] = "";
      }
    }
  }

  attach(el: HTMLElement) {
    if (this.element == el) {
      el.setAttribute(PANEER_ID_ATTRIB, this.id);
      NodeMap.set(this.id, this);
      return;
    }
  
    const oldId = el.getAttribute(PANEER_ID_ATTRIB);
    // Has attribute and is linked in NodeMap
    // Detach it.
    if (oldId && NodeMap.has(oldId)) {
      const oldPan = NodeMap.get(oldId);
      if (oldPan?.detached)
        oldPan?.detached(el);
      NodeMap.delete(oldId);
    }
  
    // if paneer already has an element
    if (this.element) {
      const oldEl = this.element;
      this.element = undefined;
      oldEl.removeAttribute(PANEER_ID_ATTRIB);
      if (this.detached) this.detached(oldEl);
    }
  
    NodeMap.set(this.id, this);
  
    this.element = el;
    el.setAttribute(PANEER_ID_ATTRIB, this.id);
    // TODO(P3) set up better debugging
    if (DEBUG) el.setAttribute("data-DEBUGTYPE", this.constructor.name);
    if (this.attached) {
      this.attached();
    }
  }

  append(child: AttachedPaneer | HTMLElement) {
    if (!isAttached(this)) return;
    if (isAttached(child)) {
      this.element.appendChild(child.element);
    } else {
      this.element.appendChild(child)
    }
  }

  insertAdjacant(sibling: AttachedPaneer, position: InsertPosition = "afterend") {
    if (!isAttached(this)) return;
    this.element.insertAdjacentElement(position, sibling.element);
  }

  clear() {
    if (!isAttached(this)) return;
    while (this.element.firstElementChild) {
      this.element.firstElementChild.remove();
    }
  }

  remove(destruct: boolean = false) {
    // TODO(P1) figure out proper lifecycle for nodemap removal
    if(destruct) NodeMap.delete(this.id);
    if (!isAttached(this)) return;
    this.element.remove();
  }

  next<T extends PPaneer>(filter: (el: PPaneer) => el is T): T | undefined {
    if (!this.element) return;
    let el = this.element.nextElementSibling;
    if (el) {
      const pan = elementToPaneer(el);
      if (pan && filter(pan)) return pan;
    }
  }

  previous<T extends PPaneer>(filter: (el: PPaneer) => el is T): T | undefined {
    if (!this.element) return;
    let el = this.element.previousElementSibling;
    if (el) {
      const pan = elementToPaneer(el);
      if (pan && filter(pan)) return pan;
    }
  }

  *nextSiblings<T extends PPaneer>(filter: (el: PPaneer) => el is T): Generator<T, undefined, undefined> {
    if (!this.element) return;
    let el = this.element.nextElementSibling;
    while (el) {
      const pan = elementToPaneer(el);
      if (pan && filter(pan)) yield pan;
      el = el.nextElementSibling;
    }
    return;
  }

  *previousSiblings<T extends PPaneer>(filter: (el: PPaneer) => el is T): Generator<T, undefined, undefined> {
    if (!this.element) return;
    let el = this.element.previousElementSibling;
    while (el) {
      const pan = elementToPaneer(el);
      if (pan && filter(pan)) yield pan;
      el = el.nextElementSibling;
    }
    return;
  }

  Ancestor<T extends PPaneer>(filter: (el: PPaneer) => el is T): T {
    const ancestor = this.ancestor(filter);
    if (!ancestor) throw "BAD ANCESTOR QUERY";
    return ancestor;
  }


  ancestor<T extends PPaneer>(filter: (el: PPaneer) => el is T): T | undefined {
    return this.ancestors(filter).next().value;
  }

  *ancestors<T extends PPaneer>(filter: (el: PPaneer) => el is T): Generator<T, undefined, undefined> {
    if (!this.element) {
      return;
    }
    let el = this.element.parentElement;
    while (el) {
      const pan = elementToPaneer(el);
      if (pan && filter(pan)) {
        yield pan;
      }
      el = el.parentElement;
    }

    return undefined;
  }

  Child<T extends PPaneer>(filter: (el: PPaneer) => el is T): T {
    return this.Descendent(filter, 1);
  }

  child<T extends PPaneer>(filter: (el: PPaneer) => el is T): T | undefined {
    return this.descendent(filter, 1);
  }

  children<T extends PPaneer>(filter: (el: PPaneer) => el is T): T[] {
    return [...this.descendents(filter, 1)];
  }

  Descendent<T extends PPaneer>(filter: (el: PPaneer) => el is T, maxDepth: number = Infinity): T {
    const descendent = this.descendent(filter, maxDepth);
    if (!descendent) throw "BAD DESCENDENT QUERY";
    return descendent;
  }

  descendent<T extends PPaneer>(filter: (el: PPaneer) => el is T, maxDepth: number = Infinity): T | undefined {
    return this.descendents(filter, maxDepth).next().value;
  }

  // Breadth first descendent traversal
  *descendents<T extends PPaneer>(filter: (el: PPaneer) => el is T, maxDepth: number = Infinity): Generator<T, undefined, undefined> {
    if (!this.element) {
      return;
    }

    let queue = [];
    queue.push({ el: this.element, depth: 1 });

    let dequed: { el: Element, depth: number } | undefined;
    while (queue.length > 0) {
      dequed = queue.shift();
      if (!dequed) break;
      for (let child of dequed.el.children) {
        const pan = elementToPaneer(child);
        if (pan && filter(pan)) yield pan;
        if (dequed.depth < maxDepth) {
          queue.push({ el: child, depth: dequed.depth + 1 });
        }
      }
    }
    return;
  }
}

export interface AttachedPaneer extends PPaneer {
  element: HTMLElement;
}

export class AttachedPaneer extends PPaneer {
  element: HTMLElement;

  constructor(el: HTMLElement) {
    super();
    this.attach(el);
  }
}

export function isPaneer(el: any): el is PPaneer {
  return el && (el as PPaneer).paneer;
}

export function isAttached(el: any): el is AttachedPaneer {
  return isPaneer(el) && !!(el as PPaneer).element;
}
