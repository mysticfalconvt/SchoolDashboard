import gql from 'graphql-tag';
import { NextPage } from 'next';
import React, { useMemo, useState } from 'react';
import Loading from '../components/Loading';
import Table from '../components/Table';
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

// All callbacks (assignments) plus the people we always want listed:
// every current student, and every teacher who has classes.
const CALLBACK_STATS_QUERY = gql`
  query CALLBACK_STATS {
    callbacks(orderBy: { dateAssigned: asc }) {
      id
      dateAssigned
      dateCompleted
      daysLate
      teacher {
        id
        name
      }
      student {
        id
        name
      }
    }
    classTeachers: users(where: { isStaff: { equals: true } }) {
      id
      name
      hasClasses
    }
    students: users(where: { isStudent: { equals: true } }) {
      id
      name
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

interface PersonRef {
  id: string;
  name: string;
}

interface Callback {
  id: string;
  dateAssigned: string | null;
  dateCompleted: string | null;
  daysLate: number | null;
  teacher: PersonRef | null;
  student: PersonRef | null;
}

interface StatRow {
  id: string;
  name: string;
  total: number;
  active: number;
  completed: number;
  completionRate: number; // percent, 0-100
  perWeek: number;
  completedPerWeek: number;
  avgDaysToComplete: number | null;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

const round1 = (n: number) => Math.round(n * 10) / 10;

function weekLabel(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '?';
  return d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
}

// Aggregate callbacks into per-person stats. `pick` chooses which side of the
// callback (teacher = assigner, student = receiver) this row is keyed on.
// `seed` guarantees people appear even with zero callbacks.
function buildStats(
  callbacks: Callback[],
  pick: (c: Callback) => PersonRef | null,
  seed: PersonRef[],
  weeksElapsed: number,
): StatRow[] {
  const acc: Record<
    string,
    {
      id: string;
      name: string;
      total: number;
      active: number;
      completed: number;
      daysSum: number;
      daysCount: number;
    }
  > = {};

  const ensure = (id: string, name: string) =>
    acc[id] ||
    (acc[id] = {
      id,
      name,
      total: 0,
      active: 0,
      completed: 0,
      daysSum: 0,
      daysCount: 0,
    });

  seed.forEach((p) => ensure(p.id, p.name));

  callbacks.forEach((c) => {
    const p = pick(c);
    if (!p) return;
    const e = ensure(p.id, p.name);
    e.total += 1;
    if (c.dateCompleted) {
      e.completed += 1;
      if (c.dateAssigned) {
        const days =
          (new Date(c.dateCompleted).getTime() -
            new Date(c.dateAssigned).getTime()) /
          MS_PER_DAY;
        if (days >= 0) {
          e.daysSum += days;
          e.daysCount += 1;
        }
      }
    } else {
      e.active += 1;
    }
  });

  return Object.values(acc)
    .map((e) => ({
      id: e.id,
      name: e.name,
      total: e.total,
      active: e.active,
      completed: e.completed,
      completionRate: e.total ? round1((100 * e.completed) / e.total) : 0,
      perWeek: round1(e.total / weeksElapsed),
      completedPerWeek: round1(e.completed / weeksElapsed),
      avgDaysToComplete: e.daysCount ? round1(e.daysSum / e.daysCount) : null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

type TabKey = 'runs' | 'teachers' | 'students';

const CallbackHistory: NextPage = () => {
  const me = useUser();
  const [tab, setTab] = useState<TabKey>('runs');

  const canView =
    !!me && (isAllowed(me, 'canManagePbis') || isAllowed(me, 'isSuperAdmin'));

  const { data: runData, isLoading: runsLoading } = useGQLQuery(
    'callbackRewardHistory',
    CALLBACK_REWARD_HISTORY_QUERY,
    {},
    { enabled: canView },
  );

  const { data: statsData, isLoading: statsLoading } = useGQLQuery(
    'callbackStats',
    CALLBACK_STATS_QUERY,
    {},
    { enabled: canView && (tab === 'teachers' || tab === 'students') },
  );

  // Build the reward-run heatmap: rows = students, columns = runs (weeks).
  const { runs, students, statusFor } = useMemo(() => {
    const runList: RewardRun[] = runData?.callbackRewardRuns || [];
    const studentMap: Record<string, string> = {};
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
  }, [runData]);

  // Per-teacher (assigner) and per-student (receiver) stats.
  const { teacherStats, studentStats } = useMemo(() => {
    const callbacks: Callback[] = statsData?.callbacks || [];
    const classTeachers: (PersonRef & { hasClasses?: boolean })[] =
      statsData?.classTeachers || [];
    const allStudents: PersonRef[] = statsData?.students || [];

    // Weeks spanned by the data, from the earliest assignment to today.
    const firstAssigned = callbacks.reduce<string | null>(
      (min, c) =>
        c.dateAssigned && (!min || c.dateAssigned < min) ? c.dateAssigned : min,
      null,
    );
    const weeksElapsed = firstAssigned
      ? Math.max(1, (Date.now() - new Date(firstAssigned).getTime()) / MS_PER_WEEK)
      : 1;

    // Teachers we always list: those who actually have classes. Teachers who
    // assigned callbacks without classes get added during aggregation.
    const teacherSeed = classTeachers
      .filter((t) => t.hasClasses)
      .map((t) => ({ id: t.id, name: t.name }));

    return {
      teacherStats: buildStats(
        callbacks,
        (c) => c.teacher,
        teacherSeed,
        weeksElapsed,
      ),
      studentStats: buildStats(
        callbacks,
        (c) => c.student,
        allStudents,
        weeksElapsed,
      ),
    };
  }, [statsData]);

  if (!me) return <Loading />;
  if (!isAllowed(me, 'canManagePbis') && !isAllowed(me, 'isSuperAdmin')) {
    return (
      <div className="text-center m-8">
        <h2>You are not authorized to view this page.</h2>
      </div>
    );
  }

  return (
    <div className="m-4">
      <h1>Callback History</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--blue)] my-4">
        {(
          [
            ['runs', 'Reward Runs'],
            ['teachers', 'Teacher Stats'],
            ['students', 'Student Stats'],
          ] as [TabKey, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-t-lg ${
              tab === key
                ? 'bg-[var(--blue)] text-white'
                : 'bg-[var(--blueTrans)] text-white opacity-70'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'runs' && (
        <RewardRunsView
          runs={runs}
          students={students}
          statusFor={statusFor}
          isLoading={runsLoading}
        />
      )}

      {tab === 'teachers' && (
        <StatsView
          kind="teacher"
          rows={teacherStats}
          isLoading={statsLoading}
        />
      )}

      {tab === 'students' && (
        <StatsView
          kind="student"
          rows={studentStats}
          isLoading={statsLoading}
        />
      )}
    </div>
  );
};

// ---- Reward runs heatmap (the original view) ----
const RewardRunsView: React.FC<{
  runs: RewardRun[];
  students: StudentRef[];
  statusFor: (runId: string, studentId: string) => 'yes' | 'no' | undefined;
  isLoading: boolean;
}> = ({ runs, students, statusFor, isLoading }) => (
  <div>
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
                <td className="sticky left-0 bg-[var(--backgroundColor)] text-[var(--textColor)] px-2 py-1 whitespace-nowrap border border-gray-200">
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

// ---- Teacher / student stats table ----
const StatsView: React.FC<{
  kind: 'teacher' | 'student';
  rows: StatRow[];
  isLoading: boolean;
}> = ({ kind, rows, isLoading }) => {
  const isTeacher = kind === 'teacher';
  const verb = isTeacher ? 'Given' : 'Received';

  const columns = useMemo(
    () => [
      { Header: isTeacher ? 'Teacher' : 'Student', accessor: 'name' },
      { Header: `Total ${verb}`, accessor: 'total' },
      { Header: 'Active', accessor: 'active' },
      { Header: 'Completed', accessor: 'completed' },
      {
        Header: 'Completion %',
        accessor: 'completionRate',
        Cell: ({ value }: { value: number }) => `${value}%`,
      },
      { Header: `${verb} / wk`, accessor: 'perWeek' },
      { Header: 'Completed / wk', accessor: 'completedPerWeek' },
      {
        Header: 'Avg days to complete',
        accessor: 'avgDaysToComplete',
        Cell: ({ value }: { value: number | null }) =>
          value === null ? '—' : value,
      },
    ],
    [isTeacher, verb],
  );

  if (isLoading) return <Loading />;

  return (
    <div>
      <p className="opacity-80 mb-4">
        {isTeacher
          ? 'All teachers with classes, plus anyone who has assigned a callback.'
          : 'All students.'}{' '}
        Per-week averages are over the number of weeks since the first callback
        was assigned. Click a column header to sort.
      </p>
      {rows.length === 0 ? (
        <p>No callbacks have been recorded yet.</p>
      ) : (
        <Table columns={columns} data={rows} searchColumn="name" />
      )}
    </div>
  );
};

export default CallbackHistory;
