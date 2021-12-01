import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { CompletitionStatus } from '../src/grid-solver';
import { InstanciatedSlot } from '../src/gridapi';
import { Grid } from '../src/base/abstract-grid';
import { Point2D, Slot } from '../src/base/grid-component';
import { SolvationGrid } from '../src/grid-solver';

function fromSymbol(symbol: string): Slot<boolean> {
  switch (symbol) {
    case '^': return { north: true , east: false, south: false, west: false };
    case '>': return { north: false, east: true , south: false, west: false };
    case 'v': return { north: false, east: false, south: true , west: false };
    case '<': return { north: false, east: false, south: false, west: true  };

    case '┬': return { north: false, east: true , south: true , west: true  };
    case '┤': return { north: true , east: false, south: true , west: true  };
    case '┴': return { north: true , east: true , south: false, west: true  };
    case '├': return { north: true , east: true , south: true , west: false };

    case '┼': return { north: true , east: true , south: true , west: true  };
    case '─': return { north: false, east: true , south: false, west: true  };
    case '│': return { north: true , east: false, south: true , west: false };
    
    case '└': return { north: true , east: true , south: false, west: false };
    case '┌': return { north: false, east: true , south: true , west: true  };
    case '┐': return { north: false, east: false, south: true , west: true };
    case '┘': return { north: true , east: false, south: false, west: false };
    
    case 'T': return { north: false, east: true , south: true , west: true  };
    case '+': return { north: true , east: true , south: true , west: true  };
    case '-': return { north: false, east: true , south: false, west: true  };
    case '|': return { north: true , east: false, south: true , west: false };
    
    default: throw Error("Unknown symbol " + symbol);
  }
}

function main() {
  const examplesDir = fs.readdirSync(path.join(__dirname, "..", "examples"))

  examplesDir.forEach(filename => {
    const filePath = path.join(__dirname, "..", "examples", filename);
    it(filename, () => {
      const file = fs.readFileSync(filePath, 'utf-8');
      const grid = loadGrid(file);
      const solution = grid.clone();
      const todoList = solution.trySolve();
      if (!todoList) throw Error("Invalid resolution");

      todoList.forEach(todo => solution._slots[todo.y][todo.x] = todo);
      // TODO: don't trust completitionstate
      // TODO: don't trust the output
      assert.ok(solution.getCompletitionState() === CompletitionStatus.CompleteValid);
    });
  });
}

class MyGrid extends Grid<InstanciatedSlot> {
  slots: InstanciatedSlot[][];

  constructor(slots: InstanciatedSlot[][]) {
    super();
    this.slots = slots;
  }

  get width(): number { return this.slots[0].length; }
  get height(): number { return this.slots.length; }
  get brokenWalls(): boolean { return false; }
  get(point: Point2D): InstanciatedSlot { return this.slots[point.y][point.x]; }
}

function loadGrid(text: string): SolvationGrid {
  const lines = text.split(/\r?\n/);
  const directives = lines[0];

  let slots: InstanciatedSlot[][] = [];

  for (const strRow of lines.slice(1).filter(x => x !== "").map(line => line.trim())) {
    const row: InstanciatedSlot[] = [];
    for (const symbol of strRow) {
      let slot: InstanciatedSlot = Object.assign(fromSymbol(symbol), { blocked: false });
      row.push(slot);
    }
    slots.push(row);
  }

  const firstLine = slots[0].length;
  const invalid = slots.find(row => row.length !== firstLine);
  if (invalid !== undefined) throw Error("Invalid input: different number of symbols in the rows of the grid");

  const grid = new MyGrid(slots);
  return SolvationGrid.fromIGrid(grid);
}


main();
