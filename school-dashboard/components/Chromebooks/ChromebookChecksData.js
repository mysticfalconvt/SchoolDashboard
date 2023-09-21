import React, { useMemo, useState } from "react";
import { ChromeBookCheckMessageOptions } from "./ChromebookCheck";
import ChromebookCheckRow from "./ChromebookCheckRow";
import TeacherChromebookData from "./TeacherChromebookData";

const getColorFromMessage = (message) => {
  if (message === ChromeBookCheckMessageOptions[1]) return "green";
  if (message === ChromeBookCheckMessageOptions[2]) return "green";
  if (message === ChromeBookCheckMessageOptions[3]) return "yellow";
  if (message === ChromeBookCheckMessageOptions[4]) return "red";
  if (message === ChromeBookCheckMessageOptions[5]) return "red";
  if (message === ChromeBookCheckMessageOptions[6]) return "red";
  return "blue";
};

const ChromebookMessageLegend = () => {
  return (
    <div style={{ display: "flex", flexDirection: "row", gap: "1rem" }}>
      <div
        style={{
          backgroundColor: getColorFromMessage(
            ChromeBookCheckMessageOptions[1]
          ),
          width: "100px",
          height: "100px",
          textAlign: "center",
          borderRadius: "5px",
        }}
      >
        {ChromeBookCheckMessageOptions[1]}
      </div>
      <div
        style={{
          backgroundColor: getColorFromMessage(
            ChromeBookCheckMessageOptions[2]
          ),
          width: "100px",
          height: "100px",
          textAlign: "center",
          borderRadius: "5px",
        }}
      >
        {ChromeBookCheckMessageOptions[2]}
      </div>
      <div
        style={{
          backgroundColor: getColorFromMessage(
            ChromeBookCheckMessageOptions[3]
          ),
          width: "100px",
          height: "100px",
          textAlign: "center",
          borderRadius: "5px",
        }}
      >
        {ChromeBookCheckMessageOptions[3]}
      </div>
      <div
        style={{
          backgroundColor: getColorFromMessage(
            ChromeBookCheckMessageOptions[4]
          ),
          width: "100px",
          height: "100px",
          textAlign: "center",
          borderRadius: "5px",
        }}
      >
        {ChromeBookCheckMessageOptions[4]}
      </div>
      <div
        style={{
          backgroundColor: getColorFromMessage(
            ChromeBookCheckMessageOptions[5]
          ),
          width: "100px",
          height: "100px",
          textAlign: "center",
          borderRadius: "5px",
        }}
      >
        {ChromeBookCheckMessageOptions[5]}
      </div>
      <div
        style={{
          backgroundColor: getColorFromMessage(
            ChromeBookCheckMessageOptions[6]
          ),
          width: "100px",
          height: "100px",
          textAlign: "center",
          borderRadius: "5px",
        }}
      >
        {ChromeBookCheckMessageOptions[6]}
      </div>
      <div
        style={{
          backgroundColor: getColorFromMessage(
            ChromeBookCheckMessageOptions[7]
          ),
          width: "100px",
          height: "100px",
          textAlign: "center",
          borderRadius: "5px",
        }}
      >
        {ChromeBookCheckMessageOptions[7]}
      </div>
    </div>
  );
};

export default function ChromebookChecksData({ assignments }) {
  const [displayGreen, setDisplayGreen] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [showRecent, setShowRecent] = useState(false);
  const assignmentsSortedByTeacher = useMemo(() => {
    if (!assignments) return [];
    return assignments
      .sort((a, b) => {
        // sort by teacher name and then by number
        if (a.teacher.name < b.teacher.name) return -1;
        if (a.teacher.name > b.teacher.name) return 1;
        if (a.number < b.number) return -1;
        if (a.number > b.number) return 1;

        return 0;
      })
      .filter((assignment) => assignment.checkLog.length > 0);
  }, [assignments]);

  const checksToShow = useMemo(() => {
    let checksToShow = assignmentsSortedByTeacher
      // filter out checks that are green status
      .map((assignment) => {
        const { teacher, student, number, checkLog } = assignment;
        if (!teacher || !student || !number || !checkLog) return null;
        return {
          ...assignment,
          checkLog: checkLog.filter((check) => {
            if (displayGreen) return true;
            if (check.message === ChromeBookCheckMessageOptions[1])
              return false;
            if (check.message === ChromeBookCheckMessageOptions[2])
              return false;
            return true;
          }),
        };
      })
      // filter checks that are more than 7 days old
      .map((assignment) => {
        if (!assignment) return null;
        const { teacher, student, number, checkLog } = assignment;
        if (!teacher || !student || !number || !checkLog) return null;
        return {
          ...assignment,
          checkLog: checkLog.filter((check) => {
            if (showRecent) {
              const tenDaysAgo = new Date();
              tenDaysAgo.setDate(tenDaysAgo.getDate() - 7);
              const checkDate = new Date(check.time);
              return checkDate > tenDaysAgo;
            }
            return true;
          }),
        };
      })
      .filter((assignment) =>
        assignment?.student?.name
          .toLowerCase()
          .includes(filterText.toLowerCase())
      )
      .filter((assignment) => !!assignment);

    return checksToShow;
  }, [assignmentsSortedByTeacher, displayGreen, filterText, showRecent]);

  return (
    <div>
      <h2>Chromebook Checks</h2>
      <div className="flex justify-start gap-8 items-center my-4">
        <label class="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            value={displayGreen}
            class="sr-only peer"
            onChange={() => setDisplayGreen(!displayGreen)}
          />
          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          <span class="ml-3 text-lg font-medium text-gray-900 dark:text-gray-300">
            Show Green Checks
          </span>
        </label>
        <label class="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            value={showRecent}
            class="sr-only peer"
            onChange={() => setShowRecent(!showRecent)}
          />
          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          <span class="ml-3 text-lg font-medium text-gray-900 dark:text-gray-300">
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
        <TeacherChromebookData
          chromebookAssignments={assignmentsSortedByTeacher}
        />
      </div>
      <ChromebookMessageLegend />
      <table className="table-auto border-collapse border border-slate-500 border-spacing-2 border-spacing-x-2 border-spacing-y-2 mt-2">
        {checksToShow.map((assignment) => (
          <ChromebookCheckRow key={assignment.id} assignment={assignment} />
        ))}
      </table>
    </div>
  );
}
