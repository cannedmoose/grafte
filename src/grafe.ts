import { Snap } from "./snaps/snaps";

// SHOULD NEVER BE STORED
export interface GrafeScope {
  foreground: paper.Project;
  // A WRITE TO CANVAS IS A COMMIT
  // This will be our undo/redo state
  canvas: paper.Project;
  background: paper.Project;
}
