import { useGqlMutation } from '@/lib/useGqlMutation';
import gql from 'graphql-tag';
import { useState } from 'react';
import { useGQLQuery } from '../../lib/useGqlQuery';

const shuffle = <T>(array: T[]): T[] => {
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

const GET_ALL_PBIS_DATES_QUERY = gql`
  # sort by date descending
  query GET_ALL_PBIS_DATES {
    pbisCollectionDates(orderBy: { collectionDate: desc }) {
      id
      collectionDate
    }
  }
`;

const PBIS_COLLECTION_QUERY = gql`
  query GET_PBIS_COLLECTION_DATA($date: DateTime!) {
    pbisCollectionDates {
      id
      collectionDate
      collectedCards
      randomDrawingWinners {
        id
        student {
          id
          name
        }
      }
      personalLevelWinners {
        id
        name
      }
    }
    pbisCardsCount(where: { dateGiven: { gt: $date } })

    taTeachers: users(
      where: {
        AND: [{ isStaff: { equals: true } }, { hasTA: { equals: true } }]
      }
    ) {
      id
      name
      taTeamPbisLevel
      taPbisCardCount
      taTeamAveragePbisCardsPerStudent
      taStudents {
        id
        name
        studentPbisCardsCount(where: { dateGiven: { gt: $date } })
        totalPBISCards: studentPbisCardsCount
        individualPbisLevel
      }
    }
  }
`;
const COUNT_CARDS_DATE_MUTATION = gql`
  mutation COUNT_CARDS_DATE_MUTATION(
    $date: DateTime!
    $collectedCards: String
  ) {
    createPbisCollectionDate(
      data: { collectionDate: $date, collectedCards: $collectedCards }
    ) {
      id
    }
  }
`;

const UPDATE_TA_AVERAGE_CARDS_MUTATION = gql`
  mutation UPDATE_TA_AVERAGE_CARDS_MUTATION(
    $id: ID!
    $averagePbisCardsPerStudent: Int
    $taTeamPbisLevel: Int
  ) {
    updateUser(
      where: { id: $id }
      data: {
        taTeamAveragePbisCardsPerStudent: $averagePbisCardsPerStudent
        taTeamPbisLevel: $taTeamPbisLevel
      }
    ) {
      id
    }
  }
`;

interface PbisCollectionDate {
  id: string;
  collectionDate: string;
  collectedCards?: string;
  randomDrawingWinners?: any[];
  personalLevelWinners?: any[];
}

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

interface PbisCollectionData {
  pbisCollectionDates: PbisCollectionDate[];
  pbisCardsCount: number;
  taTeachers: TaTeacher[];
}

interface UseV3PbisCollectionReturn {
  runCardCollection: () => Promise<string>;
  data: PbisCollectionData | undefined;
  setGetData: (get: boolean) => void;
  getData: boolean;
  loading: boolean;
}

export default function useV3PbisCollection(): UseV3PbisCollectionReturn {
  const [getData, setGetData] = useState(false);
  const [loading, setLoading] = useState(false);

  const [
    countCardsDateMutation,
    { data: countData, loading: countLoading, error },
  ] = useGqlMutation(COUNT_CARDS_DATE_MUTATION);
  const [updateTaAverageCardsMutation] = useGqlMutation(
    UPDATE_TA_AVERAGE_CARDS_MUTATION,
    {},
  );

  const { data } = useGQLQuery(
    'pbisCollection',
    PBIS_COLLECTION_QUERY,
    { date: new Date().toISOString() },
    { enabled: !!getData },
  );

  async function runCardCollection(): Promise<string> {
    setLoading(true);
    const collectionDate = new Date();
    const collectionDateString = collectionDate.toISOString();

    // get all the students who went up a level
    const studentsWithNewPersonalLevel: any[] = [];
    data?.taTeachers.forEach((teacher) => {
      teacher.taStudents.forEach((student) => {
        const newCardsPerStudent = student.totalPBISCards;
        const newPersonalLevel = Math.floor(
          newCardsPerStudent /
            PbisCardsPerPersonalLevel[student.individualPbisLevel || 0],
        );
        const isNewLevel =
          Number(newPersonalLevel) > (Number(student.individualPbisLevel) || 0);
        if (isNewLevel) {
          studentsWithNewPersonalLevel.push({
            name: student.name,
            id: student.id,
            individualPbisLevel: newPersonalLevel || 0,
          });
        }
      });
    });

    // get all the random drawing winners
    const allCards: any[] = [];
    data?.taTeachers.forEach((teacher) => {
      teacher.taStudents.forEach((student) => {
        const numberOfCardsToCreate = student.studentPbisCardsCount;
        for (let i = 0; i < numberOfCardsToCreate; i++) {
          allCards.push({
            id: student.id,
            name: student.name,
            taTeacher: {
              name: teacher.name,
            },
          });
        }
      });
    });

    // shuffle the cards and get the first 10
    const shuffledCards = shuffle(allCards);
    const randomWinners = shuffledCards.slice(0, weeklyWinnerCount);

    // create the new PBIS Collection
    const latestCollection = await countCardsDateMutation({
      date: collectionDateString,
      collectedCards: String(data?.pbisCardsCount || 0),
    });

    // update each ta teacher with their new data
    data?.taTeachers.forEach(async (teacher) => {
      const newCardsPerTeacher = teacher.taStudents.reduce(
        (a, b) => a + b.studentPbisCardsCount,
        0,
      );
      const numberOfStudentInTeam = teacher.taStudents.length;
      const newAverageCardsPerStudent =
        newCardsPerTeacher / numberOfStudentInTeam;
      const totalAverageCardsPerStudent =
        (teacher.taTeamAveragePbisCardsPerStudent || 0) +
        newAverageCardsPerStudent;
      const newTeamLevel = Math.floor(
        totalAverageCardsPerStudent / PBISCardsPerTaLevel,
      );

      await updateTaAverageCardsMutation({
        id: teacher.id,
        averagePbisCardsPerStudent: Math.round(totalAverageCardsPerStudent),
        taTeamPbisLevel: newTeamLevel || 0,
      });
    });

    setLoading(false);
    return 'it Worked';
  }

  return {
    runCardCollection,
    data,
    setGetData,
    getData,
    loading,
  };
}
