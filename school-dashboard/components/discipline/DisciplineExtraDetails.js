import { useState } from "react";
import GradientButton from "../styles/Button";
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
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--backgroundColor)] z-[1000] w-screen max-w-[1000px] h-[80vh] rounded-xl p-6 shadow-2xl flex flex-col justify-start items-stretch">
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
          <h3 className="text-center border-b border-[var(--red)]">Total: {totalDisciplines}</h3>
          <div
            className="flex overflow-y-auto justify-around gap-8"
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
        </div>
      )}
    </>
  );
}
