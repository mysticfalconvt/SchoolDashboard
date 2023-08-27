import React, { useMemo } from "react";
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

  return (
    <div>
      <h2>Chromebook Checks</h2>
      <ChromebookMessageLegend />
      <div>
        {assignmentsSortedByTeacher.map((assignment) => {
          const { teacher, student, number, checkLog } = assignment;
          return (
            <div
              key={`assignment-${assignment.id}`}
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "1rem",
                alignItems: "center",
                justifyContent: "flex-start",
              }}
            >
              <h3>{teacher?.name}</h3>

              <h4>
                {assignment.number} - {student?.name}
              </h4>

              {checkLog.map((check) => {
                const { message, time } = check;
                const date = new Date(time).toLocaleDateString();
                return (
                  <div
                    key={`check-${check.id}`}
                    style={{
                      backgroundColor: getColorFromMessage(message),
                      width: "50px",
                      height: "50px",
                      textAlign: "center",
                      borderRadius: "5px",
                    }}
                  >
                    <div style={{ fontSize: "0.8rem", lineHeight: "1rem" }}>
                      {message} - {date}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
