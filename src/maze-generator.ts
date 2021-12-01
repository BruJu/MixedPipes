import { Dir_opposite } from "./base/dir";
import { GridConfiguration, Point2D, Point2D_move, Slot } from "./base/grid-component";

/*
 * This file produces maze from an empty grid. The maze is the starting point
 * of the game: it will then be shuffled and the player's goal is to find back
 * the original maze.
 */

/** Either east or south */
type LimitedDir = 'east' | 'south';

/** A door, i.e. broken wall */
type Door = Point2D & { to: LimitedDir };

/**
 * A mapping of slots to their group
 * 
 * Uses the Union-Find algorithm:
 * https://en.wikipedia.org/wiki/Disjoint-set_data_structure
 */
class UnionFind {
  /** Slot index on a 1D scale to group id */
  #slotToGroup: Map<number, number>;
  /** Number of slots per line, used to compute the index on a 1D scale */
  #width: number;

  constructor(width: number, height: number) {
    this.#width = width;
    this.#slotToGroup = new Map<number, number>();
    
    // makeSet
    for (let i = 0; i != width * height; ++i) {
      this.#slotToGroup.set(i, i);
    }
  }

  /** Return the root of the tree in which the given slot is */
  find(slot: Point2D) {
    let expected = slot.x + slot.y * this.#width;
    
    while (true) {
      let realGroupId = this.#slotToGroup.get(expected)!;
      if (realGroupId === expected) return expected;
      expected = realGroupId;
    }
  }

  /** Merge the trees where slot1 and slot2 are */
  union(slot1: Point2D, slot2: Point2D) {
    this.#slotToGroup.set(this.find(slot1), this.find(slot2));
  }
}

/**
 * Builds the list of place where a wall can be broken. Two lists are returned:
 * one for horizontal walls (east to west) and one for vertical walls
 * (north to south).
 * @param gridConf The grid configuration
 * @returns The list of slots where there are breakable walls
 */
function initWalls(gridConf: GridConfiguration): { h: Point2D[], v: Point2D[] } {
  const h: Point2D[] = [];
  const v: Point2D[] = [];

  const notBroken = gridConf.brokenWalls ? 0 : 1;

  for (let x = 0; x != gridConf.width; ++x) {
    for (let y = 0; y != gridConf.height; ++y) {
      if (x != gridConf.width - notBroken) h.push({ x, y });
      if (y != gridConf.height - notBroken) v.push({ x, y });
    }
  }

  return { h, v };
}

/**
 * Builds the list of walls to open
 * @param gridConf The grid configuration
 * @returns The list of walls to open
 */
function buildOpenWalls(gridConf: GridConfiguration): Door[] {
  const groups = new UnionFind(gridConf.width, gridConf.height);
  const { h, v } = initWalls(gridConf);

  let numberOfDiffGroups = gridConf.width * gridConf.height;

  let res: Door[] = [];

  let openedWalls = new Map<number, number>();
  const breakable = (slot: Point2D) => {
    let cnt = openedWalls.get(slot.x + slot.y * gridConf.width);
    if (cnt === undefined) return true;
    if (cnt >= 3) return false;
    return true;
  }

  while (numberOfDiffGroups > 1) {
    const breakHorizontal = Math.random() >= 0.5;
    const dir: LimitedDir = breakHorizontal ? 'east' : 'south';
    const wallsToBreak = breakHorizontal ? h : v;
    if (wallsToBreak.length === 0) continue;

    const randomIndex = Math.floor(Math.random() * wallsToBreak.length);
    const slot1 = wallsToBreak[randomIndex];
    const slot2 = Point2D_move(slot1, dir, gridConf)!;

    wallsToBreak.splice(randomIndex, 1);
    
    if (!breakable(slot1) || !breakable(slot2)) continue;

    if (groups.find(slot1) !== groups.find(slot2)) {
      res.push({ x: slot1.x, y: slot1.y, to: dir });
      groups.union(slot1, slot2);
      --numberOfDiffGroups;

      const g1 = slot1.x + slot1.y * gridConf.width;
      openedWalls.set(g1, (openedWalls.get(g1) || 0) + 1);
      const g2 = slot2.x + slot2.y * gridConf.width;
      openedWalls.set(g2, (openedWalls.get(g2) || 0) + 1);
    }
  }

  return res;
}

/** Builds an initial grid with no pipe */
function initializeMaze(gridConf: GridConfiguration): Slot<boolean>[][] {
  const theMaze: Slot<boolean>[][] = [];
  for (let row = 0; row != gridConf.height; ++row) {
    const theRow: Slot<boolean>[] = [];
    for (let col = 0; col != gridConf.width; ++col) {
      theRow.push({ north: false, east: false, west: false, south: false });
    }
    theMaze.push(theRow);
  }
  return theMaze;
}

/**
 * Generates a maze
 * @param gridConf The grid configuration
 * @returns A 2D array, row-major, with the slots
 * @see https://fr.wikipedia.org/wiki/Mod%C3%A9lisation_math%C3%A9matique_de_labyrinthe#Fusion_al%C3%A9atoire_de_chemins
 */
export default function generateMaze(gridConf: GridConfiguration): Slot[][] {
  const maze = initializeMaze(gridConf);

  for (const { x, y, to } of buildOpenWalls(gridConf)) {
    const origin = { x, y };
    const neighbour = Point2D_move(origin, to, gridConf)!;
    maze[origin.y][origin.x][to] = true;
    maze[neighbour.y][neighbour.x][Dir_opposite(to)] = true;
  }

  return maze;
}
