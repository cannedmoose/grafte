import { v4 as uuidv4 } from 'uuid';
import { div } from '../utils/dom';

const PANEER_ID_ATTRIB = "data-paneer-id";
// TODO(P3) maybe this shouldn't be global...
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

  // TODO(P1) move into a sub class.
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

  // TODO make private
  get parent(): PaneerDOM | undefined {
    if (this._element.parentElement) {
      return elementToPaneer(this._element.parentElement);
    }
    else {
      return undefined;
    }
  }

  // Todo make previous sibling with filter
  get previous(): PaneerDOM | undefined {
    if (this._element.previousElementSibling) {
      return elementToPaneer(this._element.previousElementSibling);
    }
    else {
      return undefined;
    }
  }

  // TODO make next sibling with filter
  get next(): PaneerDOM | undefined {
    if (this._element.nextElementSibling) {
      return elementToPaneer(this._element.nextElementSibling);
    }
    else {
      return undefined;
    }
  }

  // TODO get rid of, should use descendants instead
  get children(): PaneerDOM[] {
    const children: PaneerDOM[] = [];
    for (let i = 0; i < this.element.children.length; i++) {
      const childId = this.element.children[i].getAttribute(PANEER_ID_ATTRIB);
      if (childId) {
        const child = NodeMap.get(childId);
        if (child) {
          children.push(child);
        }
      }

    }
    return children;
  }

  // TODO figure out lifecycle, when to remove from nodemap
  remove(child: PaneerDOM) {
    try {
      this.element.removeChild(child.element);
    } catch {
    }
    return this;
  }

  append(child: PaneerDOM) {
    this.element.appendChild(child.element);
    return this;
  }

  resize() {
    this.children.forEach(child => child.resize());
  }

  ancestor<T>(filter: (el: any) => el is T): T | undefined {
    return this.ancestors(filter).next().value;
  }

  descendent<T>(filter: (el: any) => el is T): T | undefined {
    return this.descendents(filter).next().value;
  }


  *ancestors<T>(filter: (el: any) => el is T): Generator<T, undefined, undefined> {
    let el = this.parent;
    while (el) {
      if(filter(el)) {
        yield el;
      }
      el = el.parent;
    }

    return undefined;
  }

  // Breadth first descendent traversal
  *descendents<T>(filter: (el: any) => el is T, maxDepth: number = Infinity): Generator<T, undefined, undefined> {
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

// Maybe have paneer singleton
// then paneerdom extends it

// WE WANT TO GET RID OF children if possible

/*
Relationships we have:
Parent is this type
Some ancestor is this type
all children are this type
some children are this type and others are another...


I think the best way is an interface like:
FIND THE Nth CHILD that implements this interface

WANT TO AVOID KEEPING REFERENCES TO PANEER NODES THAT ARE IN THE DOM
DOM IS THE SOURCE OF TRUTH


Basically want to go for a typed query selector
this wont prevent us from adding nodes in a bad way but it will allow us to retrieve shiz from the dom

if we use web components we could just get the instance directly...
that could be nice, but we still need to check class/interface

HOW DO WE SAY "WE WANT AN ELEMENT THAT FULFILLS THIS INTERFACE"

maybe we should look into haxe

*/

// Do we use events to bubble up?
// Then we use query selectorish things to bubble down?
// Or just query selectors both ways
// Save events for user interaction...

// TYPED QUERY SELECTOR
// Fuck speed for now?