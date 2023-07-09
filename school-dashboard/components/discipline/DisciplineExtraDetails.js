import { useState } from "react";
import GradientButton from "../styles/Button";
import styled from "styled-components";

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
`;

export default function DisciplineExtraDetails({ disciplines }) {
  const [showModal, setShowModal] = useState(false);
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
          </h2>
          <h3 style={{ textAlign: "center" }}>Total: {totalDisciplines}</h3>
          <div
            style={{
              display: "flex",
              overflowY: "scroll",
              justifyContent: "space-around",
            }}
          >
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
          </div>
        </DisciplineExtraDetailsModal>
      )}
    </>
  );
}
