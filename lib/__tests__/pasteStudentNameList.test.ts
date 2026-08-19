import {
  isHeaderLine,
  matchPastedNameList,
  normalizeNamePart,
  splitPastedName,
} from '../pasteStudentNameList';

const students = [
  { id: '1', name: 'Rosa Maria Delgado' },
  { id: '2', name: 'Priya Anand' },
  { id: '3', name: 'Nora Whitfield' },
  { id: '4', name: 'Kai Lindqvist' },
  { id: '5', name: 'Maximilian Okonkwo', preferredName: 'Max' },
  { id: '6', name: "Finn O'Callahan" },
  { id: '7', name: 'Andre Fontaine' },
];

describe('normalizeNamePart', () => {
  it('lowercases, strips accents and punctuation', () => {
    expect(normalizeNamePart("O'Callahan")).toBe('ocallahan');
    expect(normalizeNamePart('Josè')).toBe('jose');
    expect(normalizeNamePart('  Lindqvist ')).toBe('lindqvist');
  });
});

describe('isHeaderLine', () => {
  it('detects spreadsheet headers', () => {
    expect(isHeaderLine('Last First')).toBe(true);
    expect(isHeaderLine('Student Name')).toBe(true);
    expect(isHeaderLine('Lindqvist Kai')).toBe(false);
  });
});

describe('splitPastedName', () => {
  it('reads "Last First" order', () => {
    expect(splitPastedName('Lindqvist Kai')).toEqual({
      last: 'lindqvist',
      first: 'kai',
      tokens: ['lindqvist', 'kai'],
    });
  });

  it('keeps the first name when there are middle names', () => {
    const split = splitPastedName('Delgado Rosa Maria');
    expect(split?.last).toBe('delgado');
    expect(split?.first).toBe('rosa');
  });

  it('handles "Last, First"', () => {
    const split = splitPastedName('Whitfield, Nora');
    expect(split?.last).toBe('whitfield');
    expect(split?.first).toBe('nora');
  });

  it('returns null for a single word or blank line', () => {
    expect(splitPastedName('Lindqvist')).toBeNull();
    expect(splitPastedName('   ')).toBeNull();
  });
});

describe('matchPastedNameList', () => {
  it('matches a pasted list, skipping the header and blank lines', () => {
    const text = `Last First
Delgado Rosa Maria
Anand Priya

Whitfield Nora
Lindqvist Kai`;

    const result = matchPastedNameList(text, students);
    expect(result.matched.map((m) => m.student.id)).toEqual([
      '1',
      '2',
      '3',
      '4',
    ]);
    expect(result.unmatched).toEqual([]);
    expect(result.ambiguous).toEqual([]);
    expect(result.duplicates).toEqual([]);
  });

  it('reports names it cannot find', () => {
    const result = matchPastedNameList('Nobody Here\nLindqvist Kai', students);
    expect(result.matched).toHaveLength(1);
    expect(result.unmatched).toEqual(['Nobody Here']);
  });

  it('matches on a preferred name', () => {
    const result = matchPastedNameList('Okonkwo Max', students);
    expect(result.matched[0].student.id).toBe('5');
  });

  it('ignores apostrophes and accents', () => {
    const result = matchPastedNameList(
      'OCallahan Finn\nFontaine André',
      students,
    );
    expect(result.matched.map((m) => m.student.id)).toEqual(['6', '7']);
  });

  it('matches when the names are pasted in "First Last" order', () => {
    const result = matchPastedNameList('Kai Lindqvist', students);
    expect(result.matched[0].student.id).toBe('4');
  });

  it('flags a repeated student instead of double counting them', () => {
    const result = matchPastedNameList(
      'Lindqvist Kai\nLindqvist Kai',
      students,
    );
    expect(result.matched).toHaveLength(1);
    expect(result.duplicates).toHaveLength(1);
    expect(result.duplicates[0].student.id).toBe('4');
  });

  it('flags names that match more than one student', () => {
    const twins = [
      { id: '10', name: 'Kai Lindqvist' },
      { id: '11', name: 'Kai Lindqvist' },
    ];
    const result = matchPastedNameList('Lindqvist Kai', twins);
    expect(result.matched).toHaveLength(0);
    expect(result.ambiguous[0].candidates.map((c) => c.id)).toEqual([
      '10',
      '11',
    ]);
  });

  it('falls back to last name plus first initial', () => {
    const result = matchPastedNameList('Anand P', students);
    expect(result.matched[0].student.id).toBe('2');
  });

  it('handles an empty list', () => {
    const result = matchPastedNameList('', students);
    expect(result).toEqual({
      matched: [],
      duplicates: [],
      ambiguous: [],
      unmatched: [],
    });
  });
});
