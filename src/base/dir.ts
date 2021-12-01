
/** Possible directions */
export type Dir = 'north' | 'east' | 'west' | 'south';

/** Every possible directions */
export const Dirs: Dir[] = ['north', 'east', 'west', 'south'];

/**
 * Return the opposite direction
 * @param dir The direction
 * @returns The opposite direction
 */
export function Dir_opposite(dir: Dir): Dir {
  switch (dir) {
    case 'north': return 'south';
    case 'south': return 'north';
    case 'west': return 'east';
    case 'east': return 'west';
    default: throw Error("Unknown dir");
  }
}
