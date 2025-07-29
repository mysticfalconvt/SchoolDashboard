import { ChromeBookCheckMessageOptions } from './ChromebookCheck';

interface Teacher {
  id: string;
  name: string;
}

interface Student {
  id: string;
  name: string;
}

interface CheckLog {
  id: string;
  message: string;
  time: string;
}

interface Assignment {
  id: string;
  teacher: Teacher;
  student: Student;
  number: string;
  checkLog: CheckLog[];
}

interface ChromebookCheckRowProps {
  assignment: Assignment;
  showGreens: boolean;
}

const getColorFromMessage = (message: string): string => {
  if (message.startsWith(ChromeBookCheckMessageOptions[1])) return 'green';
  if (message.startsWith(ChromeBookCheckMessageOptions[2])) return 'green';
  if (message.startsWith(ChromeBookCheckMessageOptions[3])) return 'yellow';
  if (message.startsWith(ChromeBookCheckMessageOptions[4])) return 'red';
  if (message.startsWith(ChromeBookCheckMessageOptions[5])) return 'red';
  if (message.startsWith(ChromeBookCheckMessageOptions[6])) return 'red';
  return 'blue';
};

export default function ChromebookCheckRow({
  assignment,
  showGreens,
}: ChromebookCheckRowProps) {
  const { teacher, student, number, checkLog } = assignment;
  if (!teacher || !student || !number || !checkLog.length) return null;
  return (
    <tr
      key={`assignment-${assignment.student.id}`}
      className="border-spacing-2"
    >
      <td className="border border-slate-500 border-spacing-2 ">
        {teacher?.name}
      </td>

      <td className="border border-slate-500 border-spacing-2">
        {assignment.number} - {student?.name}
      </td>

      {checkLog.map((check) => {
        const { message, time } = check;
        const date = new Date(time).toLocaleDateString();
        if (getColorFromMessage(message) === 'green' && !showGreens)
          return null;
        return (
          <td
            key={`check-${check.id}`}
            className="w-20 rounded-md border border-slate-500 border-spacing-5 "
          >
            <div
              style={{
                borderColor: getColorFromMessage(message),
              }}
              className="text-md m-1 h-full p-1 rounded-md border-2"
            >
              {message} - {date}
            </div>
          </td>
        );
      })}
    </tr>
  );
}
