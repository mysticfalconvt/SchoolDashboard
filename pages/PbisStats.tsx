import gql from 'graphql-tag';
import { NextPage } from 'next';
import React, { useMemo, useState } from 'react';
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import Loading from '../components/Loading';
import Table from '../components/Table';
import { useUser } from '../components/User';
import isAllowed from '../lib/isAllowed';
import { useGQLQuery } from '../lib/useGqlQuery';
import {
  getAveragePbisCount,
  getMedianPbis,
  getTeacherStudentStats,
  PbisStudent,
  roundToOneDecimal,
} from '../lib/pbisStats';

ChartJS.register(
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
);

const PBIS_STUDENT_STATS_QUERY = gql`
  query PBIS_STUDENT_STATS_QUERY(
    $sevenDaysAgo: DateTime!
    $thirtyDaysAgo: DateTime!
  ) {
    students: users(where: { isStudent: { equals: true } }) {
      id
      name
      YearPbisCount: studentPbisCardsCount
      Last7DaysPbisCount: studentPbisCardsCount(
        where: { dateGiven: { gte: $sevenDaysAgo } }
      )
      Last30DaysPbisCount: studentPbisCardsCount(
        where: { dateGiven: { gte: $thirtyDaysAgo } }
      )
      block1Teacher { id name }
      block2Teacher { id name }
      block3Teacher { id name }
      block4Teacher { id name }
      block5Teacher { id name }
      block6Teacher { id name }
      block7Teacher { id name }
      block8Teacher { id name }
      block9Teacher { id name }
      block10Teacher { id name }
      block11Teacher { id name }
      block12Teacher { id name }
    }
  }
`;

const PBIS_CARD_ENTRIES_QUERY = gql`
  query PBIS_CARD_ENTRIES_QUERY($start: DateTime!, $end: DateTime!) {
    pbisCards(
      where: { dateGiven: { gte: $start, lte: $end } }
      orderBy: { dateGiven: asc }
    ) {
      id
      dateGiven
      teacher {
        id
        name
      }
    }
  }
`;

const STAFF_PBIS_CARD_SUMMARY_QUERY = gql`
  query STAFF_PBIS_CARD_SUMMARY_QUERY($start: DateTime!, $end: DateTime!) {
    staffPbisCards(
      where: { dateGiven: { gte: $start, lte: $end } }
      orderBy: { dateGiven: desc }
    ) {
      id
      dateGiven
      giver {
        id
        isStudent
        isStaff
      }
    }
  }
`;

interface CardEntry {
  id: string;
  dateGiven: string;
  teacher?: { id: string; name: string } | null;
}

interface StaffCardEntry {
  id: string;
  dateGiven: string;
  giver?: { id: string; isStudent?: boolean; isStaff?: boolean } | null;
}

// A teacher's card entry activity: total cards + a per-day count map
interface TeacherActivity {
  id: string;
  name: string;
  total: number;
  days: Record<string, number>; // 'YYYY-MM-DD' -> count
}

// Local YYYY-MM-DD key (en-CA formats as ISO date)
function dayKey(date: Date): string {
  return date.toLocaleDateString('en-CA');
}

// Shade a heatmap cell by how many cards were recorded that day
function heatColor(count: number): string {
  if (!count) return 'transparent';
  if (count <= 2) return 'rgba(59, 130, 246, 0.25)';
  if (count <= 5) return 'rgba(59, 130, 246, 0.45)';
  if (count <= 10) return 'rgba(59, 130, 246, 0.7)';
  return 'rgba(59, 130, 246, 1)';
}

type TabKey = 'overview' | 'students' | 'activity' | 'staffCards';
type ActivityViewKey = 'month' | 'heatmap' | 'table' | 'calendar';
type StudentPeriod = 'all' | '30days' | '7days';

