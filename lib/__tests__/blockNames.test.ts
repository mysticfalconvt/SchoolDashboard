import {
  BLOCKS_PER_ROTATION,
  blockColor,
  blockColorGroups,
  blockDisplayList,
  blockName,
  blockRotation,
  pairedBlock,
  pairedBlockName,
  sameText,
} from '../blockNames';

describe('blockNames', () => {
  it('names a block by its colour and rotation', () => {
    expect(blockName(1)).toBe('Red A');
    expect(blockName(3)).toBe('Yellow A');
    expect(blockName(6)).toBe('Purple A');
    expect(blockName(7)).toBe('Red B');
    expect(blockName(9)).toBe('Yellow B');
    expect(blockName(12)).toBe('Purple B');
  });

  it('falls back to a number for a block off the colour wheel', () => {
    expect(blockName(13)).toBe('Block 13');
    expect(blockColor(13)).toBeNull();
    expect(blockRotation(13)).toBeNull();
  });

  it('pairs the two rotations of one colour', () => {
    expect(pairedBlock(3)).toBe(9);
    expect(pairedBlock(9)).toBe(3);
    expect(blockColor(3)).toBe(blockColor(9));
    expect(pairedBlockName(3)).toBe('Yellow A/B');
    expect(pairedBlockName(9)).toBe('Yellow A/B');
  });

  it('treats blank and whitespace-only text as the same', () => {
    expect(sameText(undefined, '')).toBe(true);
    expect(sameText(' Math ', 'Math')).toBe(true);
    expect(sameText('Math', 'Science')).toBe(false);
  });

  describe('blockDisplayList', () => {
    it('lists every block, A next to B, when nothing matches', () => {
      const list = blockDisplayList(() => false);
      expect(list).toHaveLength(BLOCKS_PER_ROTATION * 2);
      expect(list.map((entry) => entry.block)).toEqual([
        1, 7, 2, 8, 3, 9, 4, 10, 5, 11, 6, 12,
      ]);
      expect(list.every((entry) => !entry.merged)).toBe(true);
    });

    it('collapses a colour whose rotations match into one entry', () => {
      const list = blockDisplayList((a) => a === 3);
      expect(list).toHaveLength(BLOCKS_PER_ROTATION * 2 - 1);
      const yellow = list.find((entry) => entry.color === 'Yellow');
      expect(yellow).toMatchObject({
        block: 3,
        blocks: [3, 9],
        name: 'Yellow A/B',
        merged: true,
      });
      // The B half is no longer listed on its own.
      expect(list.filter((entry) => entry.block === 9)).toHaveLength(0);
    });

    it('collapses everything when both rotations always match', () => {
      const list = blockDisplayList(() => true);
      expect(list.map((entry) => entry.name)).toEqual([
        'Red A/B',
        'Orange A/B',
        'Yellow A/B',
        'Green A/B',
        'Blue A/B',
        'Purple A/B',
      ]);
    });

    it('keeps both halves separate with no predicate', () => {
      expect(blockDisplayList()).toHaveLength(BLOCKS_PER_ROTATION * 2);
    });
  });

  it('groups the blocks one row per colour', () => {
    expect(blockColorGroups()).toEqual([
      { color: 'Red', name: 'Red', blockA: 1, blockB: 7 },
      { color: 'Orange', name: 'Orange', blockA: 2, blockB: 8 },
      { color: 'Yellow', name: 'Yellow', blockA: 3, blockB: 9 },
      { color: 'Green', name: 'Green', blockA: 4, blockB: 10 },
      { color: 'Blue', name: 'Blue', blockA: 5, blockB: 11 },
      { color: 'Purple', name: 'Purple', blockA: 6, blockB: 12 },
    ]);
  });
});
