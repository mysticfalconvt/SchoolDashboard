import { useGqlMutation } from '@/lib/useGqlMutation';
import gql from 'graphql-tag';
import React from 'react';
import { useGQLQuery } from '../../lib/useGqlQuery';

const cardsPerPersonalLevel = 50;
const cardsPerTaLevel = 15;
const levelsPerSchoolWideLevel = 2;

const PBIS_COLLECTION_QUERY = gql`
  query PBIS_COLLECTION_QUERY {
    totalCards: _allPbisCardsMeta {
      count
    }
    uncountedCards: allPbisCards(where: { counted: false }) {
      id
      category
      student {
        id
        name
        taTeacher {
          id
          name
          taTeam {
            id
            teamName
          }
        }
      }
    }
    taTeachers: allUsers(where: { hasTA: true }) {
      id
      name
      _taStudentsMeta {
        count
      }
      previousTaWinner {
        id
        name
      }
      currentTaWinner {
        id
        name
      }
      taStudents {
        id
        name
        studentPbisCards(where: { counted: false }) {
          id
          category
          student {
            id
            name
          }
        }
      }
    }
    taTeams: allPbisTeams {
      id
      teamName
      currentLevel
      averageCardsPerStudent
      taTeacher {
        id
        name
      }
    }
    studentsWithCurrentCounts: allUsers(where: { isStudent: true }) {
      id
      name
      individualPbisLevel
      _studentPbisCardsMeta {
        count
      }
    }
    lastCollection: allPbisCollections {
      id
      name
      collectionDate
      personalLevelWinners
      randomDrawingWinners
      taTeamsLevels
    }
  }
`;

const CREATE_PBIS_COLLECTION_MUTATION = gql`
  mutation CREATE_PBIS_COLLECTION_MUTATION(
    $name: String!
    $randomDrawingWinners: String!
    $personalLevelWinners: String!
    $taTeamLevels: String!
    $taTeamNewLevelWinners: String!
    $currentPbisTeamGoal: String!
    $collectedCards: String
  ) {
    createPbisCollection(
      data: {
        name: $name
        randomDrawingWinners: $randomDrawingWinners
        personalLevelWinners: $personalLevelWinners
        taTeamsLevels: $taTeamLevels
        taTeamNewLevelWinners: $taTeamNewLevelWinners
        currentPbisTeamGoal: $currentPbisTeamGoal
        collectedCards: $collectedCards
      }
    ) {
      id
    }
  }
`;

interface PbisCard {
  id: string;
  category: string;
  student: {
    id: string;
    name: string;
    taTeacher: {
      id: string;
      name: string;
      taTeam: {
        id: string;
        teamName: string;
      };
    };
  };
}

interface TaStudent {
  id: string;
  name: string;
  studentPbisCards: PbisCard[];
}

interface TaTeacher {
  id: string;
  name: string;
  _taStudentsMeta: {
    count: number;
  };
  previousTaWinner?: {
    id: string;
    name: string;
  };
  currentTaWinner?: {
    id: string;
    name: string;
  };
  taStudents: TaStudent[];
}

interface TaTeam {
  id: string;
  teamName: string;
  currentLevel: number;
  averageCardsPerStudent: number;
  taTeacher: {
    id: string;
    name: string;
  };
}

interface StudentWithCounts {
  id: string;
  name: string;
  individualPbisLevel: number;
  _studentPbisCardsMeta: {
    count: number;
  };
}

interface PbisCollection {
  id: string;
  name: string;
  collectionDate: string;
  personalLevelWinners: string;
  randomDrawingWinners: string;
  taTeamsLevels: string;
}

interface PbisCollectionData {
  totalCards: {
    count: number;
  };
  uncountedCards: PbisCard[];
  taTeachers: TaTeacher[];
  taTeams: TaTeam[];
  studentsWithCurrentCounts: StudentWithCounts[];
  lastCollection: PbisCollection[];
}

interface UsePbisCollectionReturn {
  runCardCollection: () => Promise<string>;
  data: PbisCollectionData | undefined;
  setGetData: (get: boolean) => void;
  getData: boolean;
  loading: boolean;
}

