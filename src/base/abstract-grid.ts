import { Dir, Dirs } from "./dir";
import { Point2D } from "./grid-component";

/** A generic grid configuration */
export interface Grid_ {
  /** The width of the grid (number of slots per line) */
  get width(): number;
  /** The height of the grid (number of slots per column) */
  get height(): number;
  /** If true, each opposite walls are connected */
  get brokenWalls(): boolean;
}

/**
 * A grid. The only service provided by this class is moving on the grid, and
 * fetching the list of neighbours of a slot.
 */
export abstract class Grid<E> implements Grid_ {
  abstract get width(): number;
  abstract get height(): number;
  abstract get brokenWalls(): boolean;

  /**
   * Return the slot at position point. Assumes that the given point is in bound
   * i.e. 0 <= point.x < width and 0 <= point.y < height
   * @param point The position of the slot.
   */
  abstract get(point: Point2D): E;

  /**
   * Moves from the given point to the given direction
   * @param point The starting point
   * @param dir The direction
   * @returns The destination, or null if it would lead out of bound
   */
  #move(point: Point2D, dir: Dir): Point2D | null {
    if (dir === 'north') {
      if (point.y !== 0) {
        return { x: point.x, y: point.y - 1 };
      } else {
        if (!this.brokenWalls) return null;
        return { x: point.x, y: this.height - 1 };
      }
    } else if (dir === 'south') {
      if (point.y !== this.height - 1) {
        return { x: point.x, y: point.y + 1 };
      } else {
        if (!this.brokenWalls) return null;
        return { x: point.x, y: 0 };
      }
    } else if (dir === 'west') {
      if (point.x !== 0) {
        return { x: point.x - 1, y: point.y };
      } else {
        if (!this.brokenWalls) return null;
        return { x: this.width - 1, y: point.y };
      }
    } else if (dir === 'east') {
      if (point.x !== this.width - 1) {
        return { x: point.x + 1, y: point.y };
      } else {
        if (!this.brokenWalls) return null;
        return { x: 0, y: point.y };
      }
    } else {
      return null;
    }
  }

  /**
   * Returns the four neighbours of the point. If the neighbour is a wall,
   * null is returned instead of a slot and an out-of-bound neighbour point.
   * @param point The point
   * @returns The list of neighbours, both slots and out-of-bound.
   */
  getNeighboursOf(point: Point2D): ({ other: E, point: Point2D, dir: Dir } | { other: null, point: null, dir: Dir })[] {
    return Dirs.map(dir => {
      const target = this.#move(point, dir);
      if (target === null) {
        return { other: null, point: null, dir: dir };
      } else {
        return { other: this.get(target), point: target, dir: dir };
      }
    });
  }

  /**
   * Returns the list of slot neighbours of the given point
   * @param point The point
   * @returns The list of slot neighbours
   */
  getNeighbourSlotsOf(point: Point2D): { other: E, point: Point2D, dir: Dir }[] {
    return this.getNeighboursOf(point)
    .filter(c => c.other !== null) as { other: E, point: Point2D, dir: Dir }[];
  }
}
