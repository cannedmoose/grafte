import { v4 as uuidv4 } from 'uuid';

const PANEER_ID_ATTRIB = "data-paneer-id";
// TODO(P3) maybe this shouldn't be global...
let NodeMap: Map<string, PaneerDOM> = new Map();

function elementToPaneer(element: Element): PaneerDOM {
  const id = element.getAttribute(PANEER_ID_ATTRIB);
  if (!id) {
    throw "No id for element " + element;
  }
  const node = NodeMap.get(id);
  if (!node) {
    throw "No node for id " + id;
  }
  return node;
}

export class PaneerDOM {
  _type = "DOM";

  label = "DOM";

  protected _element: HTMLElement;
  protected _id: string;

  constructor(element: HTMLElement) {
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

  get style(): CSSStyleDeclaration  {
    return this._element.style;
  }

  get parent(): PaneerDOM | undefined {
    if (this._element.parentElement) {
      return elementToPaneer(this._element.parentElement);
    }
    else {
      return undefined;
    }
  }

  get previous(): PaneerDOM | undefined {
    if (this._element.previousElementSibling) {
      return elementToPaneer(this._element.previousElementSibling);
    }
    else {
      return undefined;
    }
  }

  get next(): PaneerDOM | undefined {
    if (this._element.nextElementSibling) {
      return elementToPaneer(this._element.nextElementSibling);
    }
    else {
      return undefined;
    }
  }

  delete() {
    const parent = this.parent;
    if (parent) {
      parent.remove(this);
    }
    NodeMap.delete(this._id);
  }

  remove(child: PaneerDOM) {
    this.element.removeChild(child.element);
  }

  append(child: PaneerDOM) {
    this.element.appendChild(child.element);
  }

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

  resize() {
    this.children.forEach(child => child.resize());
  }

  is<T extends PaneerDOM>(...typestrings:string[]): this is T {
    return typestrings.indexOf(this._type) >= 0;
  }
}