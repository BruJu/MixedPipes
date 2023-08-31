import mazeGenerator from './maze-generator';
import gridSolver from './grid-solver';
import { Dir, Dirs, Dir_opposite } from './base/dir';
import { Grid } from './base/abstract-grid';
import { Point2D, Slot } from './base/grid-component';


const SLOT_SIZE = 100;
const LINE_SIZE = 20;

enum LockParadigm {
  LockedOk,
  LockedWithConflict,
  NotLocked
}

enum Playstyle { Free, Restrained, AutoLock }

function lockParadigmToStyle(lockedParadigm: LockParadigm): string {
  switch (lockedParadigm) {
    case LockParadigm.LockedOk: return 'darkgrey';
    case LockParadigm.LockedWithConflict: return 'red';
    case LockParadigm.NotLocked: return 'lightgrey'
    default: return 'green';
  }
}

function getCurrentPlaystyle(): Playstyle {
  const select = document.getElementById('qol_spin') as HTMLSelectElement;
  if (select.value === 'autolock') return Playstyle.AutoLock;
  else if (select.value === 'restrained') return Playstyle.Restrained;
  else return Playstyle.Free;
}

function rotateSlot(slot: RealSlot, x: number, y: number, maze: PlayerMaze) {
  if (slot.blocked) return;

  const slotPoint = { x, y };

  const playstyle = getCurrentPlaystyle();
  if (playstyle === Playstyle.AutoLock || playstyle === Playstyle.Restrained) {
    let goodFits: [boolean, boolean, boolean, boolean] = [false, false, false, false];
    for (let i = 0; i != 4; ++i) {
      slot.rotate();
      goodFits[i] = maze.fitsWithNearbyBlocked(slotPoint);
    }

    let nbOfGoodFits = goodFits.filter(x => x).length;

    if (slot.isABar()) nbOfGoodFits /= 2;

    if (playstyle === Playstyle.AutoLock && nbOfGoodFits === 1) {
      while (!maze.fitsWithNearbyBlocked(slotPoint)) {
        slot.rotate();
      }

      slot.blocked = true;
    } else if ((playstyle === Playstyle.Restrained || playstyle === Playstyle.AutoLock) && nbOfGoodFits > 0) {
      slot.rotate();
      while (!maze.fitsWithNearbyBlocked(slotPoint)) {
        slot.rotate();
      }
    } else {
      slot.rotate();
    }
  } else {
    slot.rotate();
  }
}

class RealSlot {
  north: boolean = false;
  east: boolean = false;
  west: boolean = false;
  south: boolean = false;
  blocked: boolean = false;

  countPaths() {
    return Dirs.map(dir => this[dir]).filter(x => x).length;
  }

  isABar() {
    return this.north == this.south && this.west == this.east && this.north !== this.west;
  }

  draw(context: CanvasRenderingContext2D,
    x: number, y: number, width: number, height: number,
    pipeStyle: string, lockParadigm: LockParadigm, drawOnePath: boolean
  ) {
    context.fillStyle = 'black';
    context.fillRect(x, y, width, height);
    context.fillStyle = lockParadigmToStyle(lockParadigm);
    context.fillRect(x + 1, y + 1, width - 2, height - 2);

    context.fillStyle = pipeStyle;

    if (this.north) context.fillRect(x + (width / 2) - (LINE_SIZE / 2), y                         , LINE_SIZE, height / 2);
    if (this.south) context.fillRect(x + (width / 2) - (LINE_SIZE / 2), y + (height / 2)          , LINE_SIZE, height / 2);
    if (this.west ) context.fillRect(x                        , y + (height / 2) - (LINE_SIZE / 2), width / 2, LINE_SIZE);
    if (this.east ) context.fillRect(x + (width / 2)          , y + (height / 2) - (LINE_SIZE / 2), width / 2, LINE_SIZE);

    if (this.countPaths() === 1) {
      if (drawOnePath) context.fillStyle = 'blue';
      context.fillRect(
        x + (width  / 2) - (LINE_SIZE / 2),
        y + (height / 2) - (LINE_SIZE / 2),
        LINE_SIZE, LINE_SIZE
      );
    }
  }

  rotate() {
    if (this.blocked) return;
    let temp = this.north;
    this.north = this.east;
    this.east = this.south;
    this.south = this.west;
    this.west = temp;
  }
}