const PbisStats: NextPage = () => {
  const me = useUser();

  const [tab, setTab] = useState<TabKey>('overview');
  const [activityView, setActivityView] =
    useState<ActivityViewKey>('month');
  const [studentPeriod, setStudentPeriod] = useState<StudentPeriod>('all');

  // Always look back over the last 12 months
  const variables = useMemo(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    return {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    };
  }, []);

  const staffCardVariables = useMemo(() => {
    const endDate = new Date();
    const yearStart = new Date(endDate.getFullYear(), 0, 1);
    const sevenDaysAgo = new Date(endDate);
    sevenDaysAgo.setDate(endDate.getDate() - 7);
    return {
      start: new Date(Math.min(yearStart.getTime(), sevenDaysAgo.getTime())).toISOString(),
      end: endDate.toISOString(),
    };
  }, []);

  const studentStatsVariables = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    const thirtyDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    return {
      sevenDaysAgo: sevenDaysAgo.toISOString(),
      thirtyDaysAgo: thirtyDaysAgo.toISOString(),
    };
  }, []);

  const canView =
    !!me &&
    (isAllowed(me, 'canManagePbis') || isAllowed(me, 'isSuperAdmin'));
  const {
    data: studentData,
    isLoading: studentStatsLoading,
    error: studentStatsError,
  } = useGQLQuery(
    'pbisStudentStats',
    PBIS_STUDENT_STATS_QUERY,
    studentStatsVariables,
    {
      enabled: canView && (tab === 'overview' || tab === 'students'),
      staleTime: 1000 * 60 * 3,
    },
  );
  const { data, isLoading, error: activityError } = useGQLQuery(
    'pbisCardEntries',
    PBIS_CARD_ENTRIES_QUERY,
    variables,
    { enabled: canView && tab === 'activity' },
  );
  const {
    data: staffCardData,
    isLoading: staffCardsLoading,
    error: staffCardsError,
  } = useGQLQuery(
    'staffPbisCardSummary',
    STAFF_PBIS_CARD_SUMMARY_QUERY,
    staffCardVariables,
    { enabled: canView && tab === 'staffCards' },
  );

  // Aggregate cards into per-teacher per-day activity
  const { teachers, dayList } = useMemo(() => {
    const cards: CardEntry[] = data?.pbisCards || [];
    const byTeacher: Record<string, TeacherActivity> = {};
    const daysSeen = new Set<string>();

    cards.forEach((card) => {
      const key = dayKey(new Date(card.dateGiven));
      daysSeen.add(key);
      const teacher = card.teacher || {
        id: 'unknown-giver',
        name: 'Unknown / system giver',
      };
      const t =
        byTeacher[teacher.id] ||
        (byTeacher[teacher.id] = {
          id: teacher.id,
          name: teacher.name,
          total: 0,
          days: {},
        });
      t.total += 1;
      t.days[key] = (t.days[key] || 0) + 1;
    });

    const teacherList = Object.values(byTeacher).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    const sortedDays = Array.from(daysSeen).sort();
    return { teachers: teacherList, dayList: sortedDays };
  }, [data]);

  if (!me) return <Loading />;
  if (!canView) {
    return (
      <div className="text-center m-8">
        <h2>You are not authorized to view this page.</h2>
      </div>
    );
  }

  return (
    <div className="mx-auto my-4 w-full max-w-7xl">
      <h1>PBIS Stats</h1>
      <p className="mb-6 max-w-4xl opacity-80">
        Explore student recognition, class-group distributions, card activity,
        and staff cards. Student totals use the current dataset, which is reset
        for each school year. Activity views cover the rolling last 12 months.
      </p>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-[var(--blue)]">
        {(
          [
            ['overview', 'Overview'],
            ['students', 'Student Distribution'],
            ['activity', 'Card Activity'],
            ['staffCards', 'Staff Cards'],
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

      {tab === 'overview' && (
        <OverviewView
          students={studentData?.students || []}
          isLoading={studentStatsLoading}
          error={studentStatsError}
        />
      )}

      {tab === 'students' && (
        <StudentDistributionView
          students={studentData?.students || []}
          isLoading={studentStatsLoading}
          error={studentStatsError}
          period={studentPeriod}
          setPeriod={setStudentPeriod}
        />
      )}

      {tab === 'staffCards' && !staffCardsError && (
        <StaffCardSummaryView
          cards={staffCardData?.staffPbisCards || []}
          isLoading={staffCardsLoading}
        />
      )}
      {tab === 'staffCards' && staffCardsError && (
        <ErrorMessage message="Staff card data could not be loaded." />
      )}

      {tab === 'activity' && (
        <CardActivityView
          activityView={activityView}
          setActivityView={setActivityView}
          teachers={teachers}
          dayList={dayList}
          isLoading={isLoading}
          error={activityError}
          startDate={new Date(variables.start)}
          endDate={new Date(variables.end)}
        />
      )}
    </div>
  );
};

const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="rounded-lg border border-red-500/60 bg-red-500/10 p-4">
    <p className="font-semibold">{message}</p>
    <p className="mt-1 text-sm opacity-80">Refresh the page to try again.</p>
  </div>
);

const MetricCard: React.FC<{
  label: string;
  value: string | number;
  detail?: string;
}> = ({ label, value, detail }) => (
  <div className="rounded-lg border border-[var(--blue)] bg-[var(--blueTrans)] p-4">
    <p className="text-sm font-semibold">{label}</p>
    <p className="mt-2 text-4xl font-bold">{value}</p>
    {detail && <p className="mt-1 text-sm opacity-80">{detail}</p>}
  </div>
);

const OverviewView: React.FC<{
  students: PbisStudent[];
  isLoading: boolean;
  error?: Error | null;
}> = ({ students, isLoading, error }) => {
  if (isLoading) return <Loading />;
  if (error) return <ErrorMessage message="Student PBIS data could not be loaded." />;

  const totalCards = students.reduce(
    (total, student) => total + student.YearPbisCount,
    0,
  );
  const recognizedStudents = students.filter(
    (student) => student.YearPbisCount > 0,
  ).length;
  const reach = students.length
    ? roundToOneDecimal((recognizedStudents / students.length) * 100)
    : 0;

  return (
    <section>
      <h2>Current-Year Student Recognition</h2>
      <p className="mb-4 max-w-4xl opacity-80">
        These totals summarize all student PBIS cards in the current dataset.
        Reach shows how many enrolled students have received at least one card;
        the median helps show the typical student without being skewed by a few
        very high totals.
      </p>
      {students.length === 0 ? (
        <p>No student PBIS data is available.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Student Cards" value={totalCards} />
          <MetricCard
            label="Average per Student"
            value={roundToOneDecimal(getAveragePbisCount(students))}
            detail={`${students.length} students`}
          />
          <MetricCard
            label="Median per Student"
            value={roundToOneDecimal(getMedianPbis(students))}
          />
          <MetricCard
            label="Students Reached"
            value={`${reach}%`}
            detail={`${recognizedStudents} recognized, ${
              students.length - recognizedStudents
            } with no cards`}
          />
        </div>
      )}
    </section>
  );
};

const StudentDistributionView: React.FC<{
  students: PbisStudent[];
  isLoading: boolean;
  error?: Error | null;
  period: StudentPeriod;
  setPeriod: React.Dispatch<React.SetStateAction<StudentPeriod>>;
}> = ({ students, isLoading, error, period, setPeriod }) => {
  const periodStudents = useMemo(
    () =>
      students.map((student) => ({
        ...student,
        YearPbisCount:
          period === '7days'
            ? student.Last7DaysPbisCount || 0
            : period === '30days'
              ? student.Last30DaysPbisCount || 0
              : student.YearPbisCount,
      })),
    [period, students],
  );
  const rows = useMemo(
    () =>
      getTeacherStudentStats(periodStudents).map((teacher) => ({
        name: teacher.name,
        studentCount: teacher.students.length,
        averageCards: roundToOneDecimal(teacher.averageCards),
        medianCards: roundToOneDecimal(teacher.medianCards),
        zeroCardStudents: teacher.zeroCardStudents,
      })),
    [periodStudents],
  );
  const columns = useMemo(
    () => [
      { Header: 'Teacher', accessor: 'name' },
      { Header: 'Students', accessor: 'studentCount' },
      { Header: 'Average Cards', accessor: 'averageCards' },
      { Header: 'Median Cards', accessor: 'medianCards' },
      { Header: 'Students With No Cards', accessor: 'zeroCardStudents' },
    ],
    [],
  );

  if (isLoading) return <Loading />;
  if (error) return <ErrorMessage message="Student PBIS data could not be loaded." />;

  return (
    <section>
      <h2>Student Distribution by Teacher</h2>
      <p className="mb-4 max-w-4xl opacity-80">
        This groups each teacher&apos;s currently enrolled students and summarizes
        those students&apos; PBIS totals. A student is counted once per teacher even
        if they share multiple blocks. Cards may have been awarded by any staff
        member, so this is not a ranking of cards given by each teacher.
      </p>
      <div className="mb-4 flex flex-wrap gap-2" aria-label="Student data period">
        {(
          [
            ['all', 'All Time'],
            ['30days', 'Last 30 Days'],
            ['7days', 'Last 7 Days'],
          ] as [StudentPeriod, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setPeriod(key)}
            className={`rounded px-3 py-2 ${
              period === key
                ? 'bg-[var(--blue)] text-white'
                : 'bg-[var(--blueTrans)] text-white opacity-70'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {rows.length === 0 ? (
        <p>No class assignments are available.</p>
      ) : (
        <Table columns={columns} data={rows} searchColumn="name" />
      )}
    </section>
  );
};

const CardActivityView: React.FC<{
  activityView: ActivityViewKey;
  setActivityView: React.Dispatch<React.SetStateAction<ActivityViewKey>>;
  teachers: TeacherActivity[];
  dayList: string[];
  isLoading: boolean;
  error?: Error | null;
  startDate: Date;
  endDate: Date;
}> = ({
  activityView,
  setActivityView,
  teachers,
  dayList,
  isLoading,
  error,
  startDate,
  endDate,
}) => {
  if (isLoading) return <Loading />;
  if (error) return <ErrorMessage message="Card activity could not be loaded." />;

  const totalCards = teachers.reduce((total, teacher) => total + teacher.total, 0);
  const activeGivers = teachers.filter(
    (teacher) => teacher.id !== 'unknown-giver',
  ).length;
  const mostRecentDay = dayList[dayList.length - 1] || 'No activity';

  return (
    <section>
      <h2>Student Card Activity</h2>
      <p className="mb-4 max-w-4xl opacity-80">
        These views use each card&apos;s recorded date and teacher account over the
        rolling last 12 months. They show card-recording patterns, not student or
        teacher performance. Cards without a teacher appear under Unknown / system
        giver so totals remain complete.
      </p>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <MetricCard label="Cards Recorded" value={totalCards} />
        <MetricCard label="Active Givers" value={activeGivers} />
        <MetricCard label="Most Recent Activity" value={mostRecentDay} />
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ['month', 'Month Overview'],
            ['heatmap', 'Heatmap'],
            ['table', 'Teacher Summary'],
            ['calendar', 'Teacher Calendar'],
          ] as [ActivityViewKey, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActivityView(key)}
            className={`rounded px-3 py-2 ${
              activityView === key
                ? 'bg-[var(--blue)] text-white'
                : 'bg-[var(--blueTrans)] text-white opacity-70'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {teachers.length === 0 ? (
        <p>No cards were recorded in this date range.</p>
      ) : (
        <>
          {activityView === 'month' && (
            <MonthOverviewView
              teachers={teachers}
              startDate={startDate}
              endDate={endDate}
            />
          )}
          {activityView === 'heatmap' && (
            <div>
              <p className="mb-3 text-sm opacity-80">
                Each cell is one giver and recorded date. Darker cells contain
                more cards; blank cells contain none.
              </p>
              <HeatmapView teachers={teachers} dayList={dayList} />
            </div>
          )}
          {activityView === 'table' && <TableView teachers={teachers} />}
          {activityView === 'calendar' && (
            <CalendarView
              teachers={teachers}
              startDate={startDate}
              endDate={endDate}
            />
          )}
        </>
      )}
    </section>
  );
};

const StaffCardSummaryView: React.FC<{
  cards: StaffCardEntry[];
  isLoading: boolean;
}> = ({ cards, isLoading }) => {
  const stats = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const weekCards = cards.filter(
      (card) => new Date(card.dateGiven) >= sevenDaysAgo,
    );
    const yearCards = cards.filter(
      (card) => new Date(card.dateGiven) >= yearStart,
    );
    const studentGivers = new Set(
      weekCards
        .filter((card) => card.giver?.isStudent && !card.giver.isStaff)
        .map((card) => card.giver?.id),
    );
    const staffGivers = new Set(
      weekCards
        .filter((card) => card.giver?.isStaff)
        .map((card) => card.giver?.id),
    );

    return {
      cardsAwarded: weekCards.length,
      studentGivers: studentGivers.size,
      staffGivers: staffGivers.size,
      yearlyCards: yearCards.length,
      weeklyAverage: Math.round(
        (yearCards.length /
          Math.max(
            1,
            (now.getTime() - yearStart.getTime()) /
              (7 * 24 * 60 * 60 * 1000),
          )) *
          10,
      ) / 10,
    };
  }, [cards]);

  if (isLoading) return <Loading />;

  const metrics = [
    { label: 'Staff Cards Awarded, Last 7 Days', value: stats.cardsAwarded },
    {
      label: 'Students Who Handed Staff Cards, Last 7 Days',
      value: stats.studentGivers,
    },
    {
      label: 'Staff Who Handed Staff Cards, Last 7 Days',
      value: stats.staffGivers,
    },
    {
      label: 'Total Staff Cards This Year',
      value: stats.yearlyCards,
      detail: `${stats.weeklyAverage} average per week`,
    },
  ];

  return (
    <div>
      <p className="mb-4 opacity-80">
        Staff card activity for the last seven days and current calendar year.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, detail }) => (
          <div
            key={label}
            className="rounded-lg border border-[var(--blue)] bg-[var(--blueTrans)] p-4"
          >
            <p className="text-sm font-semibold">{label}</p>
            <p className="mt-2 text-4xl font-bold">{value}</p>
            {detail && <p className="mt-1 text-sm opacity-80">{detail}</p>}
          </div>
        ))}
      </div>
      <StaffCardGiverChart cards={cards} />
    </div>
  );
};

