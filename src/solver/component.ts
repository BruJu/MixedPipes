import { Dir, Dirs, Dir_opposite } from "../base/dir";
import { Point2D, Slot, Slot_nbOfOutputs } from "../base/grid-component";
import { InstanciatedSlot } from "../gridapi";

// ============================================================================
// == Partial knowledge on slots


/** The form of a slot that has from 1 to 3 outputs */
export type Form = 'L' | 'I' | 'T' | 'i';

/** Partial knowledge on outputs position */
export enum DirStatus { Maybe, Yes, No }

/** Returns the opposite of the given DirStatus */
export function DirStatus_negate(status: DirStatus) {
  if (status === DirStatus.Yes) return DirStatus.No;
  if (status === DirStatus.No) return DirStatus.Yes;
  return status;
}

/** A slot for which we have partial knowledge on outputs */
export type ResearchSlot = (Slot<DirStatus> & { form: Form; });

/** A slot that is either resolved or on which we are looking for information */
export type SolvationSlot = ResearchSlot | Slot<boolean>;

/** A slot for which we found the final position */
export type NewlySolvedSlot = Slot<boolean> & Point2D;

// =====

/**
 * Converts an instanciated slot, a concrete one in the grid, into a
 * SolvationSlot, one for which we are looking for the solution
 * @param slot The slot
 * @returns The solvation slot
 */
export function instanciatedToSolvationSlot(slot: InstanciatedSlot): SolvationSlot {
  if (slot.blocked) {
    return slot;
  } else {
    const numberOfDirections = Slot_nbOfOutputs(slot);
    
    if (numberOfDirections === 4 || numberOfDirections === 0) {
      return slot;
    } else {
      return {
        south: DirStatus.Maybe,
        north: DirStatus.Maybe,
        west: DirStatus.Maybe,
        east: DirStatus.Maybe,
        form: Slot_formOf(slot)
      };
    }
  }
}

/**
 * Try to resolve the given research slot.
 * @returns A new slot if the finalization suceeded. Undefined if it couldn't.
 * 'new_info' if new information has been deduced.
 */
export function ResearchSlot_tryFinalize(slot: ResearchSlot): Slot<boolean> | undefined | 'new_info' | 'bad' {
  const yes = ResearchSlot_count(slot, DirStatus.Yes);
  const no = ResearchSlot_count(slot, DirStatus.No);

  if (slot.form === 'T') {
    if (yes === 4 || no >= 2) return 'bad';

    if (yes === 3) return ResearchSlot_finalize(slot, DirStatus.No);
    if (no === 1)  return ResearchSlot_finalize(slot, DirStatus.Yes);
  } else if (slot.form === 'i') {
    if (yes > 1 || no > 3) return 'bad';

    if (yes === 1) return ResearchSlot_finalize(slot, DirStatus.No);
    if (no === 3)  return ResearchSlot_finalize(slot, DirStatus.Yes);
  } else if (slot.form === 'I') {
    if (yes > 2 || no > 2) return 'bad';
    for (const dir of Dirs) {
      if (slot[dir] === DirStatus.Yes && slot[Dir_opposite(dir)] === DirStatus.No) return 'bad';
    }

    if (yes > 0 || no > 0) {
      for (const dir of Dirs) {
        if (slot[dir] !== DirStatus.Maybe) {
          for (const d of Dirs) {
            slot[d] = (d === dir || d === Dir_opposite(dir)) ? slot[dir] : DirStatus_negate(slot[dir]);
          }

          return ResearchSlot_finalize(slot, DirStatus.Yes);
        }
      }
    }
  } else if (slot.form === 'L') {
    if (yes > 2 || no > 2) return 'bad';

    for (const dir of Dirs) {
      if (slot[dir] !== DirStatus.Maybe) {
        if (slot[Dir_opposite(dir)] === slot[dir]) return 'bad';
      }
    }

    const maybeBefore = ResearchSlot_count(slot, DirStatus.Maybe);

    for (const dir of Dirs) {
      if (slot[dir] !== DirStatus.Maybe) {
        slot[Dir_opposite(dir)] = DirStatus_negate(slot[dir]);
      }
    }

    const maybeAfter = ResearchSlot_count(slot, DirStatus.Maybe);

    if (maybeAfter === 0) return ResearchSlot_finalize(slot, DirStatus.Yes);
    if (maybeBefore !== maybeAfter) return 'new_info';
  }

  return undefined;
}

function ResearchSlot_finalize(slot: ResearchSlot, maybeBecomes: DirStatus): Slot<boolean> {
  const pass = (status: DirStatus) => (status === DirStatus.Maybe ? maybeBecomes : status) === DirStatus.Yes;

  return {
    north: pass(slot.north),
    south: pass(slot.south),
    east: pass(slot.east),
    west: pass(slot.west)
  };
}

/**
 * Clones the solvation slot if it is a research slot, returns the same object
 * if it is a solved slot.
 * @param slot The slot to clone
 */
export function SolvationSlot_clone(slot: SolvationSlot): SolvationSlot {
  if ('form' in slot) {
    return Object.assign({}, slot);
  } else {
    return slot;
  }
}

/** Returns the number of outputs of the slot with the given status */
export function ResearchSlot_count(slot: ResearchSlot, status: DirStatus): 0 | 1 | 2 | 3 | 4 {
  let cnt = 0;
  if (slot.north === status) ++cnt;
  if (slot.south === status) ++cnt;
  if (slot.east === status) ++cnt;
  if (slot.west === status) ++cnt;
  return cnt as (0 | 1 | 2 | 3 | 4);
}

/**
 * Returns the slot of the slot. Throws if the slot has 0 or 4 outputs
 * @param slot The slot
 * @returns The form of the slot
 */
export function Slot_formOf(slot: Slot<boolean>): Form {
  const numberOfDirections = Slot_nbOfOutputs(slot);

  switch (numberOfDirections) {
    case 1: return 'i';
    case 3: return 'T';
    case 2: return slot.south === slot.north ? 'I' : 'L';
    default: throw Error("Fixed form slot");
  }
}

