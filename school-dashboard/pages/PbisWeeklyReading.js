import gql from "graphql-tag";
import styled from "styled-components";
import Loading from "../components/Loading";
import { capitalizeFirstLetter } from "../lib/nameUtils";
import { useGQLQuery } from "../lib/useGqlQuery";

const PbisReadingStyles = styled.div`
  h3 {
    font-size: 2.5rem;
  }
  p {
    font-size: 2rem;
  }
  ul {
    font-size: 2rem;
  }
  .strong {
    font-size: 3rem;
  }
  max-width: 100rem;
  margin: 0 auto;
`;

const PBIS_READING_QUERY = gql`
  query PBIS_READING_QUERY {
    lastCollection: pbisCollectionDates(
      orderBy: { collectionDate: desc }
      take: 2
    ) {
      id
      collectionDate
      taNewLevelWinners {
        id
        name
        taTeamPbisLevel
        taTeamAveragePbisCardsPerStudent
      }
      personalLevelWinners {
        id
        name
        individualPbisLevel
      }
      randomDrawingWinners {
        id
        student {
          id
          name
          taTeacher {
            name
          }
        }
      }
    }
    totalCards: pbisCardsCount
  }
`;

export default function PbisWeeklyReading() {
  // console.log('PbisWeeklyReading');

  const { data, isLoading } = useGQLQuery(
    "PBIS Reading Page",
    PBIS_READING_QUERY,
    {},
    {}
  );
  if (isLoading) return <Loading />;
  const lastCollection = data.lastCollection[0];
  if (!lastCollection) return <p>No data</p>;
  const tasAtNewLevels = lastCollection?.taNewLevelWinners || [];
  // console.log(taTeamsAtNewLevels);
  const personalLevelWinners = lastCollection.personalLevelWinners || [];
  const randomDrawingWinners = lastCollection.randomDrawingWinners || [];
  const hasTaTeamsAtNewLevels = tasAtNewLevels.length > 0;
  const hasPersonalLevelWinners = personalLevelWinners.length > 0;
  const todaysDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const totalCards = data.totalCards;
  return (
    <PbisReadingStyles>
      <h3>In PBIS News,</h3>
      <p>
        As a school, we have earned {totalCards} PBIS cards. Keep up the good
        work. Continue to demonstrate our Habits of Work: Respect,
        Responsibility, and Perseverance.
      </p>
      <h3>
        <span className="strong">Congratulations</span> to the following Random
        Drawing Winners! Please report to the Bus Lobby to claim your reward.
      </h3>
      <ul>
        {randomDrawingWinners.map((winner) => (
          <li key={winner.id}>{capitalizeFirstLetter(winner?.student.name)}</li>
        ))}
      </ul>
      {hasPersonalLevelWinners && (
        <h3>
          The following students have Leveled-Up and should report to the gym to
          claim their reward.
        </h3>
      )}
      <ul>
        {personalLevelWinners.map((winner) => (
          <li key={winner.id}>
            {capitalizeFirstLetter(winner.name)} - {winner.individualPbisLevel}
          </li>
        ))}
      </ul>
      {hasTaTeamsAtNewLevels && (
        <h3>
          The following TA Teams have completed their Quest Box. You will be
          notified when you should receive your celebration. Your TA will claim
          your earnings TODAY {todaysDate}
        </h3>
      )}
      <ul>
        {tasAtNewLevels.map((winner) => (
          <li key={winner.id}>
            {winner.name} - {winner.taTeamPbisLevel}
          </li>
        ))}
      </ul>
    </PbisReadingStyles>
  );
}
