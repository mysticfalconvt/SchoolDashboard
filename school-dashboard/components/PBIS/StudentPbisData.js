import React from "react";

export default function StudentPbisData({ student }) {
  // console.log(student);
  return (
    <div style={{ display: "flex", gap: "20px" }}>
      <p>PBIS Cards this week: {student.PbisCardCount}</p>
      <p>Total PBIS Cards for the year: {student.YearPbisCount}</p>
    </div>
  );
}
