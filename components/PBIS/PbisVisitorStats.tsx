import { useQuery } from 'react-query';
import DisplayError from '../ErrorMessage';
import Loading from '../Loading';

interface UmamiStats {
  visitors7: number;
  visitors30: number;
  pageviews7: number;
  pageviews30: number;
}

async function fetchUmamiStats(): Promise<UmamiStats> {
  const res = await fetch('/api/umamiStats');
  if (!res.ok) {
    throw new Error('Failed to load visitor stats');
  }
  return res.json();
}

function StatRow({
  label,
  visitors,
  pageviews,
}: {
  label: string;
  visitors: number;
  pageviews: number;
}) {
  return (
    <div className="w-full bg-white/10 rounded-xl py-3 px-4 text-center">
      <p className="text-4xl font-bold leading-none">{visitors}</p>
      <p className="text-sm opacity-80 mt-1">visitors · {label}</p>
      <p className="text-xs opacity-70">{pageviews} pageviews</p>
    </div>
  );
}

export default function PbisVisitorStats() {
  const { data, isLoading, error } = useQuery<UmamiStats, Error>(
    'umamiStats',
    fetchUmamiStats,
    {
      // Data is cached hard on the server, so no need to refetch often.
      staleTime: 1000 * 60 * 60,
      refetchOnWindowFocus: false,
      retry: false,
    },
  );

  return (
    <div className="bg-gradient-to-tl from-[var(--redTrans)] to-[var(--blueTrans)] m-4 p-5 rounded-2xl flex flex-col justify-center items-center shadow-lg hover:shadow-xl transition-shadow duration-300 w-full max-w-[16rem] mx-auto">
      <h1 className="text-2xl font-semibold mb-3">Site Visitors</h1>
      {isLoading && <Loading />}
      {error && <DisplayError error={error} />}
      {data && (
        <div className="flex flex-col gap-3 w-full">
          <StatRow
            label="last 7 days"
            visitors={data.visitors7}
            pageviews={data.pageviews7}
          />
          <StatRow
            label="last 30 days"
            visitors={data.visitors30}
            pageviews={data.pageviews30}
          />
        </div>
      )}
    </div>
  );
}
