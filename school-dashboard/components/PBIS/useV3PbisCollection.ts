import { GraphQLClient } from 'graphql-request';
import gql from 'graphql-tag';
import { useState } from 'react';
import { endpoint, prodEndpoint } from '../../config';
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

const TA_LEVELED_UP_MUTATION = gql`
  mutation TA_LEVELED_UP_MUTATION($collectionId: ID!, $taId: ID!) {
    updatePbisCollectionDate(
      where: { id: $collectionId }
      data: { taNewLevelWinners: { connect: { id: $taId } } }
    ) {
      id
    }
  }
`;

const STUDENT_LEVELED_UP_MUTATION = gql`
  mutation STUDENT_LEVELED_UP_MUTATION($collectionId: ID!, $studentId: ID!) {
    updatePbisCollectionDate(
      where: { id: $collectionId }
      data: { personalLevelWinners: { connect: { id: $studentId } } }
    ) {
      id
    }
  }
`;

const UPDATE_STUDENT_LEVEL_MUTATION = gql`
  mutation UPDATE_STUDENT_LEVEL_MUTATION($id: ID!, $individualPbisLevel: Int) {
    updateUser(
      where: { id: $id }
      data: { individualPbisLevel: $individualPbisLevel }
    ) {
      id
    }
  }
`;

