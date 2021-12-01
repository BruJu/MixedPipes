import { Dir, Dirs, Dir_opposite } from "./base/dir";
import { Grid, Grid_ } from "./base/abstract-grid";
import { Point2D, Point2D_toString, Slot, Slot_nbOfOutputs } from "./base/grid-component";
import { InstanciatedSlot } from "./gridapi";
import { DirStatus, Form, instanciatedToSolvationSlot, NewlySolvedSlot, ResearchSlot, ResearchSlot_tryFinalize, SolvationSlot, SolvationSlot_clone } from "./solver/component";


export class SolvationGrid extends Grid<SolvationSlot> {
  get width(): number { return this.ruleset.width; }
  get height(): number { return this.ruleset.height; }
  get brokenWalls(): boolean { return this.ruleset.brokenWalls; }

  get(point: Point2D): SolvationSlot {
    return this._slots[point.y][point.x];
  }

  _slots: SolvationSlot[][];
  readonly ruleset: Grid_;

  private constructor(theSlots: SolvationSlot[][], original: Grid_) {
    super();
    this._slots = theSlots;
    this.ruleset = original;
  }

  static fromIGrid(grid: Grid<InstanciatedSlot>): SolvationGrid {
    let theSlots: SolvationSlot[][] = [];

    for (let y = 0; y !== grid.height; ++y) {
      let row: SolvationSlot[] = [];
      for (let x = 0; x !== grid.width; ++x) {
        row.push(instanciatedToSolvationSlot(grid.get({ x, y })!));
      }
      theSlots.push(row);
    }

    return new SolvationGrid(theSlots, grid);
  }

  clone(): SolvationGrid {
    let theSlots: SolvationSlot[][] = [];

    for (let y = 0; y !== this.height; ++y) {
      let row: SolvationSlot[] = [];
      for (let x = 0; x !== this.width; ++x) {
        row.push(SolvationSlot_clone(this._slots[y][x]));
      }
      theSlots.push(row);
    }

    return new SolvationGrid(theSlots, this);
  }

  solveSomeSlots(newSolutions: NewlySolvedSlot[]): boolean | 'bad' {
    let unstable = false;
    for (let row = 0; row !== this.height; ++row) {
      for (let col = 0; col !== this.width; ++col) {
        const notStable = this.solveAt({ x: col, y: row }, newSolutions);
        if (notStable === 'bad') return 'bad';
        unstable ||= notStable;
      }
    }
    return unstable;
  }

  solveAt(point: Point2D, newSolutions: NewlySolvedSlot[]): boolean | 'bad' {
    const slot = this._slots[point.y][point.x];
    if (!('form' in slot)) return false;

    const solution = ResearchSlot_tryFinalize(slot);
    if (solution === undefined) return false;
    if (solution === 'bad') return 'bad';

    if (solution !== 'new_info') {
      this._slots[point.y][point.x] = solution;
      newSolutions.push(Object.assign(point, solution));
    }

    return true;
  }
  
  removeInvalidHypothesises(solved: NewlySolvedSlot[]): boolean | 'bad' {
    let unstable = false;
  
    for (let y = 0; y != this.height; ++y) {
      for (let x = 0; x != this.width; ++x) {
        const slot = this._slots[y][x];
  
        if (!('form' in slot)) continue;
  
        this.getNeighbourSlotsOf({ x, y })
        .forEach(({ other, dir }) => {
          const r = considerOther(slot, other, dir);
          unstable ||= r;
        });
  
        let solveAtRes = this.solveAt({ x, y }, solved);
        if (solveAtRes === 'bad') return 'bad';
        unstable ||= solveAtRes;
      }
    }
  
    return unstable;
  }

  initialDeductions() {
    const isAni = (slot: SolvationSlot) => {
      if ('form' in slot) return slot.form === 'i';
      const out = Slot_nbOfOutputs(slot);
      return out === 1;
    };

    const moreThanTwois = (() => {
      let cnt = 0;

      for (let y = 0; y != this.height; ++y) {
        for (let x = 0; x != this.width; ++x) {
          const slot = this._slots[y][x];

          if (isAni(slot)) {
            if (cnt < 2) ++cnt;
            else return true;
          }
        }
      }

      return false;
    })();

    
    for (let y = 0; y != this.height; ++y) {
      for (let x = 0; x != this.width; ++x) {
        const slot = this._slots[y][x];
        if (!('form' in slot)) continue;

        this.getNeighboursOf({ x, y })
        .forEach(({ other, dir }) => {
          if (other === null) {
            slot[dir] = DirStatus.No;
          } else {
            if (isAni(slot) && isAni(other)) {
              slot[dir]                = moreThanTwois ? DirStatus.No : DirStatus.Yes;

              if ('form' in other) {
                other[Dir_opposite(dir)] = moreThanTwois ? DirStatus.No : DirStatus.Yes;
              }
            }
          }
        });
      }
    }
  }