const StaffCardGiverChart: React.FC<{ cards: StaffCardEntry[] }> = ({
  cards,
}) => {
  const chartData = useMemo(() => {
    const yearStart = new Date(new Date().getFullYear(), 0, 1);
    const cardsByWeek: Record<
      number,
      { students: number; staff: number }
    > = {};

    cards.forEach((card) => {
      const cardDate = new Date(card.dateGiven);
      if (cardDate < yearStart) return;

      const weekStart = new Date(cardDate);
      weekStart.setHours(0, 0, 0, 0);
      weekStart.setDate(cardDate.getDate() - ((cardDate.getDay() + 6) % 7));
      const weekKey = weekStart.getTime();
      const week = cardsByWeek[weekKey] || (cardsByWeek[weekKey] = { students: 0, staff: 0 });

      if (card.giver?.isStudent && !card.giver.isStaff) week.students += 1;
      if (card.giver?.isStaff) week.staff += 1;
    });

    const recordedWeeks = Object.keys(cardsByWeek)
      .map(Number)
      .sort((a, b) => a - b);
    if (recordedWeeks.length === 0) {
      return { labels: [], datasets: [] };
    }

    const currentWeek = new Date();
    currentWeek.setHours(0, 0, 0, 0);
    currentWeek.setDate(
      currentWeek.getDate() - ((currentWeek.getDay() + 6) % 7),
    );
    const weeks: number[] = [];
    for (
      let week = recordedWeeks[0];
      week <= currentWeek.getTime();
      week += 7 * 24 * 60 * 60 * 1000
    ) {
      weeks.push(week);
      if (!cardsByWeek[week]) cardsByWeek[week] = { students: 0, staff: 0 };
    }
    return {
      labels: weeks.map((week) => new Date(week).toLocaleDateString()),
      datasets: [
        {
          label: 'Students gave staff cards',
          data: weeks.map((week) => cardsByWeek[week].students),
          backgroundColor: 'rgba(56, 182, 255, 0.45)',
          borderColor: 'rgba(56, 182, 255, 1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          stack: 'cards',
        },
        {
          label: 'Staff gave staff cards',
          data: weeks.map((week) => cardsByWeek[week].staff),
          backgroundColor: 'rgba(120, 192, 145, 0.45)',
          borderColor: 'rgba(120, 192, 145, 1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          stack: 'cards',
        },
      ],
    };
  }, [cards]);

  if (chartData.labels.length === 0) return null;

  return (
    <div className="mt-8 rounded-lg border border-[var(--blue)] p-4">
      <h2 className="text-xl font-semibold">Staff Cards Given by Week</h2>
      <p className="mb-4 text-sm opacity-80">
        The stacked total shows all staff cards given each week.
      </p>
      <div className="h-80">
        <Line
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { stacked: true },
              y: { beginAtZero: true, stacked: true },
            },
            plugins: {
              tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                  footer: (items) =>
                    `Total: ${items.reduce(
                      (total, item) => total + Number(item.raw),
                      0,
                    )}`,
                },
              },
            },
          }}
        />
      </div>
    </div>
  );
};

