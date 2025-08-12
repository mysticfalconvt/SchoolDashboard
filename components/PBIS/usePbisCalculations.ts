import { useMemo } from 'react';
import {
  PBIS_STUDENT_RANDOM_DRAWING_WINNERS,
} from '../../config';

const PBISCardsPerTaLevel = 24;
const PbisCardsPerPersonalLevel = [
  25, 50, 85, 120, 165, 210, 265, 320, 385, 450, 525, 600, 675, 750,
];
const weeklyWinnerCount = 10;
const collectionsWithoutRepeatWinners = 3;

const shuffle = <T>(array: T[]): T[] => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

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
  taTeamPbisLevelChange?: number;
  newCardsPerStudent?: number;
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

interface PbisCollectionData {
  pbisCollectionDates: PbisCollectionDate[];
  pbisCardsCount: number;
  taTeachers: TaTeacher[];
}

interface CalculatedResults {
  totalCards: number;
  taTeachersWithChanges: Array<TaTeacher & {
    taTeamPbisLevelChange: number;
    newCardsPerStudent: number;
  }>;
  studentsLevelingUp: Array<TaStudent & {
    newLevel: number;
    levelChange: number;
  }>;
  randomDrawingWinners: Array<{
    id: string;
    name: string;
    ticketCount: number;
  }>;
  hasRecentCollection: boolean;
  daysSinceLastCollection?: number;
}

export function usePbisCalculations(data: PbisCollectionData | undefined): CalculatedResults {
  return useMemo(() => {
    if (!data) {
      return {
        totalCards: 0,
        taTeachersWithChanges: [],
        studentsLevelingUp: [],
        randomDrawingWinners: [],
        hasRecentCollection: false,
      };
    }

    const totalCards = data.pbisCardsCount || 0;

    // Check if there's a recent collection (within 7 days)
    let hasRecentCollection = false;
    let daysSinceLastCollection: number | undefined;
    
    if (data.pbisCollectionDates && data.pbisCollectionDates.length > 0) {
      const latestCollection = data.pbisCollectionDates[0];
      const latestDate = new Date(latestCollection.collectionDate);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - latestDate.getTime());
      daysSinceLastCollection = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      hasRecentCollection = daysSinceLastCollection < 7;
    }

    // Calculate TA team changes
    const taTeachersWithChanges = data.taTeachers.map((teacher) => {
      const taStudents = teacher.taStudents;
      const taTeamPreviousPbisLevel = teacher.taTeamPbisLevel;
      const taTeamPreviousAveragePbisCardsPerStudent = teacher.taTeamAveragePbisCardsPerStudent;
      
      const taTeamCurrentCardsFromAllStudents = taStudents.reduce(
        (acc, cur) => acc + cur.studentPbisCardsCount,
        0,
      );

      const taTeamCurrentAveragePbisCardsPerStudent =
        taTeamCurrentCardsFromAllStudents / (taStudents?.length || 1) +
        taTeamPreviousAveragePbisCardsPerStudent;

      const taTeamCurrentPbisLevel = Math.floor(
        taTeamCurrentAveragePbisCardsPerStudent / PBISCardsPerTaLevel,
      );
      
      const taTeamPbisLevelChange = taTeamCurrentPbisLevel - taTeamPreviousPbisLevel || 0;

      return {
        ...teacher,
        taTeamPbisLevelChange,
        newCardsPerStudent: taTeamCurrentAveragePbisCardsPerStudent,
      };
    });

    // Calculate student level changes
    const arrayOfStudents = data.taTeachers.reduce(
      (acc, cur) => [...acc, ...cur.taStudents],
      [] as TaStudent[],
    );

    const studentsLevelingUp = arrayOfStudents
      .filter((student) => student.totalPBISCards > 0)
      .map((student) => {
        const studentPreviousPbisLevel = student.individualPbisLevel;
        const studentTotalCards = student.totalPBISCards;

        const studentCurrentPbisLevel = PbisCardsPerPersonalLevel.findIndex(
          (level) => level - 1 >= studentTotalCards,
        );

        const levelChange = studentCurrentPbisLevel - studentPreviousPbisLevel || 0;

        return {
          ...student,
          newLevel: studentCurrentPbisLevel,
          levelChange,
        };
      })
      .filter((student) => student.levelChange > 0);

    // Calculate random drawing winners
    const previousCollections = data.pbisCollectionDates?.sort(
      (a, b) =>
        new Date(b.collectionDate).getTime() - new Date(a.collectionDate).getTime(),
    ) || [];

    const previousWinnersToExclude = previousCollections
      .slice(0, collectionsWithoutRepeatWinners)
      .reduce((acc: string[], cur) => {
        const currentWinners = cur?.randomDrawingWinners || [];
        const winnerIds = currentWinners
          .map((winner) => winner.student.id)
          .filter((id): id is string => typeof id === 'string' && id.length > 0);
        return [...acc, ...winnerIds];
      }, []);

    const arrayOfStudentsWithNewCards = arrayOfStudents.filter(
      (student) => student.totalPBISCards > 0,
    );

    let randomDrawingWinners: Array<{ id: string; name: string; ticketCount: number }> = [];

    if (PBIS_STUDENT_RANDOM_DRAWING_WINNERS) {
      const arrayOfStudentsWithNewCardsNotPreviousWinners = arrayOfStudentsWithNewCards.filter(
        (student) => !previousWinnersToExclude.includes(String(student.id)),
      );

      // Create tickets array with student getting tickets based on card count
      const tickets = arrayOfStudentsWithNewCardsNotPreviousWinners.reduce(
        (acc: string[], cur) => {
          const studentTickets: string[] = [];
          for (let i = 0; i < cur.studentPbisCardsCount; i++) {
            studentTickets.push(cur.id);
          }
          return [...acc, ...studentTickets];
        },
        [],
      );

      const randomDrawingWinnerIds: string[] = [];
      // Pick the winners
      for (let i = 0; i < weeklyWinnerCount; i++) {
        const ticketsWithoutPreviousWinners: string[] = shuffle(
          tickets.filter((ticket: string) => !randomDrawingWinnerIds.includes(ticket)),
        );
        const winnerRandomNumber = Math.floor(
          Math.random() * ticketsWithoutPreviousWinners.length,
        );
        const winnerId = ticketsWithoutPreviousWinners[winnerRandomNumber];
        if (winnerId) {
          randomDrawingWinnerIds.push(winnerId);
        }
      }

      randomDrawingWinners = randomDrawingWinnerIds.map((winnerId) => {
        const student = arrayOfStudentsWithNewCardsNotPreviousWinners.find(
          (s) => s.id === winnerId,
        );
        return {
          id: winnerId,
          name: student?.name || 'Unknown',
          ticketCount: student?.studentPbisCardsCount || 0,
        };
      });
    }

    return {
      totalCards,
      taTeachersWithChanges: taTeachersWithChanges.filter(t => t.taTeamPbisLevelChange > 0),
      studentsLevelingUp,
      randomDrawingWinners,
      hasRecentCollection,
      daysSinceLastCollection,
    };
  }, [data]);
}