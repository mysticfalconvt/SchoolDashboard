import gql from "graphql-tag";
import { useGQLQuery } from "../../lib/useGqlQuery";
import { useState } from "react";

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
      }
    }
  }
`;

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

  const [getData, setGetData] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data } = useGQLQuery(
    "pbisCollection",
    PBIS_COLLECTION_QUERY,
    { date: latestCollectionDateOr2YearsAgo },
    { enabled: !!getData && !!pbisDates }
  );

  console.log("PBIS Collection Data", data);

  async function runCardCollection() {
    setLoading(true);
    console.log("Recalculated PBIS");

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
