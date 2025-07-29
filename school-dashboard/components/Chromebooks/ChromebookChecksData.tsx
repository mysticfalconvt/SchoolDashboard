import { useMemo, useState } from 'react';
import { ChromeBookCheckMessageOptions } from './ChromebookCheck';
import ChromebookCheckRow from './ChromebookCheckRow';
import TeacherChromebookData from './TeacherChromebookData';

interface Teacher {
  id: string;
  name: string;
  taStudents: any[];
}

interface Student {
  id: string;
  name: string;
  chromebookCheck: ChromebookCheck[];
}

interface ChromebookCheck {
  id: string;
  message: string;
  time: string;
}

interface ChromebookAssignment {
  id: string;
  student: Student;
  teacher: Teacher;
  checkLog: ChromebookCheck[];
  number: number;
}

interface ChromebookChecksDataProps {
  taTeachers: Teacher[];
}

const getColorFromMessage = (message: string): string => {
  if (
    message.startsWith(ChromeBookCheckMessageOptions[1]) ||
    message === ChromeBookCheckMessageOptions[1]
  )
    return 'green';
  if (
    message.startsWith(ChromeBookCheckMessageOptions[2]) ||
    message === ChromeBookCheckMessageOptions[2]
  )
    return 'green';
  if (
    message.startsWith(ChromeBookCheckMessageOptions[3]) ||
    message === ChromeBookCheckMessageOptions[3]
  )
    return 'yellow';
  if (
    message.startsWith(ChromeBookCheckMessageOptions[4]) ||
    message === ChromeBookCheckMessageOptions[4]
  )
    return 'red';
  if (
    message.startsWith(ChromeBookCheckMessageOptions[5]) ||
    message === ChromeBookCheckMessageOptions[5]
  )
    return 'red';
  if (
    message.startsWith(ChromeBookCheckMessageOptions[6]) ||
    message === ChromeBookCheckMessageOptions[6]
  )
    return 'red';
  return 'blue';
};

const ChromebookMessageLegend = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
      <div
        style={{
          backgroundColor: getColorFromMessage(
            ChromeBookCheckMessageOptions[1],
          ),
          width: '100px',
          height: '100px',
          textAlign: 'center',
          borderRadius: '5px',
        }}
      >
        {ChromeBookCheckMessageOptions[1]}
      </div>
      <div
        style={{
          backgroundColor: getColorFromMessage(
            ChromeBookCheckMessageOptions[2],
          ),
          width: '100px',
          height: '100px',
          textAlign: 'center',
          borderRadius: '5px',
        }}
      >
        {ChromeBookCheckMessageOptions[2]}
      </div>
      <div
        style={{
          backgroundColor: getColorFromMessage(
            ChromeBookCheckMessageOptions[3],
          ),
          width: '100px',
          height: '100px',
          textAlign: 'center',
          borderRadius: '5px',
        }}
      >
        {ChromeBookCheckMessageOptions[3]}
      </div>
      <div
        style={{
          backgroundColor: getColorFromMessage(
            ChromeBookCheckMessageOptions[4],
          ),
          width: '100px',
          height: '100px',
          textAlign: 'center',
          borderRadius: '5px',
        }}
      >
        {ChromeBookCheckMessageOptions[4]}
      </div>
      <div
        style={{
          backgroundColor: getColorFromMessage(
            ChromeBookCheckMessageOptions[5],
          ),
          width: '100px',
          height: '100px',
          textAlign: 'center',
          borderRadius: '5px',
        }}
      >
        {ChromeBookCheckMessageOptions[5]}
      </div>
      <div
        style={{
          backgroundColor: getColorFromMessage(
            ChromeBookCheckMessageOptions[6],
          ),
          width: '100px',
          height: '100px',
          textAlign: 'center',
          borderRadius: '5px',
        }}
      >
        {ChromeBookCheckMessageOptions[6]}
      </div>
      <div
        style={{
          backgroundColor: getColorFromMessage(
            ChromeBookCheckMessageOptions[7],
          ),
          width: '100px',
          height: '100px',
          textAlign: 'center',
          borderRadius: '5px',
        }}
      >
        {ChromeBookCheckMessageOptions[7]}
      </div>
    </div>
  );
};

export default function ChromebookChecksData({
  taTeachers,
}: ChromebookChecksDataProps) {
  const [displayGreen, setDisplayGreen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [showRecent, setShowRecent] = useState(false);

  const checksToShow = useMemo(() => {
    let checksToShow: ChromebookAssignment[] = [];
    taTeachers
      // filter out checks that are green status
      .forEach((teacher) => {
        teacher.taStudents.forEach((student) => {
          const checkLog = student.chromebookCheck
            .filter((check) => {
              if (displayGreen) return true;
              if (getColorFromMessage(check.message) !== 'green') return true;
            })
            // filter out checks that are more than 7 days old
            .filter((check) => {
              if (!showRecent) return true;
              const checkDate = new Date(check.time);
              const now = new Date();
              const diffTime = Math.abs(now.getTime() - checkDate.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (diffDays < 7) return true;
            });
          const check: ChromebookAssignment = {
            id: student.id,
            student: student,
            teacher: teacher,
            checkLog: checkLog,
            number: checkLog.length,
          };
          checksToShow.push(check);
        });
      });

    if (filterText) {
      checksToShow = checksToShow.filter((check) => {
        return (
          check.student.name.toLowerCase().includes(filterText.toLowerCase()) ||
          check.teacher.name.toLowerCase().includes(filterText.toLowerCase())
        );
      });
    }

    return checksToShow;
  }, [taTeachers, displayGreen, showRecent, filterText]);

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
            placeholder="Filter by student name"
            className="border-2 border-gray-400 rounded-md text-gray-800"
          />
        </label>
        <TeacherChromebookData teachers={taTeachers} />
      </div>
      <ChromebookMessageLegend />
      <table className="table-auto border-collapse border border-slate-500 border-spacing-2 border-spacing-x-2 border-spacing-y-2 mt-2">
        {checksToShow.map((assignment) => (
          <ChromebookCheckRow
            key={assignment.student.id}
            assignment={assignment as any}
            showGreens={displayGreen}
          />
        ))}
      </table>
    </div>
  );
}