const STUDENT_RANDOM_DRAWING_WINNER_MUTATION = gql`
  mutation STUDENT_RANDOM_DRAWING_WINNER_MUTATION(
    $collectionId: ID!
    $studentId: ID!
  ) {
    createRandomDrawingWin(
      data: {
        student: { connect: { id: $studentId } }
        collectionDate: { connect: { id: $collectionId } }
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
  randomDrawingWinners?: Array<{
    id: string;
    student: {
      id: string;
      name: string;
    };
  }>;
  personalLevelWinners?: Array<{
    id: string;
    name: string;
  }>;
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
  taTeamPbisLevelChange?: number;
  newCardsPerStudent?: number;
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
  const { data: pbisDates } = useGQLQuery(
    'pbisDates',
    GET_ALL_PBIS_DATES_QUERY,
  );

  const latestCollectionDateOr2YearsAgo =
    pbisDates?.pbisCollectionDates?.[0]?.collectionDate ||
    new Date(
      new Date().setFullYear(new Date().getFullYear() - 2),
    ).toISOString();

  // Direct fetch functions for mutations
  const createPbisCollectionDate = async (variables: any) => {
    const graphQLClient = new GraphQLClient(
      process.env.NODE_ENV === 'development' ? endpoint : prodEndpoint,
      { credentials: 'include', mode: 'cors' },
    );
    return await graphQLClient.request(COUNT_CARDS_DATE_MUTATION, variables);
  };

  const updateTA = async (variables: any) => {
    const graphQLClient = new GraphQLClient(
      process.env.NODE_ENV === 'development' ? endpoint : prodEndpoint,
      { credentials: 'include', mode: 'cors' },
    );
    return await graphQLClient.request(
      UPDATE_TA_AVERAGE_CARDS_MUTATION,
      variables,
    );
  };

  const updateTAlevel = async (variables: any) => {
    const graphQLClient = new GraphQLClient(
      process.env.NODE_ENV === 'development' ? endpoint : prodEndpoint,
      { credentials: 'include', mode: 'cors' },
    );
    return await graphQLClient.request(TA_LEVELED_UP_MUTATION, variables);
  };

  const updateStudentLevelInCollection = async (variables: any) => {
    const graphQLClient = new GraphQLClient(
      process.env.NODE_ENV === 'development' ? endpoint : prodEndpoint,
      { credentials: 'include', mode: 'cors' },
    );
    return await graphQLClient.request(STUDENT_LEVELED_UP_MUTATION, variables);
  };

  const updateStudentIndividualLevel = async (variables: any) => {
    const graphQLClient = new GraphQLClient(
      process.env.NODE_ENV === 'development' ? endpoint : prodEndpoint,
      { credentials: 'include', mode: 'cors' },
    );
    return await graphQLClient.request(
      UPDATE_STUDENT_LEVEL_MUTATION,
      variables,
    );
  };

  const updateStudentRandomDrawingWinner = async (variables: any) => {
    const graphQLClient = new GraphQLClient(
      process.env.NODE_ENV === 'development' ? endpoint : prodEndpoint,
      { credentials: 'include', mode: 'cors' },
    );
    return await graphQLClient.request(
      STUDENT_RANDOM_DRAWING_WINNER_MUTATION,
      variables,
    );
  };

  const [getData, setGetData] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data } = useGQLQuery(
    'pbisCollection',
    PBIS_COLLECTION_QUERY,
    { date: latestCollectionDateOr2YearsAgo },
    { enabled: !!getData && !!pbisDates },
  );

  const currentCardsPerTaLevel = data?.taTeachers?.map((teacher) =>
    teacher.taStudents.reduce((acc, cur) => acc + cur.studentPbisCardsCount, 0),
  );

  async function runCardCollection(): Promise<string> {
    setLoading(true);
    const collectionDate = new Date().toISOString();
    const cardsThisCollection = data?.pbisCardsCount || 0;

    try {
      // Create the collection first
      let thisCollectionId: string | null = null;

      try {
        // Call the mutation and get the response directly
        const mutationResponse = await createPbisCollectionDate({
          date: collectionDate,
          collectedCards: String(cardsThisCollection),
        });

        // The response data should be in mutationResponse
        let thisCollection = mutationResponse;

        // Try different response structures
        thisCollectionId =
          (thisCollection as any)?.data?.createPbisCollectionDate?.id ||
          (thisCollection as any)?.createPbisCollectionDate?.id ||
          (thisCollection as any)?.id;

        if (!thisCollectionId) {
          console.warn(
            'Could not get collection ID from response, but continuing with updates',
          );
        }
      } catch (collectionError) {
        console.error('Error creating collection:', collectionError);
        console.log('Continuing with updates without collection ID');
      }

      const previousCollections =
        pbisDates?.pbisCollectionDates?.sort(
          (a, b) =>
            new Date(b.collectionDate).getTime() -
            new Date(a.collectionDate).getTime(),
        ) || [];

      const previousWinnersToExclude = previousCollections
        .slice(0, collectionsWithoutRepeatWinners)
        .reduce((acc: string[], cur) => {
          const currentWinners = cur?.randomDrawingWinners || [];
          const winnerIds = currentWinners
            .map((winner) => winner.student.id)
            .filter(
              (id): id is string => typeof id === 'string' && id.length > 0,
            );
          return [...acc, ...winnerIds];
        }, []);

      const taTeachers = data?.taTeachers || [];

      // for each teacher get the number of students in the class and the average number of cards this collection
      // then do TA team average cards and team levels
      for (const teacher of taTeachers) {
        const taStudents = teacher.taStudents;
        const taTeamPreviousPbisLevel = teacher.taTeamPbisLevel;
        const taTeamPreviousAveragePbisCardsPerStudent =
          teacher.taTeamAveragePbisCardsPerStudent;
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
        const taTeamPbisLevelChange =
          taTeamCurrentPbisLevel - taTeamPreviousPbisLevel || 0;
        teacher.taTeamPbisLevelChange = taTeamPbisLevelChange;
        teacher.newCardsPerStudent = taTeamCurrentAveragePbisCardsPerStudent;
        const averageCardsRounded = Math.round(teacher.newCardsPerStudent);

        await updateTA({
          id: teacher.id,
          averagePbisCardsPerStudent: averageCardsRounded,
          taTeamPbisLevel: taTeamCurrentPbisLevel,
        });

        // Link TA to collection if we have the collection ID
        if (thisCollectionId && taTeamPbisLevelChange > 0) {
          try {
            await updateTAlevel({
              collectionId: thisCollectionId,
              taId: teacher.id,
            });
          } catch (error) {
            console.error('Error linking TA to collection:', error);
          }
        }
      }

      // for each student get the number of cards they have this collection
      // then do student individual level
      const arrayOfStudents =
        data?.taTeachers?.reduce(
          (acc, cur) => [...acc, ...cur.taStudents],
          [] as TaStudent[],
        ) || [];

      const arrayOfStudentsWithNewCards = arrayOfStudents.filter(
        (student) => student.totalPBISCards > 0,
      );

      for (const student of arrayOfStudentsWithNewCards) {
        const studentPreviousPbisLevel = student.individualPbisLevel;
        const studentTotalCards = student.totalPBISCards;

        const studentCurrentPbisLevel = PbisCardsPerPersonalLevel.findIndex(
          (level) => level - 1 >= studentTotalCards,
        );

        const studentPbisLevelChange =
          studentCurrentPbisLevel - studentPreviousPbisLevel || 0;

        if (studentPbisLevelChange > 0) {
          // Link student to collection if we have the collection ID
          if (thisCollectionId) {
            try {
              await updateStudentLevelInCollection({
                collectionId: thisCollectionId,
                studentId: student.id,
              });
            } catch (error) {
              console.error('Error linking student to collection:', error);
            }
          }

          await updateStudentIndividualLevel({
            id: student.id,
            individualPbisLevel: studentCurrentPbisLevel,
          });
        }
      }

      // Random drawing winners if we have the collection ID
      if (thisCollectionId) {
        try {
          const arrayOfStudentsWithNewCardsNotPreviousWinners =
            arrayOfStudentsWithNewCards.filter(
              (student) =>
                !previousWinnersToExclude.includes(String(student.id)),
            );

          // create an array or tickets with each student getting the number based on the number of cards they have
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
          // pick the winners
          for (let i = 0; i < weeklyWinnerCount; i++) {
            const ticketsWithoutPreviousWinners = shuffle(
              tickets.filter(
                (ticket) => !randomDrawingWinnerIds.includes(ticket),
              ),
            );
            const winnerRandomNumber = Math.floor(
              Math.random() * ticketsWithoutPreviousWinners.length,
            );
            const winnerId = ticketsWithoutPreviousWinners[winnerRandomNumber];
            if (winnerId) {
              randomDrawingWinnerIds.push(winnerId);
            }
          }

          for (const winnerId of randomDrawingWinnerIds) {
            await updateStudentRandomDrawingWinner({
              collectionId: thisCollectionId,
              studentId: winnerId,
            });
          }
        } catch (error) {
          console.error('Error creating random drawing winners:', error);
        }
      }

      setLoading(false);
      return 'it Worked';
    } catch (error) {
      setLoading(false);
      console.error('Error collecting cards:', error);
      return 'Error collecting cards';
    }
  }

  return {
    runCardCollection,
    data,
    setGetData,
    getData,
    loading,
  };
}
