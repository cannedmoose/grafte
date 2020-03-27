export type NodeDirection = "Horizontal" | "Vertical";

export type Paneer = PaneerNode | PaneerLeaf;

export class PaneerNode {
  // This node in the DOM
  // TODO should we let this be passed in
  private _element: HTMLElement;
  // Direction this Nodes child elements are arranged in
  // NOTE the element takes up all available space in this direction
  private _direction: NodeDirection;
  // Child elements of this node
  private _children: (PaneerNode | PaneerLeaf)[];

  // Sizing for this element
  // NOTE is just a track value for css grid.
  private _sizing: string;

  parent?: PaneerNode;

  constructor(direction: NodeDirection, sizing: string = "auto", children?: Paneer[]) {
    this._element = document.createElement("div");
    this._direction = direction;
    this._sizing = sizing;

    this._children = [...children] || [];

    this._children.forEach(
      child => {
        this._element.appendChild(child.element);
        child.parent = this;
      }
    );

    this.setStyles();
  }

  get element(): HTMLElement {
    return this._element;
  }

  get direction(): NodeDirection {
    return this._direction;
  }

  set direction(direction: NodeDirection) {
    this._direction = direction;
    this.setStyles();
  }

  get sizing(): string {
    return this._sizing;
  }

  set sizing(sizing: string) {
    this._sizing = sizing;
    this.parent?.setStyles();
  }

  getChildren(): Paneer[] {
    return this._children;
  }

  setStyles() {
    this.element.style.display = "grid";
    this.element.style.height = "100%";
    // Set up tracks for children
    const tracks = this._children
      .map((child, index) => `[line${index}] ${child.sizing}`)
      .concat([`[line${this._children.length}]`]) // Add end line
      .join(" ");
    if (this.direction == "Horizontal") {
      this.element.style.gridTemplateColumns = tracks;
      this.element.style.gridTemplateRows = "[start] 100% [end]";
    } else {
      this.element.style.gridTemplateRows = tracks;
      this.element.style.gridTemplateColumns = "[start] 100% [end]";
    }

    // Line children up
    this._children.forEach(
      (child, index) => {
        if (this.direction == "Horizontal") {
          child.element.style.gridColumnStart = `line${index}`;
          child.element.style.gridColumnEnd = `line${index + 1}`;

          child.element.style.gridRowStart = `start`;
          child.element.style.gridRowEnd = `end`;
        } else {
          child.element.style.gridRowStart = `line${index}`;
          child.element.style.gridRowEnd = `line${index + 1}`;

          child.element.style.gridColumnStart = `start`;
          child.element.style.gridColumnEnd = `end`;
        }
      }
    )
    // TODO look at children, do grid and column for them
    // DO WE NEED TO CALL SET STYLE FOR CHILDREN
  }
}

export class PaneerLeaf {
  // This node in the DOM
  element: HTMLElement;
  // Sizing for this element
  // NOTE is just a track value for css grid.
  private _sizing: string;

  parent?: PaneerNode;

  constructor(element: HTMLElement, sizing: string = "auto") {
    this.element = element;
    this._sizing = sizing;
  }

  get sizing(): string {
    return this._sizing;
  }

  set sizing(sizing: string) {
    this._sizing = sizing;
    this.parent?.setStyles();
  }
}