class PlayerMaze extends Grid<RealSlot> {
  grid: RealSlot[][];
  
  blackPipes: boolean = true;

  readonly width: number;
  readonly height: number;
  readonly brokenWalls: boolean;

  constructor(width: number, height: number, brokenWalls: boolean = false) {
    super();

    this.width = width;
    this.height = height;
    this.brokenWalls = brokenWalls;

    // ==== 1) Initial grid
    const configuration = mazeGenerator({ width, height, brokenWalls });

    this.grid = [];

    for (let y = 0; y != height; ++y) {
      let row: RealSlot[] = [];
      for (let x = 0; x != width; ++x) {
        const config = configuration[y][x];
        const slot = new RealSlot();
        Object.assign(slot, config);

        for (let rotate = Math.floor(Math.random() * 4); rotate >= 0; --rotate) {
          slot.rotate();
        }

        row.push(slot);
      }
      this.grid.push(row);
    }
  }

  get(point: Point2D) {
    return this.grid[point.y][point.x];
  }


  invertColorDisplay() { this.blackPipes = !this.blackPipes; }

  draw(canvas: HTMLCanvasElement) {
    let getPipeColor: (x: number, y: number) => string;
    if (this.blackPipes) {
      if (this.checkWin()) getPipeColor = () => 'blue';
      else getPipeColor = () => 'black';
    } else {
      const mapping: Map<number, string> = computeNetworks(this);
      getPipeColor = (x: number, y: number) => mapping.get(x + y * this.width) || 'black';
    }

    const ctx = canvas.getContext('2d')!;

    const extra = this.brokenWalls ? SLOT_SIZE / 2 : 0;

    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, this.width * SLOT_SIZE + extra * 2, this.height * SLOT_SIZE + extra * 2);

    for (let y = 0; y != this.height; ++y) {
      for (let x = 0; x != this.width; ++x) {
        const color = getPipeColor(x, y);
        const slot = this.grid[y][x];
        const lp = this._lockParadigmOf(slot, x, y);
        slot.draw(ctx, x * SLOT_SIZE + extra, y * SLOT_SIZE + extra, SLOT_SIZE, SLOT_SIZE, color, lp, this.blackPipes);
      }
    }

