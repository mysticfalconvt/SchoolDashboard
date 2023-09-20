import React from "react";
import { ChromeBookCheckMessageOptions } from "./ChromebookCheck";

const getColorFromMessage = (message) => {
  if (message === ChromeBookCheckMessageOptions[1]) return "green";
  if (message === ChromeBookCheckMessageOptions[2]) return "green";
  if (message === ChromeBookCheckMessageOptions[3]) return "yellow";
  if (message === ChromeBookCheckMessageOptions[4]) return "red";
  if (message === ChromeBookCheckMessageOptions[5]) return "red";
  if (message === ChromeBookCheckMessageOptions[6]) return "red";
  return "blue";
};

export default function ChromebookCheckRow({ assignment }) {
  const { teacher, student, number, checkLog } = assignment;
  if (!teacher || !student || !number || !checkLog.length) return null;
  return (
    <tr key={`assignment-${assignment.id}`} className="border-spacing-2">
      <td className="border border-slate-500 border-spacing-2 ">
        {teacher?.name}
      </td>

      <td className="border border-slate-500 border-spacing-2">
        {assignment.number} - {student?.name}
      </td>

      {checkLog.map((check) => {
        const { message, time } = check;
        const date = new Date(time).toLocaleDateString();
        return (
          <td
            key={`check-${check.id}`}
            className="w-20 rounded-md border border-slate-500 border-spacing-5 "
          >
            <div
              style={{
                backgroundColor: getColorFromMessage(message),
              }}
              className="text-md m-1 h-full p-1 rounded-md"
            >
              {message} - {date}
            </div>
          </td>
        );
      })}
    </tr>
  );
}
