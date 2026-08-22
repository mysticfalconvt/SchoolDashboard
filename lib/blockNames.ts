import { NUMBER_OF_BLOCKS } from '../config';

// Blocks used to be plain numbers, but the schedule is now six colour-coded
// classes rotating through an A/B day. block1-6 are the A rotation and
// block7-12 the B rotation, keyed on colour — so block 3 and block 9 are both
// Yellow, one in each rotation. Staff and students read their schedule by
// colour, never by block number, so every user-facing label comes from here.
export const BLOCK_COLORS = [
  'Red',
  'Orange',
  'Yellow',
  'Green',
  'Blue',
  'Purple',
] as const;

export const BLOCKS_PER_ROTATION = BLOCK_COLORS.length;

// A swatch colour per block colour, for the dot shown beside a label.
export const BLOCK_COLOR_HEX: Record<string, string> = {
  Red: '#e2483d',
  Orange: '#e2823d',
  Yellow: '#d7c02f',
  Green: '#3da85a',
  Blue: '#3d78e2',
  Purple: '#8b5cd6',
};

// Only label the rotation when there is a second half to distinguish from.
const hasRotations = NUMBER_OF_BLOCKS > BLOCKS_PER_ROTATION;

const isNamedBlock = (block: number): boolean =>
  Number.isInteger(block) && block >= 1 && block <= BLOCKS_PER_ROTATION * 2;

/** 'Yellow' for blocks 3 and 9. Null for a block outside the colour rotation. */
export function blockColor(block: number): string | null {
  if (!isNamedBlock(block)) return null;
  return BLOCK_COLORS[(block - 1) % BLOCKS_PER_ROTATION];
}

/** 'A' for blocks 1-6, 'B' for 7-12. */
export function blockRotation(block: number): 'A' | 'B' | null {
  if (!isNamedBlock(block) || !hasRotations) return null;
  return block <= BLOCKS_PER_ROTATION ? 'A' : 'B';
}

/** The same colour in the other rotation — 3 <-> 9. Null when it doesn't exist. */
export function pairedBlock(block: number): number | null {
  if (!isNamedBlock(block) || !hasRotations) return null;
  const pair =
    block <= BLOCKS_PER_ROTATION
      ? block + BLOCKS_PER_ROTATION
      : block - BLOCKS_PER_ROTATION;
  return pair <= NUMBER_OF_BLOCKS ? pair : null;
}

/** 'Yellow A'. Falls back to 'Block 13' for anything off the colour wheel. */
export function blockName(block: number): string {
  const color = blockColor(block);
  if (!color) return `Block ${block}`;
  const rotation = blockRotation(block);
  return rotation ? `${color} ${rotation}` : color;
}

/** 'Yellow A/B' — one label for a colour taught the same way in both rotations. */
export function pairedBlockName(block: number): string {
  const color = blockColor(block);
  if (!color || !hasRotations) return blockName(block);
  return `${color} A/B`;
}

export interface BlockDisplay {
  /** The block to read data from, and the A block of a merged pair. */
  block: number;
  /** Every block this entry stands for — one, or an A/B pair. */
  blocks: number[];
  /** 'Yellow A/B' when merged, otherwise 'Yellow A'. */
  name: string;
  color: string | null;
  merged: boolean;
}

const displayFor = (blocks: number[]): BlockDisplay => ({
  block: blocks[0],
  blocks,
  name: blocks.length > 1 ? pairedBlockName(blocks[0]) : blockName(blocks[0]),
  color: blockColor(blocks[0]),
  merged: blocks.length > 1,
});

/**
 * The blocks to show, colour by colour, collapsing an A/B pair into a single
 * entry whenever `isSameInBothRotations` says the two halves are identical.
 * Unmerged halves stay adjacent, so a colour is always read in one place.
 */
export function blockDisplayList(
  isSameInBothRotations?: (blockA: number, blockB: number) => boolean,
): BlockDisplay[] {
  const list: BlockDisplay[] = [];
  const firstHalf = Math.min(NUMBER_OF_BLOCKS, BLOCKS_PER_ROTATION);

  for (let a = 1; a <= firstHalf; a++) {
    const b = pairedBlock(a);
    if (b && isSameInBothRotations?.(a, b)) {
      list.push(displayFor([a, b]));
    } else {
      list.push(displayFor([a]));
      if (b) list.push(displayFor([b]));
    }
  }

  // Anything past the two rotations keeps its number.
  for (let n = BLOCKS_PER_ROTATION * 2 + 1; n <= NUMBER_OF_BLOCKS; n++) {
    list.push(displayFor([n]));
  }
  return list;
}

/** One entry per colour, each carrying its A and B blocks. For table columns. */
export function blockColorGroups(): {
  color: string;
  name: string;
  blockA: number;
  blockB: number | null;
}[] {
  const firstHalf = Math.min(NUMBER_OF_BLOCKS, BLOCKS_PER_ROTATION);
  return Array.from({ length: firstHalf }, (_, i) => {
    const blockA = i + 1;
    return {
      color: BLOCK_COLORS[i],
      name: BLOCK_COLORS[i],
      blockA,
      blockB: pairedBlock(blockA),
    };
  });
}

/** Treats null/undefined/whitespace as equal, so two blank blocks match. */
export const sameText = (a?: string | null, b?: string | null): boolean =>
  (a || '').trim() === (b || '').trim();