  explorePossibilitiesOfanI(): NewlySolvedSlot[] | null {
    let listOfIs: Point2D[] = [];
    const others: Point2D[] = [];

    for (let y = 0; y !== this.height; ++y) {
      for (let x = 0; x !== this.width; ++x) {
        const slot = this._slots[y][x];
        if ('form' in slot) {

          if (slot.form === 'I')
            listOfIs.push({ x, y });
          else
            others.push({ x, y });
        }
      }
    }

    if (listOfIs.length === 0) {
      listOfIs = others;
      if (listOfIs.length === 0) return null;
    }

    const point = listOfIs[Math.floor(Math.random() * listOfIs.length)];

    const current = this._slots[point.y][point.x] as ResearchSlot;

    function compatible(slot: Slot<boolean>, current: ResearchSlot) {
      for (const dir of Dirs) {
        if (current[dir] === DirStatus.Yes && slot[dir] !== true ) return false;
        if (current[dir] === DirStatus.No  && slot[dir] !== false) return false;
      }
      return true;
    }

    for (const slot of
      possibleSlots(current.form)
      .filter(slot => compatible(slot, current))
    ) {
      const clone = this.clone();
      clone._slots[point.y][point.x] = slot;

      if (clone.getCompletitionState() === CompletitionStatus.Invalid) {
        continue;
      }

      const solution = clone.trySolve();
      if (solution !== null) {
        return [Object.assign(point, slot), ...solution];
      }
    }

    return null;
  }

  trySolve(): NewlySolvedSlot[] | null {
    let solution: NewlySolvedSlot[] = [];

    this.initialDeductions();
    while (true) {
      const r = this.removeInvalidHypothesises(solution);

      if (r === 'bad') return null;
      if (r === false) break;
    }

    const gridState: CompletitionStatus = this.getCompletitionState();

    if (gridState === CompletitionStatus.Invalid) {
      return null;
    } else if (gridState === CompletitionStatus.IncompleteValid) {
      const hop = this.explorePossibilitiesOfanI();
      if (!hop) return null;
      return [...solution, ...hop];
    } else {
      return solution;
    }
  }

  getCompletitionState(): CompletitionStatus {
    // Search for a loop
    let map = new Map<string, string>();
    
    for (let iRow = 0; iRow !== this.height; ++iRow) {
      for (let iCol = 0; iCol !== this.width; ++iCol) {
        map.set(Point2D_toString({ x: iCol, y: iRow }), Point2D_toString({ x: iCol, y: iRow }));
      }
    }

    const rootOf = (point: Point2D) => {
      let x = map.get(Point2D_toString(point))!;
      while (x !== map.get(x)) {
        x = map.get(x)!;
      }

      return x;
    };

    const rootOfStr = (point: string) => {
      let x = map.get(point)!;
      while (x !== map.get(x)) {
        x = map.get(x)!;
      }

      return x;
    };

    // Ok

    function compatible(lhs: boolean | DirStatus, rhs: boolean | DirStatus) {
      if (lhs === true || lhs === DirStatus.Yes) {
        return rhs === true || rhs === DirStatus.Yes || rhs === DirStatus.Maybe;
      } else if (lhs === false || lhs === DirStatus.No) {
        return rhs === false || rhs === DirStatus.No || rhs === DirStatus.Maybe;
      } else {
        return true;
      }
    }

    function connected(lhs: boolean | DirStatus, rhs: boolean | DirStatus) {
      return (lhs === true || lhs === DirStatus.Yes || lhs === DirStatus.Maybe)
        && (rhs === true || rhs === DirStatus.Yes || rhs === DirStatus.Maybe)
    }

    let isIncomplete = false;

    for (let iRow = 0; iRow !== this.height; ++iRow) {
      for (let iCol = 0; iCol !== this.width; ++iCol) {
        const slot = this._slots[iRow][iCol];

        if ('form' in slot) {
          isIncomplete = true;
        }

        let invalid = false;
        this.getNeighboursOf({ x: iCol, y: iRow })
        .forEach(({other, point, dir}) => {
          if (other === null) {
            if (slot[dir] === true || slot[dir] === DirStatus.Yes) invalid = true;
          } else {
            if (!compatible(slot[dir], other[Dir_opposite(dir)])) invalid = true;

            if (connected(slot[dir], other[Dir_opposite(dir)])) {
              map.set(rootOf({ x: iCol, y: iRow }), rootOf(point!));
            }
          }
        });

        if (invalid) return CompletitionStatus.Invalid;
      }
    }

    const group0 = rootOf({ x: 0, y: 0 });
    for (const val of map.keys()) {
      if (group0 !== rootOfStr(val)) return CompletitionStatus.Invalid;
    }

    return isIncomplete ? CompletitionStatus.IncompleteValid : CompletitionStatus.CompleteValid;
  }
}

