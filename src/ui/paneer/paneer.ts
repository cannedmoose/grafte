import { v4 as uuidv4 } from 'uuid';

const DEBUG = true;
const PANEER_ID_ATTRIB = "data-paneer-id";
let NodeMap: Map<string, Paneer> = new Map();

export function elementToPaneer(element: Element): Paneer | undefined {
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

export interface Paneer {
  paneer: true,
  id: string,
  element?: HTMLElement,

  attached?(): void,
  detached?(oldElement: HTMLElement): void
}

export class Paneer {
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

  attach<T extends this>(el: HTMLElement): AttachedPaneer & T{
    if (this.element == el) {
      el.setAttribute(PANEER_ID_ATTRIB, this.id);
      NodeMap.set(this.id, this);
      return this as AttachedPaneer & T;
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

    return this as AttachedPaneer & T;
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
    // TODO(P2) figure out proper lifecycle for nodemap removal
    // At the moment remove + destruct will clear node tree.
    if(destruct) {
      for (let descendent of this.descendents(isPaneer)) {
        descendent.remove(true);
      }
      NodeMap.delete(this.id);
      if (this.element) {
        const oldEl = this.element;
        this.element.remove();
        this.element = undefined;
        if (this.detached) this.detached(oldEl);
        return;
      }
    };
    if (!isAttached(this)) return;
    this.element.remove();
  }

  next<T extends Paneer>(filter: (el: Paneer) => el is T): T | undefined {
    if (!this.element) return;
    let el = this.element.nextElementSibling;
    if (el) {
      const pan = elementToPaneer(el);
      if (pan && filter(pan)) return pan;
    }
  }

  previous<T extends Paneer>(filter: (el: Paneer) => el is T): T | undefined {
    if (!this.element) return;
    let el = this.element.previousElementSibling;
    if (el) {
      const pan = elementToPaneer(el);
      if (pan && filter(pan)) return pan;
    }
  }

  *nextSiblings<T extends Paneer>(filter: (el: Paneer) => el is T): Generator<T, undefined, undefined> {
    if (!this.element) return;
    let el = this.element.nextElementSibling;
    while (el) {
      const pan = elementToPaneer(el);
      if (pan && filter(pan)) yield pan;
      el = el.nextElementSibling;
    }
    return;
  }

  *previousSiblings<T extends Paneer>(filter: (el: Paneer) => el is T): Generator<T, undefined, undefined> {
    if (!this.element) return;
    let el = this.element.previousElementSibling;
    while (el) {
      const pan = elementToPaneer(el);
      if (pan && filter(pan)) yield pan;
      el = el.nextElementSibling;
    }
    return;
  }

  Ancestor<T extends Paneer>(filter: (el: Paneer) => el is T): T {
    const ancestor = this.ancestor(filter);
    if (!ancestor) throw "BAD ANCESTOR QUERY";
    return ancestor;
  }


  ancestor<T extends Paneer>(filter: (el: Paneer) => el is T): T | undefined {
    return this.ancestors(filter).next().value;
  }

  *ancestors<T extends Paneer>(filter: (el: Paneer) => el is T): Generator<T, undefined, undefined> {
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

  Child<T extends Paneer>(filter: (el: Paneer) => el is T): T {
    return this.Descendent(filter, 1);
  }

  child<T extends Paneer>(filter: (el: Paneer) => el is T): T | undefined {
    return this.descendent(filter, 1);
  }

  children<T extends Paneer>(filter: (el: Paneer) => el is T): T[] {
    return [...this.descendents(filter, 1)];
  }

  Descendent<T extends Paneer>(filter: (el: Paneer) => el is T, maxDepth: number = Infinity): T {
    const descendent = this.descendent(filter, maxDepth);
    if (!descendent) throw "BAD DESCENDENT QUERY";
    return descendent;
  }

  descendent<T extends Paneer>(filter: (el: Paneer) => el is T, maxDepth: number = Infinity): T | undefined {
    return this.descendents(filter, maxDepth).next().value;
  }

  // Breadth first descendent traversal
  *descendents<T extends Paneer>(filter: (el: Paneer) => el is T, maxDepth: number = Infinity): Generator<T, undefined, undefined> {
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

// TODO(P4) the difference between attached/non attached:
//  attached don't take children
//  non attached do (can be created then attached)
//  this could be avoided by taking children on creation...
//  can't think of a nice way to do the template syntax though

export interface AttachedPaneer extends Paneer {
  element: HTMLElement;
}

export class AttachedPaneer extends Paneer {
  element: HTMLElement;

  constructor(el: HTMLElement) {
    super();
    this.attach(el);
  }
}

export function isPaneer(el: any): el is Paneer {
  return el && (el as Paneer).paneer;
}

export function isAttached(el: any): el is AttachedPaneer {
  return isPaneer(el) && !!(el as Paneer).element;
}