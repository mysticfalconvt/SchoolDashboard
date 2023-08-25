import { useState } from "react";
import GradientButton from "../styles/Button";
import styled from "styled-components";
import totalsFromArray from "../../lib/totalsFromArray";
import {
  classTypeList,
  locationList,
  othersInvolvedList,
  studentConductList,
  teacherActionList,
  timeOfDayList,
} from "../../lib/disciplineData";
import totalsTrueInArray from "../../lib/totalsTrueInArray";
import { getDayTotals } from "./DisciplineCharts";

const DisciplineExtraDetailsModal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: var(--backgroundColor);
  z-index: 1000;
  width: 100vw;
  max-width: 1000px; !important;
  height: 80vh;
  border-radius: 10px;

  padding: 20px;
  box-shadow: 0 0 10px 3px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;

  h3 {
    margin: 0;
    text-align: center;
    border-bottom: 1px solid var(--red);
  }
  p {
    margin: 0;
    text-align: left;
  }

`;

export default function DisciplineExtraDetails({ disciplines }) {
  const [showModal, setShowModal] = useState(false);
  const [showCounts, setShowCounts] = useState(false);
  const totalDisciplines = disciplines.length;
  const listOfStudentsWithoutDuplicates = disciplines
    .map((discipline) => {
      const student = {
        id: discipline.student.id,
        name: discipline.student.name,
        totalDisciplines: disciplines.filter(
          (d) => d.student.id === discipline.student.id
        ).length,
      };
      return student;
    })
    .filter((student, index, self) => {
      return index === self.findIndex((s) => s.id === student.id);
    })
    .sort((a, b) => b.totalDisciplines - a.totalDisciplines);

  const listOfTeachersWithoutDuplicates = disciplines
    .map((discipline) => {
      const teacher = {
        id: discipline.teacher.id,
        name: discipline.teacher.name,
        totalDisciplines: disciplines.filter(
          (d) => d.teacher.id === discipline.teacher.id
        ).length,
      };
      return teacher;
    })
    .filter((teacher, index, self) => {
      return index === self.findIndex((t) => t.id === teacher.id);
    })
    .sort((a, b) => b.totalDisciplines - a.totalDisciplines);

  const classList = classTypeList;
  const totalPerClass = totalsFromArray(
    classList,
    "classType",
    disciplines
  ).sort((a, b) => b.total - a.total);
  const locations = totalsFromArray(locationList, "location", disciplines).sort(
    (a, b) => b.total - a.total
  );
  const times = totalsFromArray(timeOfDayList, "timeOfDay", disciplines).sort(
    (a, b) => b.total - a.total
  );
  const conducts = totalsTrueInArray(studentConductList, disciplines).sort(
    (a, b) => b.totals - a.totals
  );
  const teacherActions = totalsTrueInArray(teacherActionList, disciplines).sort(
    (a, b) => b.totals - a.totals
  );
  const others = totalsTrueInArray(othersInvolvedList, disciplines).sort(
    (a, b) => b.totals - a.totals
  );
  const dates = getDayTotals(disciplines).sort((a, b) => b.total - a.total);

  return (
    <>
      <GradientButton onClick={() => setShowModal(!showModal)}>
        {showModal ? "Hide" : "Extra Details"}
      </GradientButton>

      {showModal && (
        <DisciplineExtraDetailsModal>
          <h2>
            Extra Details
            <GradientButton
              onClick={() => setShowModal(!showModal)}
              style={{ marginLeft: "20px" }}
            >
              Hide
            </GradientButton>
            <GradientButton
              onClick={() => setShowCounts(!showCounts)}
              style={{ marginLeft: "20px" }}
            >
              {!showCounts ? "Show Details" : "Show Counts"}
            </GradientButton>
          </h2>
          <h3 style={{ textAlign: "center" }}>Total: {totalDisciplines}</h3>
          <div
            style={{
              display: "flex",
              overflowY: "scroll",
              justifyContent: "space-around",
            }}
          >
            {!showCounts ? (
              <>
                <div>
                  <h3>Students</h3>
                  <ul>
                    {listOfStudentsWithoutDuplicates.map((student) => (
                      <li key={student.id}>
                        {student.name} - {student.totalDisciplines}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>Teachers</h3>
                  <ul>
                    {listOfTeachersWithoutDuplicates.map((teacher) => (
                      <li key={teacher.id}>
                        {teacher.name} - {teacher.totalDisciplines}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <div>
                <h3>Per class</h3>
                {totalPerClass.map((classType) => (
                  <p key={classType.classType}>
                    {classType.word} - {classType.total}
                  </p>
                ))}
                <h3>Per Location</h3>
                {locations.map((location) => (
                  <p key={location.location}>
                    {location.word} - {location.total}
                  </p>
                ))}
                <h3>Per Time</h3>
                {times.map((time) => (
                  <p key={time.timeOfDay}>
                    {time.word} - {time.total}
                  </p>
                ))}
                <h3>Per Conduct</h3>
                {conducts.map((conduct) => (
                  <p key={conduct.word}>
                    {conduct.item} - {conduct.totals}
                  </p>
                ))}
                <h3>Per Teacher Action</h3>
                {teacherActions.map((teacherAction) => (
                  <p key={teacherAction.word}>
                    {teacherAction.item} - {teacherAction.totals}
                  </p>
                ))}
                <h3>Per Others Involved</h3>
                {others.map((other) => (
                  <p key={other.word}>
                    {other.item} - {other.totals}
                  </p>
                ))}
                <h3>Per Day</h3>
                {dates.map((date) => (
                  <p key={date.date}>
                    {date.word} - {date.total}
                  </p>
                ))}
              </div>
            )}
          </div>
        </DisciplineExtraDetailsModal>
      )}
    </>
  );
}