    if (this.brokenWalls) {
      const that = this;

      function drawBrokenWall(x: number, y: number, drawX: number, drawY: number) {
        const color = getPipeColor(x, y);
        const slot = that.grid[y][x];
        const lp = that._lockParadigmOf(slot, x, y);
        slot.draw(ctx, drawX, drawY, SLOT_SIZE, SLOT_SIZE, color, lp, that.blackPipes);
  
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = "white";
        ctx.fillRect(drawX, drawY, SLOT_SIZE, SLOT_SIZE);
        ctx.globalAlpha = 1;
      }

      drawBrokenWall(this.width - 1, this.height - 1,                        - extra,                         - extra);
      drawBrokenWall(0             , this.height - 1, SLOT_SIZE * this.width + extra,                         - extra);
      drawBrokenWall(0             , 0              , SLOT_SIZE * this.width + extra, SLOT_SIZE * this.height + extra);
      drawBrokenWall(this.width - 1, 0              ,                        - extra, SLOT_SIZE * this.height + extra);

      for (let x = 0; x != this.width; ++x) {
        drawBrokenWall(x, this.height - 1, SLOT_SIZE * x + extra,                         - extra);
        drawBrokenWall(x, 0              , SLOT_SIZE * x + extra, SLOT_SIZE * this.height + extra);
      }
      
      for (let y = 0; y != this.width; ++y) {
        drawBrokenWall(0             , y              , SLOT_SIZE * this.width + extra, SLOT_SIZE * y + extra);
        drawBrokenWall(this.width - 1, y              ,                        - extra, SLOT_SIZE * y + extra);
      }
    }
  }

  _lockParadigmOf(slot: RealSlot, x: number, y: number) {
    if (!slot.blocked) {
      return LockParadigm.NotLocked;
    } else if (!this.fitsWithNearbyBlocked({ x, y })) {
      return LockParadigm.LockedWithConflict;
    } else {
      return LockParadigm.LockedOk;
    }
  }

  fitsWithNearbyBlocked(point: Point2D): boolean {
    const slot = this.get(point);
    return undefined === this.getNeighboursOf(point)
    .find(({ other, dir }) => {
      if (other === null) {
        return slot[dir] === true;
      } else{
        return other.blocked && slot[dir] !== other[Dir_opposite(dir)];
      }
    });
  }

  exploreNetworkOf(x: number, y: number, memberConsumer: (x: number, y: number) => void) {
    let explored = new Set<string>();
    explored.add(y + ',' + x);
    memberConsumer(x, y);
    let toExplore: { x: number, y: number }[] = [{ x: x, y: y }];

    const explore = (x: number, y: number, myDir: Dir, hisDir: Dir, dx: number, dy: number) => {
      if (this.brokenWalls) {
        if (x + dx < 0) dx += this.width;
        if (y + dy < 0) dy += this.height;
        if (x + dx === this.width) dx = -x;
        if (y + dy === this.height) dy = -y;
      } else {
        if (x + dx < 0) return;
        if (y + dy < 0) return;
        if (x + dx >= this.width) return;
        if (y + dy >= this.height) return;
      }

      const slot = this.grid[y][x];
      if (!slot[myDir]) return;

      const other = this.grid[y + dy][x + dx];
      if (!other[hisDir]) return;
      const code = `${y + dy},${x + dx}`;
      if (explored.has(code)) return;
      explored.add(code);
      memberConsumer(x + dx, y + dy);
      toExplore.push({ x: x + dx, y: y + dy });
    };

    while (toExplore.length !== 0) {
      const next = toExplore[toExplore.length - 1];
      toExplore.splice(toExplore.length - 1, 1);

      explore(next.x, next.y, 'north', 'south', 0, -1);
      explore(next.x, next.y, 'south', 'north', 0, 1);
      explore(next.x, next.y, 'east', 'west', 1, 0);
      explore(next.x, next.y, 'west', 'east', -1, 0);
    }
  }

  checkWin() {
    let nb = 0;
    this.exploreNetworkOf(0, 0, () => ++nb);
    return nb === this.width * this.height;
  }

  solve() {
    for (const solved of gridSolver(this)) {
      const slot = this.grid[solved.y][solved.x];

      for (let i = 0; i != 4; ++i) {
        if (slot.north === solved.north
          && slot.south === solved.south
          && slot.east === solved.east
          && slot.west === solved.west) { 
          slot.blocked = true;
          break;
        }

        slot.rotate();
      }
    }
  }

  shift(direction: 'right' | 'left' | 'up' | 'down') {
    if (!this.brokenWalls) return;

    // Compute translation function
    function loop(value: number, round: number) {
      if (value >= round) return value % round;
      while (value < 0) {
        value += round;
      }
      return value;
    }

    let where: (x: number, y: number) => RealSlot;
    if (direction === 'right') {
      where = (x: number, y: number) => this.grid[y][loop(x - 1, this.width)];
    } else if (direction === 'left') {
      where = (x: number, y: number) => this.grid[y][loop(x + 1, this.width)];
    } else if (direction === 'up') {
      where = (x: number, y: number) => this.grid[loop(y + 1, this.height)][x];
    } else if (direction === 'down') {
      where = (x: number, y: number) => this.grid[loop(y - 1, this.height)][x];
    } else {
      return;
    }

    // Translate
    let newGrid: RealSlot[][] = [];
    for (let y = 0; y != this.height; ++y) {
      let row: RealSlot[] = [];
      for (let x = 0; x != this.width; ++x) {
        row.push(where(x, y));
      }
      newGrid.push(row);
    }
    this.grid = newGrid;
  }
}

function computeNetworks(self: PlayerMaze): Map<number, string> {
  const posToGroup = new Map<number, number>();

  let nextGroupId = 0;
  for (let x = 0; x != self.width; ++x) {
    for (let y = 0; y != self.height; ++y) {
      const pos1d = x + y * self.width;
      if (!posToGroup.has(pos1d)) {
        self.exploreNetworkOf(x, y, (x, y) => posToGroup.set(x + y * self.width, nextGroupId));
        ++nextGroupId;
      }
    }
  }

  const result = new Map<number, string>();
  for (const [pos1d, groupId] of posToGroup.entries()) {
    result.set(pos1d, ['blue', 'red', 'green', 'purple'][groupId % 4])
  }
  return result;
}

function setCanvasSize(canvas: HTMLCanvasElement, width: number, height: number) {
  const style = canvas.style;
  style.width  = `${width}px`;
  style.height = `${height}px`;

  canvas.width  = width;
  canvas.height = height;
}

