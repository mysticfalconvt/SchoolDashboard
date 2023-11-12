import gql from "graphql-tag";
import { useGQLQuery } from "../../lib/useGqlQuery";
import { useState } from "react";
import { useMutation } from "@apollo/client";

const shuffle = (array) => {
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
const weeklyWinnerCount = 20;
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

// this is the collection MUTATION
export default function useV3PbisCollection() {
  const { data: pbisDates } = useGQLQuery(
    "pbisDates",
    GET_ALL_PBIS_DATES_QUERY
  );
  const latestCollectionDateOr2YearsAgo =
    pbisDates?.pbisCollectionDates[0]?.collectionDate ||
    new Date(
      new Date().setFullYear(new Date().getFullYear() - 2)
    ).toISOString();
  const [createPbisCollectionDate, { error, loading: mutationLoading }] =
    useMutation(COUNT_CARDS_DATE_MUTATION);
  const [updateTA] = useMutation(UPDATE_TA_AVERAGE_CARDS_MUTATION);
  const [updateTAlevel] = useMutation(TA_LEVELED_UP_MUTATION);
  const [updateStudentLevelInCollection] = useMutation(
    STUDENT_LEVELED_UP_MUTATION
  );
  const [updateStudentIndividualLevel] = useMutation(
    UPDATE_STUDENT_LEVEL_MUTATION
  );
  const [updateStudentRandomDrawingWinner] = useMutation(
    STUDENT_RANDOM_DRAWING_WINNER_MUTATION
  );

  const [getData, setGetData] = useState(false);
  const [loading, setLoading] = useState(false);
  console.log(
    "latestCollectionDateOr2YearsAgo",
    latestCollectionDateOr2YearsAgo
  );
  const { data } = useGQLQuery(
    "pbisCollection",
    PBIS_COLLECTION_QUERY,
    { date: latestCollectionDateOr2YearsAgo },
    { enabled: !!getData && !!pbisDates }
  );

  console.log("PBIS Collection Data", data);
  const currentCardsPerTaLevel = data?.taTeachers?.map((teacher) =>
    teacher.taStudents.reduce((acc, cur) => acc + cur.studentPbisCardsCount, 0)
  );
  console.log("currentCardsPerTaLevel", currentCardsPerTaLevel);

  async function runCardCollection() {
    setLoading(true);
    console.log("Recalculating PBIS");
    const collectionDate = new Date().toISOString();
    const cardsThisCollection = data.pbisCardsCount;
    console.log("cardsThisCollection", collectionDate, cardsThisCollection);
    const thisCollection = await createPbisCollectionDate({
      variables: {
        date: collectionDate,
        collectedCards: String(cardsThisCollection),
      },
    });
    console.log("thisCollection", thisCollection);
    const thisCollectionId = thisCollection.data.createPbisCollectionDate.id;
    const previousCollections =
      pbisDates?.pbisCollectionDates.sort(
        (a, b) => new Date(b.collectionDate) - new Date(a.collectionDate)
      ) || [];
    const previousWinnersToExclude = previousCollections
      .slice(0, collectionsWithoutRepeatWinners)
      .reduce((acc, cur) => {
        const currentWinners = cur?.randomDrawingWinners || [];

        return [...acc, ...currentWinners];
      }, [])
      .map((winner) => winner.student.id);

    const taTeachers = data.taTeachers;
    // for each teacher get the number of students in the class and the average number of cards this collection
    // then do TA team average cards and team levels
    for (const teacher of taTeachers) {
      const taStudents = teacher.taStudents;
      const taTeamPreviousPbisLevel = teacher.taTeamPbisLevel;
      const taTeamPreviousAveragePbisCardsPerStudent =
        teacher.taTeamAveragePbisCardsPerStudent;
      console.log(taStudents);
      const taTeamCurrentCardsFromAllStudents = taStudents.reduce(
        (acc, cur) => acc + cur.studentPbisCardsCount,
        0
      );
      console.log(
        "taTeamCurrentCardsFromAllStudents",
        taTeamCurrentCardsFromAllStudents
      );
      const taTeamCurrentAveragePbisCardsPerStudent =
        taTeamCurrentCardsFromAllStudents / (taStudents?.length || 1) +
        taTeamPreviousAveragePbisCardsPerStudent;

      const taTeamCurrentPbisLevel = Math.floor(
        taTeamCurrentAveragePbisCardsPerStudent / PBISCardsPerTaLevel
      );
      const taTeamPbisLevelChange =
        taTeamCurrentPbisLevel - taTeamPreviousPbisLevel || 0;
      teacher.taTeamPbisLevelChange = taTeamPbisLevelChange;
      teacher.newCardsPerStudent = taTeamCurrentAveragePbisCardsPerStudent;
      const averageCardsRounded = Math.round(teacher.newCardsPerStudent);

      console.log(
        "!!! TA TEAM",
        averageCardsRounded,
        taTeamCurrentPbisLevel,
        taTeamCurrentAveragePbisCardsPerStudent,
        taTeamCurrentAveragePbisCardsPerStudent / 24
      );
      console.log("TA Data", {
        name: teacher.name,
        taTeamCurrentPbisLevel,
        taTeamPbisLevelChange,
        averageCardsRounded,
      });
      await updateTA({
        variables: {
          id: teacher.id,
          averagePbisCardsPerStudent: averageCardsRounded,
          taTeamPbisLevel: taTeamCurrentPbisLevel,
        },
      });
      if (taTeamPbisLevelChange > 0) {
        await updateTAlevel({
          variables: {
            collectionId: thisCollectionId,
            taId: teacher.id,
          },
        });
      }
    }

    // for each student get the number of cards they have this collection
    // then do student individual level
    const arrayOfStudents = data.taTeachers.reduce(
      (acc, cur) => [...acc, ...cur.taStudents],
      []
    );
    const arrayOfStudentsWithNewCards = arrayOfStudents.filter(
      (student) => student.totalPBISCards > 0
    );

    for (const student of arrayOfStudentsWithNewCards) {
      const studentPreviousPbisLevel = student.individualPbisLevel;
      const studentTotalCards = student.totalPBISCards;

      const studentCurrentPbisLevel = PbisCardsPerPersonalLevel.findIndex(
        (level) => level - 1 >= studentTotalCards
      );

      const studentPbisLevelChange =
        studentCurrentPbisLevel - studentPreviousPbisLevel || 0;

      if (studentPbisLevelChange > 0) {
        await updateStudentLevelInCollection({
          variables: {
            collectionId: thisCollectionId,
            studentId: student.id,
          },
        });

        await updateStudentIndividualLevel({
          variables: {
            id: student.id,
            individualPbisLevel: studentCurrentPbisLevel,
          },
        });
      }
    }

    // for each student except the previous winners get the number of cards they have this collection
    // then do random drawing winners
    const arrayOfStudentsWithNewCardsNotPreviousWinners =
      arrayOfStudentsWithNewCards.filter(
        (student) => !previousWinnersToExclude.includes(student?.student?.id)
      );
    // create an array or tickets with each student getting the number based on the number of cards they have
    const tickets = arrayOfStudentsWithNewCardsNotPreviousWinners.reduce(
      (acc, cur) => {
        let studentTickets = [];
        for (let i = 0; i < cur.studentPbisCardsCount; i++) {
          studentTickets.push(cur.id);
        }
        console.log("studentTickets", studentTickets);
        return [...acc, ...studentTickets];
      },
      []
    );
    let randomDrawingWinnerIds = [];
    // pick the winners
    for (let i = 0; i < weeklyWinnerCount; i++) {
      const ticketsWithoutPreviousWinners = shuffle(
        tickets.filter((ticket) => !randomDrawingWinnerIds.includes(ticket))
      );
      const winnerRandomNumber = Math.floor(
        Math.random() * ticketsWithoutPreviousWinners.length
      );
      const winnerId = ticketsWithoutPreviousWinners[winnerRandomNumber];
      if (winnerId) {
        randomDrawingWinnerIds.push(winnerId);
      }
    }

    console.log("randomDrawingWinnerIds", randomDrawingWinnerIds);
    for (const winnerId of randomDrawingWinnerIds) {
      await updateStudentRandomDrawingWinner({
        variables: {
          collectionId: thisCollectionId,
          studentId: winnerId,
        },
      });
    }

    setLoading(false);
    return "it Worked";
  }

  return {
    runCardCollection,
    data,
    setGetData,
    getData,
    loading,
  };
}
