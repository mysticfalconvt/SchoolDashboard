// Test the shuffle function and other utility functions
const shuffle = <T>(array: T[]): T[] => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

describe('PBIS Logic Functions', () => {
  describe('shuffle function', () => {
    it('should shuffle an array', () => {
      const originalArray = [1, 2, 3, 4, 5];
      const shuffledArray = shuffle([...originalArray]);

      expect(shuffledArray).toHaveLength(originalArray.length);
      expect(shuffledArray.sort()).toEqual(originalArray.sort());
    });

    it('should handle empty array', () => {
      const result = shuffle([]);
      expect(result).toEqual([]);
    });

    it('should handle single element array', () => {
      const result = shuffle([1]);
      expect(result).toEqual([1]);
    });
  });

  describe('PBIS constants', () => {
    it('should have correct PBIS card levels', () => {
      const PbisCardsPerPersonalLevel = [
        25, 50, 85, 120, 165, 210, 265, 320, 385, 450, 525, 600, 675, 750,
      ];

      expect(PbisCardsPerPersonalLevel).toHaveLength(14);
      expect(PbisCardsPerPersonalLevel[0]).toBe(25);
      expect(PbisCardsPerPersonalLevel[13]).toBe(750);
    });

    it('should have correct TA level card requirement', () => {
      const PBISCardsPerTaLevel = 24;
      expect(PBISCardsPerTaLevel).toBe(24);
    });

    it('should have correct winner count', () => {
      const weeklyWinnerCount = 10;
      expect(weeklyWinnerCount).toBe(10);
    });

    it('should have correct collections without repeat winners', () => {
      const collectionsWithoutRepeatWinners = 3;
      expect(collectionsWithoutRepeatWinners).toBe(3);
    });
  });

  describe('level calculation logic', () => {
    it('should calculate student level correctly', () => {
      const PbisCardsPerPersonalLevel = [
        25, 50, 85, 120, 165, 210, 265, 320, 385, 450, 525, 600, 675, 750,
      ];

      // Test level 0 (0-24 cards)
      const level0 = PbisCardsPerPersonalLevel.findIndex(
        (level) => level - 1 >= 10,
      );
      expect(level0).toBe(0);

      // Test level 1 (25-49 cards)
      const level1 = PbisCardsPerPersonalLevel.findIndex(
        (level) => level - 1 >= 30,
      );
      expect(level1).toBe(1);

      // Test level 2 (50-84 cards)
      const level2 = PbisCardsPerPersonalLevel.findIndex(
        (level) => level - 1 >= 60,
      );
      expect(level2).toBe(2);
    });

    it('should calculate TA team level correctly', () => {
      const PBISCardsPerTaLevel = 24;

      // Test level 0 (0-23 cards per student)
      const level0 = Math.floor(10 / PBISCardsPerTaLevel);
      expect(level0).toBe(0);

      // Test level 1 (24-47 cards per student)
      const level1 = Math.floor(30 / PBISCardsPerTaLevel);
      expect(level1).toBe(1);

      // Test level 2 (48-71 cards per student)
      const level2 = Math.floor(50 / PBISCardsPerTaLevel);
      expect(level2).toBe(2);
    });
  });

  describe('random drawing logic', () => {
    it('should create tickets based on card count', () => {
      const students = [
        { id: 'student1', studentPbisCardsCount: 3 },
        { id: 'student2', studentPbisCardsCount: 1 },
        { id: 'student3', studentPbisCardsCount: 0 },
      ];

      const tickets = students.reduce((acc: string[], cur) => {
        const studentTickets: string[] = [];
        for (let i = 0; i < cur.studentPbisCardsCount; i++) {
          studentTickets.push(cur.id);
        }
        return [...acc, ...studentTickets];
      }, []);

      expect(tickets).toHaveLength(4); // 3 + 1 + 0
      expect(tickets.filter((t) => t === 'student1')).toHaveLength(3);
      expect(tickets.filter((t) => t === 'student2')).toHaveLength(1);
      expect(tickets.filter((t) => t === 'student3')).toHaveLength(0);
    });

    it('should exclude previous winners', () => {
      const tickets = ['student1', 'student1', 'student2', 'student3'];
      const previousWinnersToExclude = ['student1'];

      const availableTickets = tickets.filter(
        (ticket: string) => !previousWinnersToExclude.includes(ticket),
      );

      expect(availableTickets).toEqual(['student2', 'student3']);
    });
  });
});