const DEFAULT_SETTINGS = {
  width: 5,
  height: 5,
  broken: false
};

window.onload = () => {
  (document.getElementById("width") as HTMLInputElement).value = DEFAULT_SETTINGS.width.toString();
  (document.getElementById("height") as HTMLInputElement).value = DEFAULT_SETTINGS.height.toString();
  (document.getElementById("broken") as any).checked = DEFAULT_SETTINGS.broken;

  const canvas = document.getElementById("maze") as HTMLCanvasElement;

  function setupNewGrid(): PlayerMaze {
    let trueMaze = new PlayerMaze(
      parseInt((document.getElementById("width") as HTMLInputElement).value),
      parseInt((document.getElementById("height") as HTMLInputElement).value),
      !!(document.getElementById("broken") as HTMLInputElement).checked
    );

    const extra = trueMaze.brokenWalls ? SLOT_SIZE / 2 : 0;

    setCanvasSize(canvas, SLOT_SIZE * trueMaze.width + extra * 2, SLOT_SIZE * trueMaze.height + extra * 2);
    trueMaze.draw(canvas);
    return trueMaze;
  }

  let trueMaze = setupNewGrid();
  document.getElementById("reset")!.onclick = () => trueMaze = setupNewGrid()

  function getClickedSlot(event: MouseEvent)
    : { type: 'void' }
    | { type: 'slot', x: number, y: number, slot: RealSlot }
    | { type: 'movement', directions: ('right' | 'down' | 'up' | 'left')[] }
  {
    let x = event.clientX - canvas.getBoundingClientRect().x;
    let y = event.clientY - canvas.getBoundingClientRect().y;

    if (trueMaze.brokenWalls) {
      x -= SLOT_SIZE / 2;
      y -= SLOT_SIZE / 2;
    }

    const slotX = Math.floor(x / SLOT_SIZE);
    const slotY = Math.floor(y / SLOT_SIZE);

    if (slotX >= 0 && slotY >= 0 && slotX < trueMaze.width && slotY < trueMaze.height) {
      return { type: 'slot', x: slotX, y: slotY, slot: trueMaze.grid[slotY][slotX] };
    } else if (trueMaze.brokenWalls) {
      let result = { type: 'movement' as const, directions: [] as ('right' | 'down' | 'up' | 'left')[] };

      if (slotX < 0) result.directions.push('right');
      if (slotY < 0) result.directions.push('down');
      if (slotX >= trueMaze.width) result.directions.push('left');
      if (slotY >= trueMaze.height) result.directions.push('up');

      return result;
    } else{
      return { type: 'void' };
    }
    
    if (type == 'slot' && x >= 0 && y >= 0 && x < trueMaze.width && y < trueMaze.height) {
      return trueMaze.grid[y][x];
    } else {
      return null;
    }
  }

  canvas.addEventListener('click', event => {
    const clickedOn = getClickedSlot(event);

    if (clickedOn.type == 'slot') {
      rotateSlot(clickedOn.slot, clickedOn.x, clickedOn.y, trueMaze);
      trueMaze.draw(canvas);
    } else if (clickedOn.type == 'movement') {
      for (const move of clickedOn.directions) {
        trueMaze.shift(move);
      }

      trueMaze.draw(canvas);
    }
  });

  canvas.addEventListener('contextmenu', event => {
    event.preventDefault();

    const clickedOn = getClickedSlot(event);
    if (clickedOn.type == 'slot') {
      const slot = clickedOn.slot;
      slot.blocked = !slot.blocked;
      trueMaze.draw(canvas);
    }

    return false;
  });

  document.addEventListener('keypress', event => {
    const e = event || window.event;

    if (e.key === 'd') {
      trueMaze.shift('right');
      trueMaze.draw(canvas);
    } else if (e.key === 'q' || e.key === 'a') {
      trueMaze.shift('left');
      trueMaze.draw(canvas);
    } else if (e.key === 's') {
      trueMaze.shift('down');
      trueMaze.draw(canvas);
    } else if (e.key === 'z' || e.key === 'w') {
      trueMaze.shift('up');
      trueMaze.draw(canvas);
    } else if (e.key === 'c') {
      trueMaze.invertColorDisplay();
      trueMaze.draw(canvas);
    } else if (e.key === 'm') {
      trueMaze.solve();
      trueMaze.draw(canvas);
    }

    return false;
  });

};
