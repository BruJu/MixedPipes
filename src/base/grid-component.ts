import { Dir } from "./dir";

/** A Point in a 2D environment */
export type Point2D = {
  x: number;
  y: number;
};

/** Converts the Point2D into a string */
export function Point2D_toString(self: Point2D) {
  return `${self.y},${self.x}`
}

export function Point2D_move(self: Point2D, dir: Dir, gridConf: GridConfiguration): Point2D | null;
export function Point2D_move(self: Point2D, dir: Dir, gridConf: GridConfiguration & { brokenWalls: true }): Point2D;

/**
 * Builds a new point from the given point and the direction
 * @param self The point
 * @param dir The direction
 * @param gridConf The configuration of the grid
 * @returns The new point
 */
export function Point2D_move(self: Point2D, dir: Dir, gridConf: GridConfiguration): Point2D | null {
  const copy = Object.assign({}, self);
  switch (dir) {
    case 'north': if (copy.y !== 0) { --copy.y } else { if (gridConf.brokenWalls) { copy.y = gridConf.height - 1 } else { return null; } } break;
    case 'south': if (copy.y !== gridConf.height - 1) { ++copy.y } else { if (gridConf.brokenWalls) { copy.y = 0 } else { return null; } } break;
    case 'east' : if (copy.x !== gridConf.width - 1)  { ++copy.x } else { if (gridConf.brokenWalls) { copy.x = 0 } else { return null; } } break;
    case 'west' : if (copy.x !== 0) { --copy.x } else { if (gridConf.brokenWalls) { copy.x = gridConf.width - 1 } else { return null; } } break;
  }

  return copy;
}

/** A grid configuration */
export type GridConfiguration = {
  width: number;
  height: number;
  brokenWalls: boolean;
}

/** A slot in a 2D grid with directions */
export type Slot<T = boolean> = {[dir in Dir]: T};

/** Returns the number of outputs of the slot */
export function Slot_nbOfOutputs(slot: Slot<boolean>): 0 | 1 | 2 | 3 | 4 {
  return ((slot.north) ? 1 : 0)
  + ((slot.south) ? 1 : 0)
  + ((slot.east) ? 1 : 0)
  + ((slot.west) ? 1 : 0) as (0 | 1 | 2 | 3 | 4);
}
