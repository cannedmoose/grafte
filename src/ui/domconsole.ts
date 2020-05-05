import { AttachedPaneer } from "./paneer/paneer";
import { Tab } from "./components/panes/pane";
import { textArea } from "./utils/dom";
import { Serializer } from "./utils/deserializer";

/**
 *     // @ts-ignore
    window.console = {
      log:(...optionalParams: any[]) => {
        el.value += ("> " + JSON.stringify(optionalParams) + "\n");
        el.scrollTop = el.scrollHeight;
      },
      error:(...optionalParams: any[]) => {
        el.value += ("> " + JSON.stringify(optionalParams) + "\n");
        el.scrollTop = el.scrollHeight;
      },
      clear: () => { el.value = ""},
      warn:(...optionalParams: any[]) => {
        el.value += ("> " + JSON.stringify(optionalParams) + "\n");
        el.scrollTop = el.scrollHeight;
      },
    }
 */
export class DOMConsole extends AttachedPaneer implements Tab, Console {
  tab: true = true;
  label = "Console";
  el: HTMLTextAreaElement;

  oldConsole: Console;

  constructor() {
    super(textArea({ readonly: "true" }));
    this.el = this.element as HTMLTextAreaElement;
    this.element.style.width = "100%";
    this.element.style.height = "100%";
    this.element.style.border = "none";
    this.element.style.resize = "none";

    this.oldConsole = window.console;
    // @ts-ignore
    window.console = this;
  }

  get memory(): any {
    return this.oldConsole.memory;
  }

  addLine(line: string) {
    // TODO(P2) include time, max log size and collapse repeated 
    this.el.value += "> " + line + "\n";
    this.el.scrollTop = this.el.scrollHeight;
  }

  assert(condition?: boolean | undefined, message?: string | undefined, ...data: any[]): void;
  assert(value: any, message?: string | undefined, ...optionalParams: any[]): void;
  assert(value?: any, message?: any, ...optionalParams: any[]) {
    try {
      this.oldConsole.assert(value, message, optionalParams)
    } catch (e) {
      this.addLine(e.message);
    }
  }
  count(label?: string | undefined): void;
  count(label?: string | undefined): void;
  count(label?: any) {
    this.oldConsole.count(label);
    throw new Error("Method not implemented.");
  }
  debug(message?: any, ...optionalParams: any[]): void;
  debug(message?: any, ...optionalParams: any[]): void;
  debug(message?: any, ...optionalParams: any[]) {
    this.log(message, ...optionalParams);
  }
  dir(value?: any, ...optionalParams: any[]): void;
  dir(obj: any, options?: NodeJS.InspectOptions | undefined): void;
  dir(obj?: any, options?: any, ...rest: any[]) {
    this.oldConsole.dir(obj, options, rest);
    throw new Error("Method not implemented.");
  }
  dirxml(value: any): void;
  dirxml(...data: any[]): void;
  dirxml(value?: any, ...rest: any[]) {
    this.oldConsole.dirxml(value, rest);
    throw new Error("Method not implemented.");
  }
  error(message?: any, ...optionalParams: any[]): void;
  error(message?: any, ...optionalParams: any[]): void;
  error(message?: any, ...optionalParams: any[]) {
    // TODO(P2) highlight red.
    this.log(message, optionalParams);
  }
  exception(message?: string | undefined, ...optionalParams: any[]): void {
    // TODO(P2) highlight red.
    this.error(message, optionalParams);
  }
  group(groupTitle?: string | undefined, ...optionalParams: any[]): void;
  group(...label: any[]): void;
  group(groupTitle?: any, ...optionalParams: any[]) {
    this.oldConsole.group(groupTitle, optionalParams);
    throw new Error("Method not implemented.");
  }
  groupCollapsed(groupTitle?: string | undefined, ...optionalParams: any[]): void;
  groupCollapsed(...label: any[]): void;
  groupCollapsed(groupTitle?: any, ...optionalParams: any[]) {
    this.oldConsole.groupCollapsed(groupTitle, optionalParams);
    throw new Error("Method not implemented.");
  }
  groupEnd(): void;
  groupEnd(): void;
  groupEnd() {
    this.oldConsole.groupEnd();
    throw new Error("Method not implemented.");
  }
  info(message?: any, ...optionalParams: any[]): void;
  info(message?: any, ...optionalParams: any[]): void;
  info(message?: any, ...optionalParams: any[]) {
    this.log(message, optionalParams);
  }
  log(message?: any, ...optionalParams: any[]): void;
  log(message?: any, ...optionalParams: any[]): void;
  log(message?: any, ...optionalParams: any[]) {
    const line = String(message) + (optionalParams.length > 0 ? JSON.stringify(optionalParams) : "");
    this.addLine(line);
    this.oldConsole.log(message, optionalParams);
  }
  markTimeline(label?: string | undefined): void {
    this.oldConsole.markTimeline(label);
    throw new Error("Method not implemented.");
  }
  profile(reportName?: string | undefined): void;
  profile(label?: string | undefined): void;
  profile(label?: any) {
    this.oldConsole.profile(label);
    throw new Error("Method not implemented.");
  }
  profileEnd(reportName?: string | undefined): void;
  profileEnd(label?: string | undefined): void;
  profileEnd(label?: any) {
    this.oldConsole.profileEnd(label);
    throw new Error("Method not implemented.");
  }
  table(...tabularData: any[]): void;
  table(tabularData: any, properties?: string[] | undefined): void;
  table(tabularData?: any, properties?: any, ...rest: any[]) {
    this.oldConsole.table(tabularData, properties, rest);
    throw new Error("Method not implemented.");
  }
  time(label?: string | undefined): void;
  time(label?: string | undefined): void;
  time(label?: any) {
    this.oldConsole.time(label);
    throw new Error("Method not implemented.");
  }
  timeEnd(label?: string | undefined): void;
  timeEnd(label?: string | undefined): void;
  timeEnd(label?: any) {
    this.oldConsole.timeEnd(label);
    throw new Error("Method not implemented.");
  }
  timeStamp(label?: string | undefined): void;
  timeStamp(label?: string | undefined): void;
  timeStamp(label?: any) {
    this.oldConsole.timeStamp(label);
    throw new Error("Method not implemented.");
  }
  timeline(label?: string | undefined): void {
    this.oldConsole.timeline(label);
    throw new Error("Method not implemented.");
  }
  timelineEnd(label?: string | undefined): void {
    this.oldConsole.timelineEnd(label);
    throw new Error("Method not implemented.");
  }
  trace(message?: any, ...optionalParams: any[]): void;
  trace(message?: any, ...optionalParams: any[]): void;
  trace(message?: any, ...optionalParams: any[]) {
    this.oldConsole.trace(message, optionalParams);
    throw new Error("Method not implemented.");
  }
  warn(message?: any, ...optionalParams: any[]): void;
  warn(message?: any, ...optionalParams: any[]): void;
  warn(message?: any, ...optionalParams: any[]) {
    this.log(message, optionalParams);
  }

  Console: NodeJS.ConsoleConstructor;
  countReset(label?: string | undefined): void {
    this.oldConsole.countReset(label);
    throw new Error("Method not implemented.");
  }
  timeLog(label?: string | undefined, ...data: any[]): void {
    this.oldConsole.timeLog(label, data);
    throw new Error("Method not implemented.");
  }
}

Serializer.register(
  DOMConsole,
  (raw: any) => {
    return new DOMConsole();
  },
  (raw: DOMConsole) => {
    return {};
  }
);