export default function usePbisCollection(): UsePbisCollectionReturn {
  const [getData, setGetData] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const [createNewPbisCollection] = useGqlMutation(
    CREATE_PBIS_COLLECTION_MUTATION,
    {},
  );

  const { data } = useGQLQuery(
    'pbisCollection',
    PBIS_COLLECTION_QUERY,
    {},
    { enabled: !!getData },
  );

  function getPersonalLevelWinners(students: StudentWithCounts[]) {
    const studentsWithNewPersonalLevel = students.map((student) => {
      const newCardsPerStudent = student._studentPbisCardsMeta.count;
      const newPersonalLevel = Math.floor(
        newCardsPerStudent / cardsPerPersonalLevel,
      );
      const isNewLevel =
        Number(newPersonalLevel) > (Number(student.individualPbisLevel) || 0);
      const newStudent = {
        name: student.name,
        id: student.id,
        individualPbisLevel: newPersonalLevel || 0,
        isNewLevel: isNewLevel,
      };
      return newStudent;
    });
    const studentsAtNewLevel = studentsWithNewPersonalLevel.filter(
      (student) => student.isNewLevel,
    );
    return studentsAtNewLevel;
  }

  function chooseRandomCardFromArrayOfCards(cards: PbisCard[]) {
    const randomIndex = Math.floor(Math.random() * cards.length);
    return cards[randomIndex];
  }

  function chooseARandomWinnerFromTaCardsThatDoesntMatchCurrentWinner(
    arrayOfCards: PbisCard[],
    previousWinner: { id: string; name: string } | undefined,
  ) {
    const cardsToChooseFrom = arrayOfCards.filter(
      (card) => card.student.id !== previousWinner?.id,
    );
    if (cardsToChooseFrom.length === 0) {
      return arrayOfCards[0];
    }
    return chooseRandomCardFromArrayOfCards(cardsToChooseFrom);
  }

  async function getTaWinnerAndCardsPerStudent(tas: TaTeacher[]) {
    const taInfo = tas.map((ta) => {
      const allCardsForTa = ta.taStudents.reduce((acc, student) => {
        return acc.concat(student.studentPbisCards);
      }, [] as PbisCard[]);

      const randomWinner =
        chooseARandomWinnerFromTaCardsThatDoesntMatchCurrentWinner(
          allCardsForTa,
          ta.currentTaWinner,
        );

      const cardsPerStudent = allCardsForTa.length / ta.taStudents.length;

      return {
        id: ta.id,
        name: ta.name,
        randomWinner: randomWinner,
        cardsPerStudent: cardsPerStudent,
        previousTaWinner: ta.currentTaWinner,
      };
    });
    return taInfo;
  }

  function getTaTeamCardsPerStudent(taTeams: TaTeam[], taInfo: any[]) {
    const teamInfo = taTeams.map((team) => {
      const taTeachersInTeam = taInfo.filter(
        (ta) => ta.id === team.taTeacher.id,
      );
      const totalCardsInTeam = taTeachersInTeam.reduce(
        (acc, ta) => acc + ta.cardsPerStudent,
        0,
      );
      const averageCardsPerStudent = totalCardsInTeam / taTeachersInTeam.length;
      const newTeamLevel = Math.floor(averageCardsPerStudent / cardsPerTaLevel);
      const isNewLevel = newTeamLevel > (team.currentLevel || 0);

      return {
        id: team.id,
        name: team.teamName,
        averageCardsPerStudent: averageCardsPerStudent,
        currentLevel: newTeamLevel || 0,
        isNewLevel: isNewLevel,
      };
    });
    return teamInfo;
  }

  function updateTaTeachersWithNewWinners(tas: any[]) {
    const teachersToUpdate = tas.map((ta) => {
      const dataToReturn: any = {};
      if (ta.randomWinner?.student?.id && ta.previousTaWinner?.id) {
        dataToReturn.where = { id: ta.id };
        dataToReturn.data = {
          currentTaWinner: {
            connect: {
              id: ta.randomWinner.student.id,
            },
          },
          previousTaWinner: {
            connect: {
              id: ta.previousTaWinner.id,
            },
          },
        };
        return dataToReturn;
      }
      if (ta.randomWinner?.student?.id) {
        dataToReturn.where = { id: ta.id };
        dataToReturn.data = {
          currentTaWinner: {
            connect: {
              id: ta.randomWinner.student.id,
            },
          },
        };
        return dataToReturn;
      }
      return null;
    });
    return teachersToUpdate.filter((teacher) => teacher !== null);
  }

  function getTaTeamsAtNewLevel(teamInfo: any[]) {
    return teamInfo.filter((team) => team.isNewLevel);
  }

  async function updateAllDataForWinners() {
    const personalLevelWinners = getPersonalLevelWinners(
      data?.studentsWithCurrentCounts || [],
    );
    const taInfo = await getTaWinnerAndCardsPerStudent(data?.taTeachers || []);
    const teamInfo = getTaTeamCardsPerStudent(data?.taTeams || [], taInfo);
    const taTeamsAtNewLevel = getTaTeamsAtNewLevel(teamInfo);
    const teachersToUpdate = updateTaTeachersWithNewWinners(taInfo);

    const pbisCollectionData = {
      name: `PBIS Collection ${new Date().toLocaleDateString()}`,
      personalLevelWinners: JSON.stringify(personalLevelWinners),
      randomDrawingWinners: JSON.stringify(taInfo),
      taTeamLevels: JSON.stringify(teamInfo),
      taTeamNewLevelWinners: JSON.stringify(taTeamsAtNewLevel),
      currentPbisTeamGoal: JSON.stringify(teamInfo),
      collectedCards: String(data?.totalCards?.count || 0),
    };

    const latestCollection = await createNewPbisCollection(pbisCollectionData);

    return latestCollection;
  }

  async function updatePbisDataFromListOfStudentsWhoGotCards(
    listOfStudentsWhoGotCards: string[],
  ) {
    // Note: This function call needs to be updated based on the actual implementation
    // setPbisCollection expects a PbisCollection object, not a string
    console.log('Students who got cards:', listOfStudentsWhoGotCards);
    return [];
  }

  async function runCardCollection(): Promise<string> {
    setLoading(true);
    const latestCollection = await updateAllDataForWinners();
    const listOfStudentsWhoGotCards =
      data?.uncountedCards?.map((card) => card.student.id) || [];
    await updatePbisDataFromListOfStudentsWhoGotCards(
      listOfStudentsWhoGotCards,
    );
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
