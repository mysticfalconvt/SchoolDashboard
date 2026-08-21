import { useMemo, useState } from 'react';
import ChromebookCheckRow from './ChromebookCheckRow';
import TeacherChromebookData from './TeacherChromebookData';

interface Person {
  id: string;
  name: string;
}

export interface ChromebookCheck {
  id: string;
  message: string;
  time: string;
  student: Person | null;
  classroom: Person | null;
}

interface ChromebookCheckGroup {
  id: string;
  student: Person;
  classroom: Person;
  checkLog: ChromebookCheck[];
  number: number;
}

interface ChromebookChecksDataProps {
  checks: ChromebookCheck[];
}

// Checks recorded before classrooms existed have no classroom attached.
export const NO_CLASSROOM: Person = { id: 'no-classroom', name: 'No Classroom' };
// Spare / unassigned chromebooks are checked without a student
export const NO_STUDENT: Person = { id: 'no-student', name: 'No Student' };

export const getColorFromMessage = (message: string): string => {
  // New model
  if (message === 'Everything good') return 'green';
  // Backwards compatibility with legacy "good" values
  if (message.startsWith('As Issued')) return 'green';
  if (message.startsWith('Same as previous week')) return 'green';
  // Orange for status-only options
  if (message === 'Out for Service' || message === 'Not in Cart')
    return 'orange';
  // All other messages indicate an issue
  return 'red';
};

const ChromebookMessageLegend = () => {
  const legendItems = [
    'Everything good',
    'Something wrong',
    'Out for Service',
    'Not in Cart',
  ];

  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
        Status Legend
      </h3>
      <div className="flex flex-wrap gap-3">
        {legendItems.map((item) => (
          <div
            key={item}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 shadow-sm"
            style={{
              borderColor: getColorFromMessage(item),
              backgroundColor: `${getColorFromMessage(item)}20`,
            }}
          >
            <div
              className="w-4 h-4 rounded-full border-2"
              style={{
                backgroundColor: getColorFromMessage(item),
                borderColor: getColorFromMessage(item),
              }}
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function ChromebookChecksData({
  checks,
}: ChromebookChecksDataProps) {
  const [displayGreen, setDisplayGreen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [showRecent, setShowRecent] = useState(true);

  const checksToShow = useMemo(() => {
    // One row per classroom/student pair, since a student's chromebook can be
    // checked in more than one teacher's room.
    const groups = new Map<string, ChromebookCheckGroup>();

    (checks || [])
      .filter((check) => {
        if (displayGreen) return true;
        return getColorFromMessage(check.message) !== 'green';
      })
      // filter out checks that are more than 7 days old
      .filter((check) => {
        if (!showRecent) return true;
        const checkDate = new Date(check.time);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - checkDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays < 7;
      })
      .forEach((check) => {
        const classroom = check.classroom ?? NO_CLASSROOM;
        const student = check.student ?? NO_STUDENT;
        const key = `${classroom.id}-${student.id}`;
        const existing = groups.get(key);
        if (existing) {
          existing.checkLog.push(check);
          existing.number = existing.checkLog.length;
          return;
        }
        groups.set(key, {
          id: key,
          student,
          classroom,
          checkLog: [check],
          number: 1,
        });
      });

    let groupsToShow = Array.from(groups.values());

    if (filterText) {
      const search = filterText.toLowerCase();
      groupsToShow = groupsToShow.filter(
        (group) =>
          group.student.name.toLowerCase().includes(search) ||
          group.classroom.name.toLowerCase().includes(search),
      );
    }

    return groupsToShow;
  }, [checks, displayGreen, showRecent, filterText]);

  return (
    <div>
      <h2>Chromebook Checks</h2>
      <div className="flex justify-start gap-8 items-center my-4">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={displayGreen}
            className="sr-only peer"
            onChange={() => setDisplayGreen(!displayGreen)}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          <span className="ml-3 text-lg font-medium text-gray-900 dark:text-gray-300">
            Show Green Checks
          </span>
        </label>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={showRecent}
            className="sr-only peer"
            onChange={() => setShowRecent(!showRecent)}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          <span className="ml-3 text-lg font-medium text-gray-900 dark:text-gray-300">
            Show only last 7 days
          </span>
        </label>
        <label>
          <input
            type="text"
            onChange={(e) => setFilterText(e.target.value)}
            value={filterText}
            placeholder="Filter by student or classroom"
            className="border-2 border-gray-400 rounded-md text-gray-800"
          />
        </label>
        <TeacherChromebookData checks={checks} />
      </div>
      <ChromebookMessageLegend />
      <table className="table-auto border-collapse border border-slate-500 border-spacing-2 border-spacing-x-2 border-spacing-y-2 mt-2">
        <tbody>
          {checksToShow.map((group) => (
            <ChromebookCheckRow
              key={group.id}
              classroom={group.classroom}
              student={group.student}
              number={group.number}
              checkLog={group.checkLog}
              showGreens={displayGreen}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
