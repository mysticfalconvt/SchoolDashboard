import { useState } from "react";
import styled from "styled-components";
import { SmallGradientButton } from "../styles/Button";

const StudentPickerStyle = styled.div`
  display: flex;
  flex-direction: row;
  /* align-items: flex-start; */
  /* justify-content: center; */
  /* align-items: center; */
  /* width: 50%; */
  /* margin: auto; */
  /* min-width: max-content; */
  display: grid;
  width: 100%;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  h4 {
    margin-bottom: 0;
    font-size: medium;
    color: #3f3f3f;
    width: max-content;
  }
  input[type="checkbox"] {
    position: relative;
    cursor: pointer;
    margin-bottom: 5px;
    width: 10px;
    padding: 0;
  }
  div {
    /* width: 50px; */
  }
  .list {
    list-style: none;
    overflow: hidden;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    justify-content: flex-start;
    padding: 0;
    height: 20px;
  }
  label {
    margin-left: 10px;
    font-size: small;
    display: flex;
    padding: 0;
  }
`;

export default function StudentList({
  studentList,
  selectedStudents,
  setSelectedStudents,
}) {
  const {
    block1Students,
    block2Students,
    block3Students,
    block4Students,
    block5Students,
    block6Students,
    block7Students,
    block8Students,
    block9Students,
    block10Students,
  } = studentList || [];
  const [showSingleClass, setShowSingleClass] = useState(false);
  const [firstNameSort, setFirstNameSort] = useState(false);
  const allStudents = [
    ...(block1Students || []),
    ...(block2Students || []),
    ...(block3Students || []),
    ...(block4Students || []),
    ...(block5Students || []),
    ...(block6Students || []),
    ...(block7Students || []),
    ...(block8Students || []),
    ...(block9Students || []),
    ...(block10Students || []),
  ];
  const allStudentsAlphabetical = allStudents.sort((a, b) => {
    if (firstNameSort) {
      const aLastName = a.name.split(" ")[1].toLowerCase();
      const bLastName = b.name.split(" ")[1].toLowerCase();
      return aLastName > bLastName ? 1 : -1;
    } else {
      const aFirstName = a.name.split(" ")[0].toLowerCase();
      const bFirstName = b.name.split(" ")[0].toLowerCase();
      return aFirstName > bFirstName ? 1 : -1;
    }
  });

  function DisplaySingleClass({ classList }) {
    // sort classList alphabetically by last name
    classList.sort((a, b) => {
      if (firstNameSort) {
        const aFirstName = a.name.split(" ")[0].toLowerCase();
        const bFirstName = b.name.split(" ")[0].toLowerCase();
        return aFirstName > bFirstName ? 1 : -1;
      } else {
        const aLastName = a.name.split(" ")[1].toLowerCase();
        const bLastName = b.name.split(" ")[1].toLowerCase();
        return aLastName > bLastName ? 1 : -1;
      }
    });

    return classList.map((student) => (
      <li className="list" key={student.id}>
        <label htmlFor={student.id}>
          <input
            type="checkbox"
            checked={selectedStudents.includes(student.id)}
            id={student.id}
            name={student.name}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedStudents([...selectedStudents, student.id]);
              } else {
                setSelectedStudents(
                  selectedStudents.filter((id) => id !== student.id)
                );
              }
            }}
          />
          {student.name}
        </label>
      </li>
    ));
  }

  return (
    <>
      <SmallGradientButton
        onClick={(e) => {
          e.preventDefault();
          setShowSingleClass(!showSingleClass);
        }}
      >
        {showSingleClass
          ? "Show all classes"
          : "Sort all students alphabetically"}
      </SmallGradientButton>
      <SmallGradientButton
        onClick={(e) => {
          e.preventDefault();
          setFirstNameSort(!firstNameSort);
        }}
      >
        {firstNameSort ? "Sort by last name" : "Sort by first name"}
      </SmallGradientButton>
      <StudentPickerStyle>
        {showSingleClass ? (
          <>
            {allStudentsAlphabetical?.length > 0 && (
              <div>
                <h4>All Students</h4>
                <DisplaySingleClass classList={allStudents} />
              </div>
            )}
          </>
        ) : (
          <>
            {block1Students?.length > 0 && (
              <div>
                <h4>block 1 Students</h4>
                <DisplaySingleClass classList={block1Students} />
              </div>
            )}
            {block2Students?.length > 0 && (
              <div>
                <h4>block 2 Students</h4>
                <DisplaySingleClass classList={block2Students} />
              </div>
            )}
            {block3Students?.length > 0 && (
              <div>
                <h4>block 3 Students</h4>
                <DisplaySingleClass classList={block3Students} />
              </div>
            )}
            {block4Students?.length > 0 && (
              <div>
                <h4>block 4 Students</h4>
                <DisplaySingleClass classList={block4Students} />
              </div>
            )}
            {block5Students?.length > 0 && (
              <div>
                <h4>block 5 Students</h4>
                <DisplaySingleClass classList={block5Students} />
              </div>
            )}
            {block6Students?.length > 0 && (
              <div>
                <h4>block 6 Students</h4>
                <DisplaySingleClass classList={block6Students} />
              </div>
            )}
            {block7Students?.length > 0 && (
              <div>
                <h4>block 7 Students</h4>
                <DisplaySingleClass classList={block7Students} />
              </div>
            )}
            {block8Students?.length > 0 && (
              <div>
                <h4>block 8 Students</h4>
                <DisplaySingleClass classList={block8Students} />
              </div>
            )}
            {block9Students?.length > 0 && (
              <div>
                <h4>block 9 Students</h4>
                <DisplaySingleClass classList={block9Students} />
              </div>
            )}
            {block10Students?.length > 0 && (
              <div>
                <h4>block 10 Students</h4>
                <DisplaySingleClass classList={block10Students} />
              </div>
            )}
          </>
        )}
      </StudentPickerStyle>
    </>
  );
}
