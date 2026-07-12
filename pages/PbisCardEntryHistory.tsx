import gql from 'graphql-tag';
import { NextPage } from 'next';
import React, { useMemo, useState } from 'react';
import Loading from '../components/Loading';
import Table from '../components/Table';
import { useUser } from '../components/User';
import isAllowed from '../lib/isAllowed';
import { useGQLQuery } from '../lib/useGqlQuery';

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

interface CardEntry {
  id: string;
  dateGiven: string;
  teacher?: { id: string; name: string } | null;
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

// Shade a heatmap cell by how many cards were entered that day
function heatColor(count: number): string {
  if (!count) return 'transparent';
  if (count <= 2) return 'rgba(59, 130, 246, 0.25)';
  if (count <= 5) return 'rgba(59, 130, 246, 0.45)';
  if (count <= 10) return 'rgba(59, 130, 246, 0.7)';
  return 'rgba(59, 130, 246, 1)';
}

type TabKey = 'heatmap' | 'table' | 'calendar' | 'overview';

const PbisCardEntryHistory: NextPage = () => {
  const me = useUser();

  const [tab, setTab] = useState<TabKey>('overview');

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

  const { data, isLoading } = useGQLQuery(
    'pbisCardEntries',
    PBIS_CARD_ENTRIES_QUERY,
    variables,
    { enabled: !!me && (isAllowed(me, 'canManagePbis') || isAllowed(me, 'isSuperAdmin')) },
  );

  // Aggregate cards into per-teacher per-day activity
  const { teachers, dayList } = useMemo(() => {
    const cards: CardEntry[] = data?.pbisCards || [];
    const byTeacher: Record<string, TeacherActivity> = {};
    const daysSeen = new Set<string>();

    cards.forEach((card) => {
      if (!card.teacher) return;
      const key = dayKey(new Date(card.dateGiven));
      daysSeen.add(key);
      const t =
        byTeacher[card.teacher.id] ||
        (byTeacher[card.teacher.id] = {
          id: card.teacher.id,
          name: card.teacher.name,
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
  if (!isAllowed(me, 'canManagePbis') && !isAllowed(me, 'isSuperAdmin')) {
    return (
      <div className="text-center m-8">
        <h2>You are not authorized to view this page.</h2>
      </div>
    );
  }

  return (
    <div className="m-4">
      <h1>PBIS Card Entry History</h1>
      <p className="opacity-80">
        Days that teachers entered PBIS cards, over the last 12 months.
      </p>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--blue)] mb-4">
        {(
          [
            ['overview', 'Month Overview'],
            ['heatmap', 'Heatmap'],
            ['table', 'Table'],
            ['calendar', 'Month Calendar'],
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

      {isLoading && <Loading />}
      {!isLoading && teachers.length === 0 && (
        <p>No cards were entered in this date range.</p>
      )}

      {!isLoading && teachers.length > 0 && (
        <>
          {tab === 'heatmap' && (
            <HeatmapView teachers={teachers} dayList={dayList} />
          )}
          {tab === 'table' && (
            <TableView teachers={teachers} dayList={dayList} />
          )}
          {tab === 'calendar' && <CalendarView teachers={teachers} />}
          {tab === 'overview' && <MonthOverviewView teachers={teachers} />}
        </>
      )}
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
const TableView: React.FC<{
  teachers: TeacherActivity[];
  dayList: string[];
}> = ({ teachers, dayList }) => {
  // Weeks in the period, from the first to the last card given (min 1 week).
  const weeks = useMemo(() => {
    if (dayList.length === 0) return 1;
    const first = new Date(dayList[0]).getTime();
    const last = new Date(dayList[dayList.length - 1]).getTime();
    return Math.max(1, (last - first) / (7 * 24 * 60 * 60 * 1000));
  }, [dayList]);

  const rows = useMemo(
    () =>
      teachers.map((t) => {
        const dayKeys = Object.keys(t.days).sort();
        return {
          name: t.name,
          activeDays: dayKeys.length,
          totalCards: t.total,
          avgPerWeek: Math.round((t.total / weeks) * 10) / 10,
          lastEntry: dayKeys.length ? dayKeys[dayKeys.length - 1] : '',
        };
      }),
    [teachers, weeks],
  );

  const columns = useMemo(
    () => [
      { Header: 'Teacher', accessor: 'name' },
      { Header: 'Days With Entries', accessor: 'activeDays' },
      { Header: 'Total Cards', accessor: 'totalCards' },
      { Header: 'Avg Cards / Week', accessor: 'avgPerWeek' },
      { Header: 'Last Entry', accessor: 'lastEntry' },
    ],
    [],
  );

  return <Table columns={columns} data={rows} searchColumn="name" />;
};

// ---- Month calendar for a single selected teacher ----
const CalendarView: React.FC<{ teachers: TeacherActivity[] }> = ({
  teachers,
}) => {
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

  return (
    <div>
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
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="px-3 py-1 rounded bg-[var(--blueTrans)] text-white"
          >
            ‹
          </button>
          <span className="min-w-[10rem] text-center font-semibold">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="px-3 py-1 rounded bg-[var(--blueTrans)] text-white"
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

// ---- Month calendar across ALL teachers: per-day count of who entered ----
const MonthOverviewView: React.FC<{ teachers: TeacherActivity[] }> = ({
  teachers,
}) => {
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

  // For a given day, the names of teachers who entered at least one card
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
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="px-3 py-1 rounded bg-[var(--blueTrans)] text-white"
          >
            ‹
          </button>
          <span className="min-w-[10rem] text-center font-semibold">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="px-3 py-1 rounded bg-[var(--blueTrans)] text-white"
          >
            ›
          </button>
        </div>
        <span className="opacity-80 text-sm">
          Each day shows how many teachers entered cards. Hover a day to see who.
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

export default PbisCardEntryHistory;