export enum CompletitionStatus {
  IncompleteValid,
  CompleteValid,
  Invalid
}

function possibleSlots(form: Form): Slot<boolean>[] {
  if (form === 'i') {
    return [
      { north: true , east: false, south: false, west: false },
      { north: false, east: true , south: false, west: false },
      { north: false, east: false, south: true , west: false },
      { north: false, east: false, south: false, west: true  },
    ];
  } else if (form === 'I') {
    return [
      { north: true , east: false, south: true , west: false },
      { north: false, east: true , south: false, west: true  },
    ];
  } else if (form === 'L') {
    return [
      { north: true , east: true , south: false, west: false },
      { north: false, east: true , south: true , west: false },
      { north: false, east: false, south: true , west: true  },
      { north: true , east: false, south: false, west: true  },
    ];
  } else {
    return [
      { north: true , east: true , south: true , west: false },
      { north: false, east: true , south: true , west: true  },
      { north: true , east: false, south: true , west: true  },
      { north: true , east: true , south: false, west: true  },
    ];
  }
}

export default function solve(grid: Grid<InstanciatedSlot>) {
  const solved: NewlySolvedSlot[] = [];
  const solvationGrid = SolvationGrid.fromIGrid(grid);

  let r = solvationGrid.trySolve();
  return r || [];

  solvationGrid.initialDeductions();

  let nbOfi = 0;

  if (nbOfi > 2) {
    // solvePathways(solvationGrid);
  }

  while (solvationGrid.removeInvalidHypothesises(solved));

  return solved;
}

function considerOther(slot: ResearchSlot, other: SolvationSlot, myDir: Dir) {
  const otherDir = Dir_opposite(myDir);

  if (!('form' in other)) {
    const expect = other[otherDir] ? DirStatus.Yes : DirStatus.No;
    if (slot[myDir] === expect) return false;
    slot[myDir] = expect;
    return true;
  }

  if (other[otherDir] === DirStatus.Maybe) {
    if (slot[myDir] !== DirStatus.Maybe) {
      other[otherDir] = slot[myDir];
      return true;
    }
  } else {
    if (slot[myDir] === DirStatus.Maybe) {
      slot[myDir] = other[otherDir];
      return true;
    }
  }

  return false;
}

/*
function isAni(slot: InstanciatedSlot | ResearchSlot | null) {
  if (slot === null) return false;
  if ('form' in slot) return slot.form === 'i';
  return countNbOfOutput(slot) === 1;
}

function solvePathways(grid: ResearchGrid) {
  for (let y = 0; y != grid.height; ++y) {
    for (let x = 0; x != grid.width; ++x) {
      const slot = grid.grid[y][x];

      if ('form' in slot && slot.form === 'I') {
        if (isAni(grid.get({ x, y }, 'east')) && isAni(grid.get({ x, y }, 'west'))) {
          slot.east = DirStatus.No;
          slot.west = DirStatus.No;
        }

        if (isAni(grid.get({ x, y }, 'south')) && isAni(grid.get({ x, y }, 'north'))) {
          slot.south = DirStatus.No;
          slot.north = DirStatus.No;
        }
      }
    }
  }
}
*/