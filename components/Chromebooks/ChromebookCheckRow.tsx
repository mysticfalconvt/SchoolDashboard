// Two-state model: green when 'Everything good', otherwise red. Keep basic legacy support.

import { getColorFromMessage } from './ChromebookChecksData';

interface Person {
  id: string;
  name: string;
}

interface CheckLog {
  id: string;
  message: string;
  time: string;
}

interface ChromebookCheckRowProps {
  classroom: Person;
  student: Person;
  number: number;
  checkLog: CheckLog[];
  showGreens: boolean;
}

export default function ChromebookCheckRow({
  classroom,
  student,
  number,
  checkLog,
  showGreens,
}: ChromebookCheckRowProps) {
  if (!classroom || !student || !number || !checkLog.length) return null;
  return (
    <tr className="border-spacing-2">
      <td className="border border-slate-500 border-spacing-2 ">
        {classroom.name}
      </td>

      <td className="border border-slate-500 border-spacing-2">
        {number} - {student.name}
      </td>

      {checkLog.map((check) => {
        const { message, time } = check;
        const date = new Date(time).toLocaleDateString();
        if (getColorFromMessage(message) === 'green' && !showGreens)
          return null;
        return (
          <td
            key={`check-${check.id}`}
            className="w-20 border border-slate-500 border-spacing-5 p-1"
          >
            <div
              className="h-full p-2 rounded-md border-2 flex flex-col justify-between"
              style={{
                borderColor: getColorFromMessage(message),
                backgroundColor: `${getColorFromMessage(message)}10`,
              }}
            >
              <div className="text-md font-medium leading-tight break-words">
                {message}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {date}
              </div>
            </div>
          </td>
        );
      })}
    </tr>
  );
}
