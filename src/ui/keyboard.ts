/**
 * Class for handling keyboard shortcuts.
 * Shortcut can be registered or unregistered
 * When a shortcut is registered it takes precedence over existing shortcuts that would do the same thing
 * Also want to track what keys are down
 */

type EventHandler = (event: KeyboardEvent) => boolean | void;
type Shortcut = { fn: EventHandler; keys: Set<string> };

export class KeyboardHandler {
  public pressedKeys: Set<string>;

  downShortcuts: { [key: string]: Shortcut[] };
  upShortcuts: { [key: string]: Shortcut[] };

  constructor(el: Element| Window) {
    el.addEventListener("keydown", this.keydown.bind(this));
    el.addEventListener("keyup", this.keyup.bind(this));

    this.pressedKeys = new Set();
    this.downShortcuts = {};
    this.upShortcuts = {};
  }

  /** adds a shortcut given a string of keys seperated by + */
  public addShortcut(
    shortcutString: string,
    fn: EventHandler,
    event: "keydown" | "keyup" = "keydown"
  ) {
    const keys = new Set(shortcutString.split("+"));
    const shortcut = { fn, keys };
    const shortcuts =
      event == "keydown" ? this.downShortcuts : this.upShortcuts;

    keys.forEach(key => {
      if (!shortcuts[key]) {
        shortcuts[key] = [];
      }
      shortcuts[key].push(shortcut);
    });
  }

  /** Removes a shortcut, note that the fn reference should be the same as passed to add */
  public removeShortcut(
    shortcutString: string,
    fn: EventHandler,
    event: "keydown" | "keyup" = "keydown"
  ) {
    const keys = new Set(shortcutString.split("+"));
    const shortcut = { fn, keys };
    const shortcuts =
      event == "keydown" ? this.downShortcuts : this.upShortcuts;

    keys.forEach(key => {
      if (shortcuts[key]) {
        shortcuts[key] = shortcuts[key].filter(s => shortcut != s);
      }
    });
  }

  private keydown(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    this.pressedKeys.add(key);
    const shortcuts = this.downShortcuts[key];

    if (shortcuts) {
      for (let i = shortcuts.length - 1; i >= 0; i--) {
        let shortcut = shortcuts[i];
        let intersection = new Set(
          [...shortcut.keys].filter(x => this.pressedKeys.has(x))
        );
        if (intersection.size == shortcut.keys.size) {
          // TODO should keep some internal state so we can have self remove/adding shortcuts without fucking up this iteration
          shortcut.fn(event);
          break;
        }
      }
    }
  }

  private keyup(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    const shortcuts = this.upShortcuts[key];
    if (shortcuts) {
      for (let i = shortcuts.length - 1; i >= 0; i++) {
        const shortcut = shortcuts[i];
        let intersection = new Set(
          [...shortcut.keys].filter(x => this.pressedKeys.has(x))
        );
        if (intersection.size == shortcut.keys.size) {
          shortcut.fn(event);
          break;
        }
      }
    }

    this.pressedKeys.delete(key);

  }
}
