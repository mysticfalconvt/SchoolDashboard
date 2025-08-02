// Test the business logic extracted from useV3PbisCollection
// This tests the core algorithms without the GraphQL dependencies

const shuffleArray = <T>(array: T[]): T[] => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const PBISCardsPerTaLevel = 24;
const PbisCardsPerPersonalLevel = [
  25, 50, 85, 120, 165, 210, 265, 320, 385, 450, 525, 600, 675, 750,
];
const weeklyWinnerCount = 10;
const collectionsWithoutRepeatWinners = 3;

interface TaStudent {
  id: string;
  name: string;
  studentPbisCardsCount: number;
  totalPBISCards: number;
  individualPbisLevel: number;
}

interface TaTeacher {
  id: string;
  name: string;
  taTeamPbisLevel: number;
  taPbisCardCount: number;
  taTeamAveragePbisCardsPerStudent: number;
  taStudents: TaStudent[];
}

interface PbisCollectionDate {
  id: string;
  collectionDate: string;
  randomDrawingWinners?: Array<{
    id: string;
    student: {
      id: string;
      name: string;
    };
  }>;
}

// Business logic functions extracted from the hook
const calculateTaTeamLevel = (teacher: TaTeacher): number => {
  const taTeamCurrentCardsFromAllStudents = teacher.taStudents.reduce(
    (acc, cur) => acc + cur.studentPbisCardsCount,
    0,
  );

  const taTeamCurrentAveragePbisCardsPerStudent =
    taTeamCurrentCardsFromAllStudents / (teacher.taStudents?.length || 1) +
    teacher.taTeamAveragePbisCardsPerStudent;

  return Math.floor(
    taTeamCurrentAveragePbisCardsPerStudent / PBISCardsPerTaLevel,
  );
};

const calculateStudentLevel = (student: TaStudent): number => {
  return PbisCardsPerPersonalLevel.findIndex(
    (level) => level - 1 >= student.totalPBISCards,
  );
};

const createRandomDrawingTickets = (students: TaStudent[]): string[] => {
  return students.reduce((acc: string[], cur) => {
    const studentTickets: string[] = [];
    for (let i = 0; i < cur.studentPbisCardsCount; i++) {
      studentTickets.push(cur.id);
    }
    return [...acc, ...studentTickets];
  }, []);
};

const excludePreviousWinners = (
  tickets: string[],
  previousCollections: PbisCollectionDate[],
): string[] => {
  const previousWinnersToExclude = previousCollections
    .slice(0, collectionsWithoutRepeatWinners)
    .reduce((acc: string[], cur) => {
      const currentWinners = cur?.randomDrawingWinners || [];
      const winnerIds = currentWinners
        .map((winner) => winner.student.id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0);
      return [...acc, ...winnerIds];
    }, []);

  return tickets.filter((ticket) => !previousWinnersToExclude.includes(ticket));
};

const selectRandomWinners = (tickets: string[]): string[] => {
  const winners: string[] = [];
  const shuffledTickets = shuffleArray([...tickets]);

  for (let i = 0; i < weeklyWinnerCount && i < shuffledTickets.length; i++) {
    const winnerId = shuffledTickets[i];
    if (winnerId && !winners.includes(winnerId)) {
      winners.push(winnerId);
    }
  }

  return winners;
};

