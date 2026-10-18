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

describe('PDF copy repair', () => {
  const roster = [
    { id: 'w', name: 'Warren Green' },
    { id: 'g', name: 'Abigail Guerra' },
    { id: 'b', name: 'Belynda Van Tuil' },
    { id: 'k', name: 'Kyle Webster' },
    { id: 'si', name: 'Silas Westover' },
    { id: 'st', name: 'Stillman Sykes' },
    { id: 'e', name: 'Emmett Tetreault' },
    { id: 'm', name: 'Matthew Totten' },
    { id: 'd', name: 'Dayana Trottier' },
    { id: 'eli', name: 'Eli Dunham Westlund' },
    { id: 'v', name: 'Vyelle Agcaoili' },
    { id: 'c', name: 'Dakohota Charest', preferredName: 'Cody' },
  ];
  const matchedIds = (text: string) =>
    matchPastedNameList(text, roster).matched.map((m) => m.student.id);

  it('rejoins a name broken across lines', () => {
    expect(
      matchedIds('Green\nWarren\nGuerra Abigail\nvan\nTuil Belynda'),
    ).toEqual(['w', 'g', 'b']);
  });

  it('splits several names run together on one line', () => {
    const result = matchPastedNameList(
      'Sykes Stillman Tetreault Emmett Totten Matthew Trottier Dayana\nWebster Kyle Westover Silas',
      roster,
    );
    expect(result.matched.map((m) => m.student.id)).toEqual([
      'st',
      'e',
      'm',
      'd',
      'k',
      'si',
    ]);
    expect(result.unmatched).toEqual([]);
  });

  it('rejoins Last and First on alternate lines, dropping the report preamble', () => {
    const pdfCopy = [
      'PowerSchool SIS',
      '<Custom Student List',
      'North Country Union Junior High School',
      '26-27 Year',
      'Perfect Attendance 10/12/26-10/16/26 North Country Union Junior High School',
      'Last',
      '',
      'First',
      'Agcaoili',
      '',
      'Vyelle Alistaire',
      '\fDunham Westlund',
      'Eli',
      'Charest',
      'Dakohota (Cody)',
    ].join('\n');
    const result = matchPastedNameList(pdfCopy, roster);
    expect(result.matched.map((m) => m.student.id)).toEqual(['v', 'eli', 'c']);
    expect(result.unmatched).toEqual([]);
  });

  it('does not let an unknown name swallow the next line', () => {
    const result = matchPastedNameList('Nobody Here\nWebster Kyle', roster);
    expect(result.unmatched).toEqual(['Nobody Here']);
    expect(result.matched.map((m) => m.student.id)).toEqual(['k']);
  });
});
