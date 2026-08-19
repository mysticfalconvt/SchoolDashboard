import {
  buildCardsForStudents,
  chunkCards,
  daysAgoIso,
  latestCardDateByStudent,
} from '../BulkPbisCardsFromList';

describe('buildCardsForStudents', () => {
  it('creates one card per student per count', () => {
    const cards = buildCardsForStudents({
      studentIds: ['a', 'b'],
      teacherId: 't1',
      cardsPerStudent: 3,
      category: 'class',
      message: 'Perfect Attendance',
    });

    expect(cards).toHaveLength(6);
    expect(cards.filter((c) => c.student.connect.id === 'a')).toHaveLength(3);
    expect(cards[0]).toEqual({
      student: { connect: { id: 'a' } },
      teacher: { connect: { id: 't1' } },
      category: 'class',
      cardMessage: 'Perfect Attendance',
    });
  });

  it('makes no cards for an empty list', () => {
    expect(
      buildCardsForStudents({
        studentIds: [],
        teacherId: 't1',
        cardsPerStudent: 3,
        category: 'class',
        message: 'Perfect Attendance',
      }),
    ).toEqual([]);
  });
});

describe('chunkCards', () => {
  it('splits cards into batches', () => {
    const cards = buildCardsForStudents({
      studentIds: ['a', 'b', 'c'],
      teacherId: 't1',
      cardsPerStudent: 3,
      category: 'class',
      message: 'Perfect Attendance',
    });
    const chunks = chunkCards(cards, 4);
    expect(chunks.map((c) => c.length)).toEqual([4, 4, 1]);
  });

  it('returns nothing for no cards', () => {
    expect(chunkCards([], 100)).toEqual([]);
  });
});

describe('daysAgoIso', () => {
  it('goes back the given number of days', () => {
    const from = new Date('2026-08-19T12:00:00.000Z');
    expect(daysAgoIso(5, from)).toBe('2026-08-14T12:00:00.000Z');
  });
});

describe('latestCardDateByStudent', () => {
  it('keeps the most recent card per student', () => {
    const latest = latestCardDateByStudent([
      {
        id: '1',
        dateGiven: '2026-08-14T12:00:00.000Z',
        student: { id: 'a' },
      },
      {
        id: '2',
        dateGiven: '2026-08-18T12:00:00.000Z',
        student: { id: 'a' },
      },
      {
        id: '3',
        dateGiven: '2026-08-15T12:00:00.000Z',
        student: { id: 'b' },
      },
    ]);

    expect(latest).toEqual({
      a: '2026-08-18T12:00:00.000Z',
      b: '2026-08-15T12:00:00.000Z',
    });
  });

  it('ignores cards with no student', () => {
    expect(
      latestCardDateByStudent([
        { id: '1', dateGiven: '2026-08-14T12:00:00.000Z', student: null },
      ]),
    ).toEqual({});
  });
});
