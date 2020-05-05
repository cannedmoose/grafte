import * as paper from "paper";
/*
TODO(P3) Make multiple views more efficient 
A few things:
Page should only be drawn when explicitely asked to be
EITHER THAT OR PAGE IS DRAWN AND THEN WE JUST USE RENDERED PAGE TO DRAW OTHER VIEWS

OR WE DRAW TO A VIEW THE SIZE OF PROJECT BOUNDS (have to work that out from layers) then do a similar thing
if we have multiple overlapping views we could do one draw

OR we cache between drawers
eg if we're drawing 40 objects:
we split it into 4 canvases of 10 objects each
This would need to be per view though and could get exxy
Unless we do them all at the highest resolution needed....

HMMM THE OTHER OTHER OTHER THING WE COULD DO IS SELECTIVE INVALIDATION
when an object changes we invalidate it's old bounds + it's new bounds
we clear both those rects
we redraw anything that overlaps them (this could be good cause we skip views too)


as a stop gap I think it should be enough to:
-- let views specify their own framerate (preview shouldn't update more than 24 times a second, page shouldn't update at all, viewport should update in realtime)

maybe fake view changes
eg if we render a slightly bigger view then zooming out doesn't need a re-render (maybe)


OR CACHE PATH ITEMS...
*/



export interface Resource<T> {
  key: string;

  content: T;

  addCallback(callback: Callback<T>): void;
  removeCallback(callback: Callback<T>): void;
}

export type Callback<T> = (resource: Resource<T>) => void;

export class LocalStorageResource implements Resource<string> {
  key: string;
  _content: string;
  callbacks: Callback<string>[];

  constructor(key: string) {
    this.key = key;
    this.callbacks = [];
    this.loadContent();
  }

  loadContent() {
    this._content = window.localStorage.getItem(this.key) || "";
  }

  get content(): string {
    return this._content;
  }

  set content(newContent: string) {
    this._content = newContent;
    window.localStorage.setItem(this.key, newContent);

    this.callbacks.forEach(c => c(this));
  }

  addCallback(callback: Callback<string>): void {
    this.callbacks.push(callback);
  }
  removeCallback(callback: Callback<string>): void {
    this.callbacks = this.callbacks.filter(c => c !== callback);
  }
}

export class StringResource implements Resource<string> {
  key: string;
  _content: string;
  callbacks: Callback<string>[];

  constructor(key: string, initalContent: string) {
    this.key = key;
    this.callbacks = [];
    this._content = initalContent;
  }

  get content(): string {
    return this._content;
  }

  set content(newContent: string) {
    this._content = newContent;
    this.callbacks.forEach(c => c(this));
  }

  addCallback(callback: Callback<string>): void {
    this.callbacks.push(callback);
  }
  removeCallback(callback: Callback<string>): void {
    this.callbacks = this.callbacks.filter(c => c !== callback);
  }
}

export class BackedResource<T, BT> implements Resource<T> {
  key: string;
  _content: T;
  backing: Resource<BT>;

  callbacks: Callback<T>[];

  constructor(backing: Resource<BT>) {
    this.key = backing.key;
    this.backing = backing;
    this.backingChanged = this.backingChanged.bind(this);

    this.callbacks = [];

    this.loadBacking();
    this.backing.addCallback(this.backingChanged);
  }

  loadBacking() { }
  setBacking() { }

  backingChanged(backing: Resource<BT>) {
    this.loadBacking();
    this.callbacks.forEach(c => c(this));
  }

  get content(): T {
    return this._content;
  }

  set content(newContent: T) {
    this._content = newContent;

    this.backing.removeCallback(this.backingChanged);
    this.setBacking();
    this.backing.addCallback(this.backingChanged);

    this.callbacks.forEach(c => c(this));
  }

  addCallback(callback: Callback<T>): void {
    this.callbacks.push(callback);
  }
  removeCallback(callback: Callback<T>): void {
    this.callbacks = this.callbacks.filter(c => c !== callback);
  }
}

// TODO(P3) this is unsafe, type the JSON.
type JSONN = any;

export class JSONResource extends BackedResource<JSONN, string> {
  loadBacking() {
    this._content = JSON.parse(this.backing.content || "{}");
  }
  setBacking() {
    this.backing.content = JSON.stringify(this._content);
  }
}

export class ProjectResource extends BackedResource<paper.Project, JSONN> {
  loadBacking() {
    let size = this.backing.content.size;
    let project = this.backing.content.project;

    if (!size) size = [600, 400];
    if (!project) project = {};

    if (!this._content) {
      paper.activate();
      paper.install(window);
      this._content = new paper.Project(size);
      this._content.view.drawSelection = false;
      this._content.view.autoUpdate = false;


      //TODO(P3) consider where to put project style setup.
      this._content.currentStyle.strokeWidth = 1;
      this._content.currentStyle.strokeColor = new paper.Color("black");
      this._content.currentStyle.strokeCap = "round";
      this._content.currentStyle.strokeJoin = "round";
     
    }

    this._content.clear();
    this._content.importJSON(JSON.stringify(this.backing.content));
  }
  setBacking() {
    this.backing.content = {
      size: [this._content.view.size.width, this._content.view.size.height],
      project: this._content.exportJSON({ asString: false })
    };
  }
}

interface ResourceTypes {
  "project": paper.Project,
  "string": string,
  "json": JSONN
}

interface ResourceRef<T extends keyof ResourceTypes> {
  type: T,
  resource: Resource<ResourceTypes[T]>
}

class ResourceStore {
  resources: Map<string, ResourceRef<any>[]>;
  constructor() {
    this.resources = new Map();
  }

  getResource<T extends keyof ResourceTypes>(type: T, key: string, inMemoryCreate = false): Resource<ResourceTypes[T]> {
    let existing = this.resources.get(key);
    if (!existing) {
      existing = [];
      this.resources.set(key, existing);
    }

    const sameType = existing.find(ref => ref.type == type);
    if (sameType) {
      return sameType.resource;
    }

    const newResource = this.createResource(type, key, inMemoryCreate);
    existing.push({ type, resource: newResource });

    return newResource;
  }

  createResource<T extends keyof ResourceTypes>(type: T, key: string, inMemory = true): Resource<ResourceTypes[T]> {
    switch (type) {
      case "string":
        if (inMemory) {
          return new StringResource(key, "");
        } else {
          return new LocalStorageResource(key);
        }
      case "json":
        return new JSONResource(this.getResource("string", key, inMemory));
      case "project":
        return new ProjectResource(this.getResource("json", key, inMemory));
      default:
        throw `Invalid resource type ${type}`;
    }
  }
}

// TODO(P1) list all resources of givent type

// TODO(P1) allow inserting resource
// want to have an "active project resource"
// so that we can have things just using the active project and be aware when they change.

// TODO(P1) allow views as a resource
// want to encode size and center

export const Store = new ResourceStore();