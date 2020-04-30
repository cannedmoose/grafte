import { v4 as uuidv4 } from 'uuid';
import { div } from '../utils/dom';

const PANEER_ID_ATTRIB = "data-paneer-id";
let NodeMap: Map<string, PaneerDOM> = new Map();

function elementToPaneer(element: Element): PaneerDOM | undefined {
  const id = element.getAttribute(PANEER_ID_ATTRIB);
  if (!id) {
    //throw "No id for element " + element;
    return undefined;
  }
  const node = NodeMap.get(id);
  if (!node) {
    //throw "No node for id " + id;
    return undefined;
  }
  return node;
}

/**
 * What I want:
 * Strongly typed dom
 * 
 */

export class PaneerDOM {
  _type = "DOM";

  // This is only needed for certain elements
  label = "DOM";

  protected _element: HTMLElement;
  protected _id: string;

  constructor(element?: HTMLElement) {
    if (!element) {
      element = div({}, []);
    }
    this._element = element;
    this._id = uuidv4();
    this._element.setAttribute(PANEER_ID_ATTRIB, this._id);
    NodeMap.set(this._id, this);
  }

  get element(): HTMLElement {
    return this._element;
  }

  get id(): string {
    return this._id;
  }

  get style(): Partial<CSSStyleDeclaration> {
    return this._element.style;
  }

  set style(styles: Partial<CSSStyleDeclaration>) {
    for (let key in styles) {
      const s = styles[key];
      if (s) {
        this._element.style[key] = s;
      } else {
        this._element.style[key] = "";
      }
    }
  }

  remove(child: PaneerDOM) {
    try {
      this.element.removeChild(child.element);
    } catch {
    }
    return this;
  }

  append(child: PaneerDOM) {
    this.element.appendChild(child.element);
    return child;
  }

  replace(newChild: PaneerDOM) {
    this.element.replaceWith(newChild.element);
    return this;
  }

  insert(sibling: PaneerDOM) {
    this.element.insertAdjacentElement("afterend", sibling.element);
    return this;
  }

  next<T>(filter: (el: any) => el is T): T | undefined {
    let el = this._element.nextElementSibling;
    if (el) {
      const pan = elementToPaneer(el);
      if (filter(pan)) return pan;
    }
  }

  previous<T>(filter: (el: any) => el is T): T | undefined {
    let el = this._element.previousElementSibling;
    if (el) {
      const pan = elementToPaneer(el);
      if (filter(pan)) return pan;
    }
  }

  *nextSiblings<T>(filter: (el: any) => el is T): Generator<T, undefined, undefined> {
    let el = this._element.nextElementSibling;
    while (el) {
      const pan = elementToPaneer(el);
      if (filter(pan)) yield pan;
      el = el.nextElementSibling;
    }
    return;
  }

  *previousSiblings<T>(filter: (el: any) => el is T): Generator<T, undefined, undefined> {
    let el = this._element.previousElementSibling;
    while (el) {
      const pan = elementToPaneer(el);
      if (filter(pan)) yield pan;
      el = el.nextElementSibling;
    }
    return;
  }

  resize() {
    [...this.descendents(isAny, 1)].forEach(child => child.resize());
  }
  
  Ancestor<T extends PaneerDOM>(filter: (el: PaneerDOM) => el is T): T {
    const ancestor = this.ancestor(filter);
    if (!ancestor) throw "BAD ANCESTOR QUERY";
    return ancestor;
  }

  Descendent<T extends PaneerDOM>(filter: (el: PaneerDOM) => el is T, maxDepth: number = Infinity): T {
    const descendent = this.descendent(filter, maxDepth);
    if (!descendent) throw "BAD DESCENDENT QUERY";
    return descendent;
  }
  

  ancestor<T extends PaneerDOM>(filter: (el: PaneerDOM) => el is T): T | undefined {
    return this.ancestors(filter).next().value;
  }

  descendent<T extends PaneerDOM>(filter: (el: PaneerDOM) => el is T, maxDepth: number = Infinity): T | undefined {
    return this.descendents(filter, maxDepth).next().value;
  }


  *ancestors<T extends PaneerDOM>(filter: (el: PaneerDOM) => el is T): Generator<T, undefined, undefined> {
    let el = this.element.parentElement;
    while (el) {
      const pan = elementToPaneer(el);
      if(pan && filter(pan)) {
        yield pan;
      }
      el = el.parentElement;
    }

    return undefined;
  }

  // Breadth first descendent traversal
  *descendents<T extends PaneerDOM>(filter: (el: PaneerDOM) => el is T, maxDepth: number = Infinity): Generator<T, undefined, undefined> {
    let queue = [];
    queue.push({el: this.element, depth: 1});

    let dequed: {el: Element, depth: number} | undefined;
    while (queue.length > 0) {
      dequed = queue.shift();
      if(!dequed) break;
      for (let child of dequed.el.children) {
        const pan = elementToPaneer(child);
        if (pan && filter(pan)) yield pan;
        if (dequed.depth < maxDepth) {
          queue.push({el: child, depth: dequed.depth + 1});
        }
      }
    }
    return;
  }
}

function isAny(el: PaneerDOM): el is PaneerDOM {
  return true;
}