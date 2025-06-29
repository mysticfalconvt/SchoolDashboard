import React, { useState } from "react";
import { useUser } from "../components/User";
import isAllowed from "../lib/isAllowed";
import { useGQLQuery } from "../lib/useGqlQuery";
import Loading from "../components/Loading";
import GradientButton from "../components/styles/Button";
import gql from "graphql-tag";
import { getAverageYearlyPbis } from "../pages/PbisDataTable";
import { ADMIN_ID } from "../config";

const PBIS_STUDENTS_OF_INTEREST_QUERY = gql`
  query PBIS_STUDENTS_OF_INTEREST_QUERY {
    students: users(where: { isStudent: { equals: true } }) {
      id
      name
      YearPbisCount: studentPbisCardsCount
      studentPbisCards(orderBy: { dateGiven: desc }, take: 1) {
        id
        dateGiven
      }
      taTeacher {
        id
        name
      }
    }
  }
`;

export default function StudentsOfInterestPBIS() {
  const me = useUser();
  const [numberOfStudentsToDisplay, setNumberOfStudentsToDisplay] =
    useState(10);
  const { data, isLoading } = useGQLQuery(
    "pbis students of interest",
    PBIS_STUDENTS_OF_INTEREST_QUERY,
    {},
    {
      enabled: !!me,
      staleTime: 1000 * 60 * 3, // 3 minutes
    }
  );
  const studentsWithTaTeacher = data?.students.filter(
    (student) => student.taTeacher && student.taTeacher.id !== ADMIN_ID
  );

  if (isLoading) return <Loading />;
  if (!isAllowed(me, "isStaff")) return "invalid user";
  const averageCards = Math.round(getAverageYearlyPbis(studentsWithTaTeacher));

  const topStudents = studentsWithTaTeacher
    .sort((a, b) => {
      return b.YearPbisCount - a.YearPbisCount;
    })
    .slice(0, numberOfStudentsToDisplay);

  const bottomStudents = studentsWithTaTeacher
    .sort((a, b) => {
      return a.YearPbisCount - b.YearPbisCount;
    })
    .slice(0, numberOfStudentsToDisplay);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <h2>PBIS Card Count Students of Interest</h2>
      <h3>Current Average Number Of Cards: {averageCards}/Student</h3>
      <div>
        <label>
          Number of students to display:
          <input
            type="range"
            min="1"
            max="25"
            value={numberOfStudentsToDisplay}
            onChange={(e) => setNumberOfStudentsToDisplay(e.target.value)}
          />
          {numberOfStudentsToDisplay}
        </label>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full mt-4">
        <div className="bottom flex flex-col items-center">
          <h3>Bottom {numberOfStudentsToDisplay} Students</h3>
          {bottomStudents.map((student) => {
            const date = new Date(
              student?.studentPbisCards?.[0]?.dateGiven
            ).toLocaleDateString();
            const daysSinceLastCard = Math.round(
              (new Date() -
                new Date(student?.studentPbisCards?.[0]?.dateGiven)) /
              (1000 * 60 * 60 * 24)
            ),
              daysSinceLastCardString =
                daysSinceLastCard > 0
                  ? `${daysSinceLastCard} days ago`
                  : "today";
            return (
              <div className="border-2 border-gray-400 rounded-md flex flex-col items-center justify-center w-full mb-2 p-2" key={student?.id}>
                <p title={student?.taTeacher?.name} className="m-0 p-1">
                  {student?.name} - {student?.YearPbisCount}
                </p>
                <p className="m-0 p-1">TA: {student?.taTeacher?.name}</p>
                <p className="m-0 p-1">
                  Last Card: {date} - {daysSinceLastCardString}
                </p>
              </div>
            );
          })}
        </div>
        <div className="top flex flex-col items-center">
          <h3>Top {numberOfStudentsToDisplay} Students</h3>
          {topStudents.map((student) => {
            const date = new Date(
              student?.studentPbisCards?.[0]?.dateGiven
            ).toLocaleDateString();
            const daysSinceLastCard = Math.round(
              (new Date() -
                new Date(student?.studentPbisCards?.[0]?.dateGiven)) /
              (1000 * 60 * 60 * 24)
            ),
              daysSinceLastCardString =
                daysSinceLastCard > 0
                  ? `${daysSinceLastCard} days ago`
                  : "today";
            return (
              <div className="border-2 border-gray-400 rounded-md flex flex-col items-center justify-center w-full mb-2 p-2" key={student?.id}>
                <p title={student?.taTeacher?.name} className="m-0 p-1">
                  {student?.name} - {student?.YearPbisCount}
                </p>
                <p className="m-0 p-1">TA: {student?.taTeacher?.name}</p>
                <p className="m-0 p-1">
                  Last Card: {date} - {daysSinceLastCardString}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
