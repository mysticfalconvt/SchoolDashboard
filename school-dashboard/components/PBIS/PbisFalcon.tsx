import gql from 'graphql-tag';
import Image from 'next/image';
import { useGQLQuery } from '../../lib/useGqlQuery';
import DisplayError from '../ErrorMessage';
import Loading from '../Loading';

// gql query to get number of cards
export const TOTAL_PBIS_CARDS = gql`
  query {
    pbisCardsCount
  }
`;

interface PbisFalconProps {
  initialCount?: number;
}

interface TotalPbisCardsData {
  pbisCardsCount: number;
}

export default function PbisFalcon({ initialCount }: PbisFalconProps) {
  let queryOptions = {};
  const initialData: Partial<TotalPbisCardsData> = {};
  initialData.pbisCardsCount = initialCount;
  if (initialCount) {
    queryOptions = {
      initialData,
      staleTime: 1000 * 60 * 3,
    };
  }
  const { data, isLoading, error } = useGQLQuery(
    'totalPbisCards',
    TOTAL_PBIS_CARDS,
    {},
    queryOptions,
  );
  // last years card total
  const cardGoal = 60000;
  if (isLoading) return <Loading />;
  if (error) return <DisplayError error={error} />;

  const displayCount = data?.pbisCardsCount;
  const percentageFull = Math.round((displayCount / cardGoal) * 10000) / 100;
  const percentageLeft = 100 - percentageFull;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-[150px] w-[150px] bg-[var(--blue)] rounded-[20px] m-2 border-[4px] border-[var(--red)] overflow-hidden">
        {/* Red fill from bottom up */}
        <div
          className="absolute left-0 bottom-0 w-full bg-[var(--red)] transition-all duration-1000 ease-in-out z-0"
          style={{ height: `${percentageFull}%` }}
        />
        {/* Falcon and text always on top */}
        <Image
          src="/falcon.svg"
          alt="falcon"
          width={125}
          height={125}
          className="absolute top-2 left-1/2 -translate-x-1/2 z-10 pointer-events-none drop-shadow-[0_0_8px_white]"
        />
        <span className="absolute top-4 left-0 w-full text-white font-bold text-center text-lg z-20 drop-shadow">{`${percentageFull}%`}</span>
        <span
          className="absolute top-1/2 left-0 w-full text-white font-bold text-center z-20 text-xl drop-shadow"
          style={{ transform: 'translateY(-50%)' }}
        >
          {displayCount} cards
        </span>
      </div>
    </div>
  );
}