// ---- Heatmap: teacher rows x day columns ----
const HeatmapView: React.FC<{
  teachers: TeacherActivity[];
  dayList: string[];
}> = ({ teachers, dayList }) => (
  <div className="overflow-x-auto">
    <table className="border-collapse">
      <thead>
        <tr>
          <th className="sticky left-0 bg-[var(--blue)] text-white px-2 py-1 text-left">
            Teacher
          </th>
          {dayList.map((day) => (
            <th
              key={day}
              className="px-1 text-xs whitespace-nowrap"
              style={{ writingMode: 'vertical-rl' }}
            >
              {day.slice(5)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {teachers.map((teacher) => (
          <tr key={teacher.id}>
            <td className="sticky left-0 bg-[var(--backgroundColor)] text-[var(--textColor)] px-2 py-1 whitespace-nowrap border border-gray-200">
              {teacher.name}
            </td>
            {dayList.map((day) => {
              const count = teacher.days[day] || 0;
              return (
                <td
                  key={day}
                  title={`${teacher.name} — ${day}: ${count} card${
                    count === 1 ? '' : 's'
                  }`}
                  className="w-6 h-6 border border-gray-200 text-center text-xs"
                  style={{ backgroundColor: heatColor(count) }}
                >
                  {count || ''}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ---- Table: per-teacher summary, sortable ----
const TableView: React.FC<{ teachers: TeacherActivity[] }> = ({ teachers }) => {
  const rows = useMemo(
    () =>
      teachers.map((t) => {
        const dayKeys = Object.keys(t.days).sort();
        const activeWeeks = new Set(
          dayKeys.map((day) => {
            const date = new Date(`${day}T12:00:00`);
            date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
            return dayKey(date);
          }),
        ).size;
        return {
          name: t.name,
          activeDays: dayKeys.length,
          activeWeeks,
          totalCards: t.total,
          lastEntry: dayKeys.length ? dayKeys[dayKeys.length - 1] : '',
        };
      }),
    [teachers],
  );

  const columns = useMemo(
    () => [
      { Header: 'Teacher', accessor: 'name' },
      { Header: 'Days With Entries', accessor: 'activeDays' },
      { Header: 'Weeks With Entries', accessor: 'activeWeeks' },
      { Header: 'Total Cards', accessor: 'totalCards' },
      { Header: 'Last Entry', accessor: 'lastEntry' },
    ],
    [],
  );

  return (
    <div>
      <p className="mb-3 text-sm opacity-80">
        Compare how often each giver recorded cards and when they were last
        active. Select a column heading to sort the table.
      </p>
      <Table columns={columns} data={rows} searchColumn="name" />
    </div>
  );
};

// ---- Month calendar for a single selected teacher ----
const CalendarView: React.FC<{
  teachers: TeacherActivity[];
  startDate: Date;
  endDate: Date;
}> = ({ teachers, startDate, endDate }) => {
  const [teacherId, setTeacherId] = useState<string>(teachers[0]?.id || '');
  const [cursor, setCursor] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const teacher =
    teachers.find((t) => t.id === teacherId) || teachers[0];

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const monthLabel = cursor.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });
  const previousMonth = new Date(year, month - 1, 1);
  const nextMonth = new Date(year, month + 1, 1);
  const firstAvailableMonth = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    1,
  );
  const lastAvailableMonth = new Date(
    endDate.getFullYear(),
    endDate.getMonth(),
    1,
  );

  return (
    <div>
      <p className="mb-3 text-sm opacity-80">
        Select a giver to see how many cards were recorded on each day. Darker
        days contain more cards.
      </p>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <select
          value={teacher?.id}
          onChange={(e) => setTeacherId(e.target.value)}
          className="text-black rounded px-2 py-1"
        >
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCursor(previousMonth)}
            disabled={previousMonth < firstAvailableMonth}
            className="px-3 py-1 rounded bg-[var(--blueTrans)] text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            ‹
          </button>
          <span className="min-w-[10rem] text-center font-semibold">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={() => setCursor(nextMonth)}
            disabled={nextMonth > lastAvailableMonth}
            className="px-3 py-1 rounded bg-[var(--blueTrans)] text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 max-w-3xl">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center font-semibold text-sm">
            {d}
          </div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />;
          const count = teacher?.days[dayKey(date)] || 0;
          return (
            <div
              key={dayKey(date)}
              className="h-16 rounded border border-gray-200 p-1 flex flex-col justify-between"
              style={{ backgroundColor: heatColor(count) }}
            >
              <span className="text-xs">{date.getDate()}</span>
              {count > 0 && (
                <span className="text-sm font-bold self-end">{count}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---- Month calendar across all teachers: per-day count of active givers ----
const MonthOverviewView: React.FC<{
  teachers: TeacherActivity[];
  startDate: Date;
  endDate: Date;
}> = ({ teachers, startDate, endDate }) => {
  const [cursor, setCursor] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const monthLabel = cursor.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });
  const previousMonth = new Date(year, month - 1, 1);
  const nextMonth = new Date(year, month + 1, 1);
  const firstAvailableMonth = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    1,
  );
  const lastAvailableMonth = new Date(
    endDate.getFullYear(),
    endDate.getMonth(),
    1,
  );

  // For a given day, list the givers associated with at least one card.
  const teachersForDay = (date: Date): string[] =>
    teachers
      .filter((t) => (t.days[dayKey(date)] || 0) > 0)
      .map((t) => t.name);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCursor(previousMonth)}
            disabled={previousMonth < firstAvailableMonth}
            className="px-3 py-1 rounded bg-[var(--blueTrans)] text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            ‹
          </button>
          <span className="min-w-[10rem] text-center font-semibold">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={() => setCursor(nextMonth)}
            disabled={nextMonth > lastAvailableMonth}
            className="px-3 py-1 rounded bg-[var(--blueTrans)] text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            ›
          </button>
        </div>
        <span className="opacity-80 text-sm">
          Each day shows how many givers recorded cards. Hover a day to see who.
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1 max-w-3xl">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center font-semibold text-sm">
            {d}
          </div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />;
          const names = teachersForDay(date);
          const count = names.length;
          return (
            <div
              key={dayKey(date)}
              className="group relative h-16 rounded border border-gray-200 p-1 flex flex-col justify-between"
              style={{ backgroundColor: heatColor(count) }}
            >
              <span className="text-xs">{date.getDate()}</span>
              {count > 0 && (
                <span className="text-sm font-bold self-end">{count}</span>
              )}
              {count > 0 && (
                <div className="pointer-events-none absolute z-20 left-1/2 top-full mt-1 -translate-x-1/2 hidden group-hover:block w-max max-w-xs rounded border border-[var(--blue)] bg-[var(--backgroundColor)] text-[var(--textColor)] shadow-lg p-2 text-left">
                  <p className="font-semibold text-xs mb-1">
                    {dayKey(date)} — {count} teacher{count === 1 ? '' : 's'}
                  </p>
                  <ul className="text-xs list-disc pl-4 space-y-0.5">
                    {names.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PbisStats;
