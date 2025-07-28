import gql from 'graphql-tag';
import React from 'react';
import Loading from '../components/Loading';
import { capitalizeFirstLetter } from '../lib/nameUtils';
import { useGQLQuery } from '../lib/useGqlQuery';

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
      staffRandomWinners {
        id
        name
        email
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

interface TaNewLevelWinner {
  id: string;
  name: string;
  taTeamPbisLevel: number;
  taTeamAveragePbisCardsPerStudent: number;
}

interface PersonalLevelWinner {
  id: string;
  name: string;
  individualPbisLevel: number;
}

interface StaffRandomWinner {
  id: string;
  name: string;
  email: string;
}

interface RandomDrawingWinner {
  id: string;
  student: {
    id: string;
    name: string;
    taTeacher: {
      name: string;
    };
  };
}

interface PbisCollection {
  id: string;
  collectionDate: string;
  taNewLevelWinners: TaNewLevelWinner[];
  personalLevelWinners: PersonalLevelWinner[];
  staffRandomWinners: StaffRandomWinner[];
  randomDrawingWinners: RandomDrawingWinner[];
}

const PbisWeeklyReading: React.FC = () => {
  const { data, isLoading } = useGQLQuery(
    'PBIS Reading Page',
    PBIS_READING_QUERY,
    {},
    {},
  );
  if (isLoading) return <Loading />;
  const lastCollection = data?.lastCollection?.[0] as PbisCollection;
  if (!lastCollection) return <p>No data</p>;
  const tasAtNewLevels = lastCollection?.taNewLevelWinners || [];
  const personalLevelWinners = lastCollection.personalLevelWinners || [];
  const randomDrawingWinners = lastCollection.randomDrawingWinners || [];
  const hasTaTeamsAtNewLevels = tasAtNewLevels.length > 0;
  const hasPersonalLevelWinners = personalLevelWinners.length > 0;
  const todaysDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const totalCards = data?.totalCards;
  return (
    <div className="max-w-screen-2xl mx-auto">
      <h3 className="text-3xl mb-4">In PBIS News,</h3>
      <p className="text-2xl mb-4">
        As a school, we have earned {totalCards} PBIS cards. Keep up the good
        work. Continue to demonstrate our Habits: Respect, Responsibility, and
        Perseverance.
      </p>
      <h3 className="text-3xl mb-4">
        <span className="text-4xl font-bold">Congratulations</span> to the
        following Random Drawing Winners! Please report to the Bus Lobby to
        claim your reward.
      </h3>
      <ul className="text-2xl mb-4">
        {randomDrawingWinners.map((winner) => (
          <li key={winner.id}>{capitalizeFirstLetter(winner?.student.name)}</li>
        ))}
      </ul>
      {hasPersonalLevelWinners && (
        <h3 className="text-3xl mb-4">
          The following students have Leveled-Up. Please report to the BUS LOBBY
          to claim your earnings.
        </h3>
      )}
      <ul className="text-2xl mb-4">
        {personalLevelWinners.map((winner) => (
          <li key={winner.id}>
            {capitalizeFirstLetter(winner.name)} - {winner.individualPbisLevel}
          </li>
        ))}
      </ul>
      {hasTaTeamsAtNewLevels && (
        <h3 className="text-3xl mb-4">
          The following TA Teams have completed their Bingo Box. You will be
          notified when you should receive your celebration.
        </h3>
      )}
      <ul className="text-2xl mb-4">
        {tasAtNewLevels.map((winner) => (
          <li key={winner.id}>
            {winner.name} - {winner.taTeamPbisLevel}
          </li>
        ))}
      </ul>
      {lastCollection?.staffRandomWinners.length ? (
        <>
          <h3 className="text-3xl mb-4">
            Congratulations to the following Staff Members
          </h3>
          <ul className="text-2xl mb-4">
            {lastCollection.staffRandomWinners.map((winner) => (
              <li key={winner.id}>{winner.name}</li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
};

export default PbisWeeklyReading;
