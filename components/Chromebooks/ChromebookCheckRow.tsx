// Two-state model: green when 'Everything good', otherwise red. Keep basic legacy support.

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
  if (message === 'Everything good') return 'green';
  if (message.startsWith('As Issued')) return 'green';
  if (message.startsWith('Same as previous week')) return 'green';
  if (message === 'Out for Service' || message === 'Not in Cart')
    return 'orange';
  return 'red';
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
