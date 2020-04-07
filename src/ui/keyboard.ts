import hotkeys from "hotkeys-js";

export interface KeyboardOptions {
  element?: HTMLElement,
  keyup?: boolean,
  keydown?: boolean,
  splitkey?: string,
  scope?: string,
  global?: boolean
}

export class Keyboard {
  DEFAULT_SCOPE = "global";
  EDITOR_SCOPE = "editor";

  constructor() {
    hotkeys.setScope(this.DEFAULT_SCOPE);
    hotkeys.filter = (event: KeyboardEvent) => {
      // Reset scope depending on target.
      var tagName = (event.target as HTMLElement || event.srcElement)?.tagName;
      if (/^(TEXTAREA)$/.test(tagName)) {
        hotkeys.setScope(this.EDITOR_SCOPE);
      } else if (hotkeys.getScope() == this.EDITOR_SCOPE) {
        hotkeys.setScope(this.DEFAULT_SCOPE);
      }
      return true;
    }
  }


  bind(keys: string, options: KeyboardOptions, callback: (event: KeyboardEvent, handler: any) => void) {
    hotkeys(keys, { ...options, scope:options.scope || this.DEFAULT_SCOPE }, callback);
    if (options.global) {
      hotkeys(keys, { ...options, scope: "editor" }, callback);
    }
  }

  unbind(keys: string, options?: { scope?: string, global?: boolean }) {
    hotkeys.unbind(keys, (options && options.scope) ? options.scope : this.DEFAULT_SCOPE);
    if (options && options.global) {
      hotkeys.unbind(keys, "editor");
    }
  }

  isPressed(key: number):boolean {
    return hotkeys.isPressed(key);
  }

  getScope(): string {
    return hotkeys.getScope();
  }

  setScope(scope: string) {
    return hotkeys.setScope(scope);
  }
}