import { useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import React from 'react';
import { UPDATE_PBIS } from '../../lib/pbisUtils';
import { useGQLQuery } from '../../lib/useGqlQuery';
import {
  chunk,
  getListOfStudentsToUpdate,
  getLowestTaTeamLevel,
  getNewTaTeamLevelGoal,
  getPbisCardsToMarkCollected,
  getPersonalLevel,
  getRandomWinners,
  getTaTeamData,
  getTaTeamsToUpdate,
  getTeachersToUpdate,
} from './pbisCollectionHelpers';

const PBIS_COLLECTION_QUERY = gql`
  query PBIS_COLLECTION_QUERY {
    taTeamCards: pbisTeams {
      id
      teamName
      averageCardsPerStudent
      numberOfStudents
      currentLevel

      taTeacher {
        id
        name
        currentTaWinner {
          id
          name
        }
        previousTaWinner {
          id
          name
        }
        taStudents {
          id
          name
          individualPbisLevel
          uncountedCards: studentPbisCardsCount(
            where: { counted: { equals: false } }
          )
          totalCards: studentPbisCardsCount
        }
      }
    }
    totalCards: pbisCardsCount(where: { counted: { equals: false } })
    lastCollection: pbisCollections {
      id
      name
      collectionDate
      personalLevelWinners
      randomDrawingWinners
      taTeamsLevels
    }
    individualPbisCards: pbisCards(where: { counted: { equals: false } }) {
      id
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
// update teachers with new winner and update old winner

const UPDATE_TEACHER_WITH_NEW_PBIS_WINNER_MUTATION = gql`
  mutation UPDATE_TEACHER_WITH_NEW_PBIS_WINNER_MUTATION(
    $id: ID!
    $currentTaWinner: ID!
    $previousTaWinner: ID!
  ) {
    updateUser(
      id: $id
      data: {
        currentTaWinner: { connect: { id: $currentTaWinner } }
        previousTaWinner: { connect: { id: $previousTaWinner } }
      }
    ) {
      id
    }
  }
`;
// update teachers with new pbis winner
const UPDATE_TEACHER_WITH_NEW_PBIS_WINNER_MUTATION_WITHOUT_PREVIOUS = gql`
  mutation UPDATE_TEACHER_WITH_NEW_PBIS_WINNER_MUTATION_WITHOUT_PREVIOUS(
    $id: ID!
    $currentTaWinner: ID!
  ) {
    updateUser(
      id: $id
      data: { currentTaWinner: { connect: { id: $currentTaWinner } } }
    ) {
      id
    }
  }
`;
// update PBIS Teams with new data
const UPDATE_PBIS_TEAM_WITH_NEW_DATA_MUTATION = gql`
  mutation UPDATE_PBIS_TEAM_WITH_NEW_DATA_MUTATION(
    $data: [PbisTeamUpdateArgs!]!
  ) {
    updatePbisTeams(data: $data) {
      id
    }
  }
`;

// update students who went up a personal level
const BULK_UPDATE_USERS_MUTATION = gql`
  mutation BULK_UPDATE_USERS_MUTATION($data: [UserUpdateArgs!]!) {
    updateUsers(data: $data) {
      id
    }
  }
`;

// mark all the cards as collected
const COUNT_PBIS_CARD_MUTATION = gql`
  mutation COUNT_PBIS_CARD_MUTATION($data: [PbisCardUpdateArgs!]!) {
    updatePbisCards(data: $data) {
      id
    }
  }
`;

interface PbisCollectionData {
  taTeamCards: any[];
  totalCards: number;
  lastCollection: any[];
  individualPbisCards: any[];
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
  const [currentPbisTeamGoal, setCurrentPbisTeamGoal] = React.useState(2);

  const [countCardsMutation] = useMutation(COUNT_PBIS_CARD_MUTATION, {});
  const [updateCardCount, { loading: cardLoading }] = useMutation(UPDATE_PBIS);

  const [updateTaTeacherWithoutPreviousWinner] = useMutation(
    UPDATE_TEACHER_WITH_NEW_PBIS_WINNER_MUTATION_WITHOUT_PREVIOUS,
    {},
  );
  const [updatePbisTeamData] = useMutation(
    UPDATE_PBIS_TEAM_WITH_NEW_DATA_MUTATION,
    {},
  );
  const [updateTaTeacherWithPreviousWinner] = useMutation(
    UPDATE_TEACHER_WITH_NEW_PBIS_WINNER_MUTATION,
    {},
  );
  const [bulkUpdateUsers] = useMutation(BULK_UPDATE_USERS_MUTATION, {});

  const [createNewPbisCollection] = useMutation(
    CREATE_PBIS_COLLECTION_MUTATION,
    {},
  );
  const { data } = useGQLQuery(
    'pbisCollection',
    PBIS_COLLECTION_QUERY,
    {},
    { enabled: !!getData },
  );

  async function runCardCollection(): Promise<string> {
    setLoading(true);
    // get all the level data for each PBIS team
    const taTeamData = getTaTeamData(data?.taTeamCards || []);
    // get all the teams that went up a level for rewards
    const taTeamsAtNewLevel = taTeamData.filter((taTeam) => taTeam.isNewLevel);
    // get all the studets who went up a level for rewards
    const studentsWithNewPersonalLevel = getPersonalLevel(
      data?.taTeamCards || [],
    );
    // get all the random drawing winners
    const randomDrawingWinners = getRandomWinners(data?.taTeamCards || []);
    // get the lowest PBIS team level
    const lowestTaTeamLevel = getLowestTaTeamLevel(taTeamData);
    // get the team PBIS  level goal
    const newTaTeamLevelGoal = getNewTaTeamLevelGoal(lowestTaTeamLevel);

    const pbisCollectionData = {
      name: `PBIS Collection ${new Date().toLocaleDateString()}`,
      personalLevelWinners: JSON.stringify(studentsWithNewPersonalLevel),
      randomDrawingWinners: JSON.stringify(randomDrawingWinners),
      taTeamLevels: JSON.stringify(taTeamData),
      taTeamNewLevelWinners: JSON.stringify(taTeamsAtNewLevel),
      currentPbisTeamGoal: JSON.stringify(newTaTeamLevelGoal),
      collectedCards: String(data?.totalCards || 0),
    };

    // create the new PBIS Collection
    const latestCollection = await createNewPbisCollection({
      variables: pbisCollectionData,
    });

    // update the students who went up a level
    const studentsToUpdateLevel = studentsWithNewPersonalLevel.map(
      (student) => ({
        where: { id: student.id },
        data: {
          individualPbisLevel: student.individualPbisLevel,
        },
      }),
    );
    const updatedStudents = await bulkUpdateUsers({
      variables: { data: studentsToUpdateLevel },
    });
    // update each ta teacher with their new pbis winner
    const teachersToUpdate = getTeachersToUpdate(randomDrawingWinners);
    const updatedTeachers = await bulkUpdateUsers({
      variables: {
        data: teachersToUpdate,
      },
    });

    // update each ta team with their new data
    const taTeamsToUpdate = getTaTeamsToUpdate(taTeamData);
    const updatedPbisTeams = await updatePbisTeamData({
      variables: {
        data: taTeamsToUpdate,
      },
    });
    // mark all new cards as collected
    const cardsToUpdate = getPbisCardsToMarkCollected(
      data?.individualPbisCards || [],
    );
    // divide the cards into chunks of 50
    const chunks = chunk(cardsToUpdate, 50);
    // update each chunk of cards
    for (let i = 0; i < chunks.length; i++) {
      const updatedCards = await countCardsMutation({
        variables: {
          data: chunks[i],
        },
      });
    }

    // const updatedCards = await countCardsMutation({
    //   variables: {
    //     data: cardsToUpdate,
    //   },
    // });
    // console.log('Updated cards', updatedCards);
    // update the pbis cards for each student
    const studentsToUpdate = getListOfStudentsToUpdate(data?.taTeamCards || []);
    const recalculatedPBIS = await Promise.all(
      studentsToUpdate.map((student) =>
        updateCardCount({
          variables: {
            userId: student,
          },
        }),
      ),
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
