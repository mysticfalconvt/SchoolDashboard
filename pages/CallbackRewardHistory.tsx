import gql from 'graphql-tag';
import { NextPage } from 'next';
import React, { useMemo } from 'react';
import Loading from '../components/Loading';
import { useUser } from '../components/User';
import isAllowed from '../lib/isAllowed';
import { useGQLQuery } from '../lib/useGqlQuery';

const CALLBACK_REWARD_HISTORY_QUERY = gql`
  query CALLBACK_REWARD_HISTORY {
    callbackRewardRuns(orderBy: { runDate: asc }) {
      id
      runDate
      eligibleStudents {
        id
        name
      }
      ineligibleStudents {
        id
        name
      }
    }
  }
`;

interface StudentRef {
  id: string;
  name: string;
}

interface RewardRun {
  id: string;
  runDate: string;
  eligibleStudents: StudentRef[];
  ineligibleStudents: StudentRef[];
}

function weekLabel(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '?';
  return d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
}

const CallbackRewardHistory: NextPage = () => {
  const me = useUser();

  const { data, isLoading } = useGQLQuery(
    'callbackRewardHistory',
    CALLBACK_REWARD_HISTORY_QUERY,
    {},
    { enabled: !!me && isAllowed(me, 'isStaff') },
  );

  // Build the heatmap: rows = students, columns = runs (weeks).
  // Cell = 'yes' (received reward), 'no' (3+ callbacks, skipped), or '' (absent).
  const { runs, students, statusFor } = useMemo(() => {
    const runList: RewardRun[] = data?.callbackRewardRuns || [];
    const studentMap: Record<string, string> = {};
    // runId -> studentId -> 'yes' | 'no'
    const status: Record<string, Record<string, 'yes' | 'no'>> = {};

    runList.forEach((run) => {
      status[run.id] = {};
      run.eligibleStudents?.forEach((s) => {
        studentMap[s.id] = s.name;
        status[run.id][s.id] = 'yes';
      });
      run.ineligibleStudents?.forEach((s) => {
        studentMap[s.id] = s.name;
        status[run.id][s.id] = 'no';
      });
    });

    const studentList = Object.entries(studentMap)
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const statusFor = (runId: string, studentId: string) =>
      status[runId]?.[studentId];

    return { runs: runList, students: studentList, statusFor };
  }, [data]);

  if (!me) return <Loading />;
  if (!isAllowed(me, 'isStaff')) {
    return (
      <div className="text-center m-8">
        <h2>You are not authorized to view this page.</h2>
      </div>
    );
  }

  return (
    <div className="m-4">
      <h1>Callback Reward History</h1>
      <p className="opacity-80 mb-4">
        Each column is a weekly callback reward run.{' '}
        <span className="font-semibold text-green-600">Green = received</span>{' '}
        the reward (fewer than 3 active callbacks);{' '}
        <span className="font-semibold text-red-600">red = not eligible</span>{' '}
        (3+ active callbacks).
      </p>

      {isLoading && <Loading />}
      {!isLoading && runs.length === 0 && (
        <p>No callback reward runs have been recorded yet.</p>
      )}

      {!isLoading && runs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 bg-[var(--blue)] text-white px-2 py-1 text-left z-10">
                  Student
                </th>
                {runs.map((run) => (
                  <th
                    key={run.id}
                    className="px-2 py-1 text-xs whitespace-nowrap"
                    title={new Date(run.runDate).toLocaleString()}
                  >
                    {weekLabel(run.runDate)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td className="sticky left-0 bg-white px-2 py-1 whitespace-nowrap border border-gray-200">
                    {student.name}
                  </td>
                  {runs.map((run) => {
                    const status = statusFor(run.id, student.id);
                    const bg =
                      status === 'yes'
                        ? 'rgba(34, 197, 94, 0.75)'
                        : status === 'no'
                          ? 'rgba(239, 68, 68, 0.75)'
                          : 'transparent';
                    return (
                      <td
                        key={run.id}
                        title={`${student.name} — ${weekLabel(run.runDate)}: ${
                          status === 'yes'
                            ? 'received'
                            : status === 'no'
                              ? 'not eligible'
                              : 'not recorded'
                        }`}
                        className="w-8 h-8 border border-gray-200 text-center text-xs"
                        style={{ backgroundColor: bg }}
                      >
                        {status === 'yes' ? 'Y' : status === 'no' ? 'N' : ''}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CallbackRewardHistory;