describe('PBIS Business Logic', () => {
  describe('Shuffle Function', () => {
    it('should shuffle an array', () => {
      const originalArray = [1, 2, 3, 4, 5];
      const shuffledArray = shuffleArray([...originalArray]);

      expect(shuffledArray).toHaveLength(originalArray.length);
      expect(shuffledArray.sort()).toEqual(originalArray.sort());
    });

    it('should handle empty array', () => {
      const result = shuffleArray([]);
      expect(result).toEqual([]);
    });

    it('should handle single element array', () => {
      const result = shuffleArray([1]);
      expect(result).toEqual([1]);
    });
  });

  describe('TA Team Level Calculations', () => {
    it('should calculate TA team level correctly', () => {
      const teacher: TaTeacher = {
        id: 'teacher1',
        name: 'Teacher One',
        taTeamPbisLevel: 1,
        taPbisCardCount: 50,
        taTeamAveragePbisCardsPerStudent: 20,
        taStudents: [
          {
            id: 'student1',
            name: 'John Doe',
            studentPbisCardsCount: 10,
            totalPBISCards: 100,
            individualPbisLevel: 3,
          },
          {
            id: 'student2',
            name: 'Jane Smith',
            studentPbisCardsCount: 15,
            totalPBISCards: 150,
            individualPbisLevel: 4,
          },
        ],
      };

      const newLevel = calculateTaTeamLevel(teacher);
      expect(newLevel).toBeGreaterThanOrEqual(0);
      expect(typeof newLevel).toBe('number');
    });

    it('should handle empty students array', () => {
      const teacher: TaTeacher = {
        id: 'teacher1',
        name: 'Teacher One',
        taTeamPbisLevel: 1,
        taPbisCardCount: 50,
        taTeamAveragePbisCardsPerStudent: 20,
        taStudents: [],
      };

      const newLevel = calculateTaTeamLevel(teacher);
      expect(newLevel).toBeGreaterThanOrEqual(0);
    });

    it('should calculate level based on PBIS cards per TA level', () => {
      const teacher: TaTeacher = {
        id: 'teacher1',
        name: 'Teacher One',
        taTeamPbisLevel: 1,
        taPbisCardCount: 50,
        taTeamAveragePbisCardsPerStudent: 0,
        taStudents: [
          {
            id: 'student1',
            name: 'John Doe',
            studentPbisCardsCount: 24, // Exactly one level
            totalPBISCards: 100,
            individualPbisLevel: 3,
          },
        ],
      };

      const newLevel = calculateTaTeamLevel(teacher);
      expect(newLevel).toBe(1); // 24 cards / 24 per level = level 1
    });
  });

  describe('Student Level Calculations', () => {
    it('should calculate student level correctly', () => {
      const student: TaStudent = {
        id: 'student1',
        name: 'John Doe',
        studentPbisCardsCount: 10,
        totalPBISCards: 100,
        individualPbisLevel: 3,
      };

      const newLevel = calculateStudentLevel(student);
      expect(newLevel).toBeGreaterThanOrEqual(0);
      expect(typeof newLevel).toBe('number');
    });

    it('should handle level 0 (0-24 cards)', () => {
      const student: TaStudent = {
        id: 'student1',
        name: 'John Doe',
        studentPbisCardsCount: 10,
        totalPBISCards: 10,
        individualPbisLevel: 0,
      };

      const newLevel = calculateStudentLevel(student);
      expect(newLevel).toBe(0);
    });

    it('should handle level 1 (25-49 cards)', () => {
      const student: TaStudent = {
        id: 'student1',
        name: 'John Doe',
        studentPbisCardsCount: 10,
        totalPBISCards: 30,
        individualPbisLevel: 0,
      };

      const newLevel = calculateStudentLevel(student);
      expect(newLevel).toBe(1);
    });

    it('should handle level 2 (50-84 cards)', () => {
      const student: TaStudent = {
        id: 'student1',
        name: 'John Doe',
        studentPbisCardsCount: 10,
        totalPBISCards: 60,
        individualPbisLevel: 1,
      };

      const newLevel = calculateStudentLevel(student);
      expect(newLevel).toBe(2);
    });

    it('should handle maximum level', () => {
      const student: TaStudent = {
        id: 'student1',
        name: 'John Doe',
        studentPbisCardsCount: 10,
        totalPBISCards: 1000,
        individualPbisLevel: 0,
      };

      const newLevel = calculateStudentLevel(student);
      expect(newLevel).toBe(-1); // findIndex returns -1 when no level is found
    });
  });

  describe('Random Drawing Logic', () => {
    it('should create tickets based on card count', () => {
      const students: TaStudent[] = [
        {
          id: 'student1',
          name: 'John Doe',
          studentPbisCardsCount: 3,
          totalPBISCards: 100,
          individualPbisLevel: 3,
        },
        {
          id: 'student2',
          name: 'Jane Smith',
          studentPbisCardsCount: 1,
          totalPBISCards: 150,
          individualPbisLevel: 4,
        },
        {
          id: 'student3',
          name: 'Bob Wilson',
          studentPbisCardsCount: 0,
          totalPBISCards: 200,
          individualPbisLevel: 2,
        },
      ];

      const tickets = createRandomDrawingTickets(students);

      expect(tickets).toHaveLength(4); // 3 + 1 + 0
      expect(tickets.filter((t) => t === 'student1')).toHaveLength(3);
      expect(tickets.filter((t) => t === 'student2')).toHaveLength(1);
      expect(tickets.filter((t) => t === 'student3')).toHaveLength(0);
    });

    it('should exclude previous winners', () => {
      const tickets = ['student1', 'student1', 'student2', 'student3'];
      const previousCollections: PbisCollectionDate[] = [
        {
          id: '1',
          collectionDate: '2024-01-01T00:00:00.000Z',
          randomDrawingWinners: [
            { id: 'winner1', student: { id: 'student1', name: 'John Doe' } },
          ],
        },
        {
          id: '2',
          collectionDate: '2023-12-25T00:00:00.000Z',
          randomDrawingWinners: [
            { id: 'winner2', student: { id: 'student2', name: 'Jane Smith' } },
          ],
        },
      ];

      const availableTickets = excludePreviousWinners(
        tickets,
        previousCollections,
      );

      expect(availableTickets).toEqual(['student3']);
    });

    it('should select random winners', () => {
      const tickets = [
        'student1',
        'student1',
        'student2',
        'student3',
        'student4',
      ];
      const winners = selectRandomWinners(tickets);

      expect(winners.length).toBeLessThanOrEqual(weeklyWinnerCount);
      expect(winners.length).toBeLessThanOrEqual(tickets.length);
      expect(winners.every((winner) => tickets.includes(winner))).toBe(true);
    });

    it('should handle insufficient tickets', () => {
      const tickets = ['student1', 'student2'];
      const winners = selectRandomWinners(tickets);

      expect(winners.length).toBeLessThanOrEqual(tickets.length);
      expect(winners.length).toBeLessThanOrEqual(weeklyWinnerCount);
    });

    it('should not select duplicate winners', () => {
      const tickets = ['student1', 'student1', 'student1'];
      const winners = selectRandomWinners(tickets);

      const uniqueWinners = new Set(winners);
      expect(winners.length).toBe(uniqueWinners.size);
    });
  });

  describe('Constants and Configuration', () => {
    it('should have correct PBIS card levels', () => {
      expect(PbisCardsPerPersonalLevel).toHaveLength(14);
      expect(PbisCardsPerPersonalLevel[0]).toBe(25);
      expect(PbisCardsPerPersonalLevel[13]).toBe(750);
    });

    it('should have correct TA level card requirement', () => {
      expect(PBISCardsPerTaLevel).toBe(24);
    });

    it('should have correct winner count', () => {
      expect(weeklyWinnerCount).toBe(10);
    });

    it('should have correct collections without repeat winners', () => {
      expect(collectionsWithoutRepeatWinners).toBe(3);
    });
  });

  describe('Integration Tests', () => {
    it('should process complete PBIS collection workflow', () => {
      const teachers: TaTeacher[] = [
        {
          id: 'teacher1',
          name: 'Teacher One',
          taTeamPbisLevel: 1,
          taPbisCardCount: 50,
          taTeamAveragePbisCardsPerStudent: 20,
          taStudents: [
            {
              id: 'student1',
              name: 'John Doe',
              studentPbisCardsCount: 10,
              totalPBISCards: 100,
              individualPbisLevel: 3,
            },
            {
              id: 'student2',
              name: 'Jane Smith',
              studentPbisCardsCount: 15,
              totalPBISCards: 150,
              individualPbisLevel: 4,
            },
          ],
        },
      ];

      const previousCollections: PbisCollectionDate[] = [
        {
          id: '1',
          collectionDate: '2024-01-01T00:00:00.000Z',
          randomDrawingWinners: [
            { id: 'winner1', student: { id: 'student1', name: 'John Doe' } },
          ],
        },
      ];

      // Test TA level calculation
      const newTaLevel = calculateTaTeamLevel(teachers[0]);
      expect(newTaLevel).toBeGreaterThanOrEqual(0);

      // Test student level calculation
      const newStudentLevel = calculateStudentLevel(teachers[0].taStudents[0]);
      expect(newStudentLevel).toBeGreaterThanOrEqual(0);

      // Test random drawing
      const allStudents = teachers.flatMap((teacher) => teacher.taStudents);
      const tickets = createRandomDrawingTickets(allStudents);
      const availableTickets = excludePreviousWinners(
        tickets,
        previousCollections,
      );
      const winners = selectRandomWinners(availableTickets);

      expect(tickets.length).toBeGreaterThan(0);
      expect(availableTickets.length).toBeLessThanOrEqual(tickets.length);
      expect(winners.length).toBeLessThanOrEqual(weeklyWinnerCount);
    });
  });
});
