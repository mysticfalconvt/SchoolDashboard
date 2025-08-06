import { useState } from 'react';
import { SmallGradientButton } from '../styles/Button';

interface Student {
  id: string;
  name: string;
}

interface StudentList {
  block1Students?: Student[];
  block2Students?: Student[];
  block3Students?: Student[];
  block4Students?: Student[];
  block5Students?: Student[];
  block6Students?: Student[];
  block7Students?: Student[];
  block8Students?: Student[];
  block9Students?: Student[];
  block10Students?: Student[];
}

interface StudentListProps {
  studentList: StudentList;
  selectedStudents: string[];
  setSelectedStudents: (students: string[]) => void;
}

interface DisplaySingleClassProps {
  classList: Student[];
}

export default function StudentList({
  studentList,
  selectedStudents,
  setSelectedStudents,
}: StudentListProps) {
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
  } = studentList || {};
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

  // Remove duplicates based on student ID
  const uniqueStudents = allStudents.filter(
    (student, index, self) =>
      index === self.findIndex((s) => s.id === student.id),
  );

  const allStudentsAlphabetical = uniqueStudents.sort((a, b) => {
    if (firstNameSort) {
      const aLastName = a.name.split(' ')[1]?.toLowerCase() || '';
      const bLastName = b.name.split(' ')[1]?.toLowerCase() || '';
      return aLastName > bLastName ? 1 : -1;
    } else {
      const aFirstName = a.name.split(' ')[0]?.toLowerCase() || '';
      const bFirstName = b.name.split(' ')[0]?.toLowerCase() || '';
      return aFirstName > bFirstName ? 1 : -1;
    }
  });

  function DisplaySingleClass({ classList }: DisplaySingleClassProps) {
    // Remove duplicates from classList as well
    const uniqueClassList = classList.filter(
      (student, index, self) =>
        index === self.findIndex((s) => s.id === student.id),
    );

    // sort classList alphabetically by last name
    uniqueClassList.sort((a, b) => {
      if (firstNameSort) {
        const aFirstName = a.name.split(' ')[0]?.toLowerCase() || '';
        const bFirstName = b.name.split(' ')[0]?.toLowerCase() || '';
        return aFirstName > bFirstName ? 1 : -1;
      } else {
        const aLastName = a.name.split(' ')[1]?.toLowerCase() || '';
        const bLastName = b.name.split(' ')[1]?.toLowerCase() || '';
        return aLastName > bLastName ? 1 : -1;
      }
    });

    return uniqueClassList.map((student) => (
      <li
        className="list-none overflow-hidden flex flex-row items-start justify-start p-0 h-5"
        key={`${student.id}-${student.name}`}
      >
        <label htmlFor={student.id} className="ml-2.5 text-sm flex p-0">
          <input
            type="checkbox"
            checked={selectedStudents.includes(student.id)}
            id={student.id}
            name={student.name}
            className="relative cursor-pointer mb-1.5 w-2.5 p-0"
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedStudents([...selectedStudents, student.id]);
              } else {
                setSelectedStudents(
                  selectedStudents.filter((id) => id !== student.id),
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
      <div className="flex gap-2 mb-4">
        <SmallGradientButton
          onClick={(e) => {
            e.preventDefault();
            setShowSingleClass(!showSingleClass);
          }}
        >
          {showSingleClass
            ? 'Show all classes'
            : 'Sort all students alphabetically'}
        </SmallGradientButton>
        <SmallGradientButton
          onClick={(e) => {
            e.preventDefault();
            setFirstNameSort(!firstNameSort);
          }}
        >
          {firstNameSort ? 'Sort by last name' : 'Sort by first name'}
        </SmallGradientButton>
      </div>
      <div className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {showSingleClass ? (
          <>
            {allStudentsAlphabetical?.length > 0 && (
              <div>
                <h4 className="mb-0 text-base text-gray-700 w-max">
                  All Students
                </h4>
                <DisplaySingleClass classList={allStudents} />
              </div>
            )}
          </>
        ) : (
          <>
            {block1Students?.length > 0 && (
              <div>
                <h4 className="mb-0 text-base text-gray-700 w-max">
                  block 1 Students
                </h4>
                <DisplaySingleClass classList={block1Students} />
              </div>
            )}
            {block2Students?.length > 0 && (
              <div>
                <h4 className="mb-0 text-base text-gray-700 w-max">
                  block 2 Students
                </h4>
                <DisplaySingleClass classList={block2Students} />
              </div>
            )}
            {block3Students?.length > 0 && (
              <div>
                <h4 className="mb-0 text-base text-gray-700 w-max">
                  block 3 Students
                </h4>
                <DisplaySingleClass classList={block3Students} />
              </div>
            )}
            {block4Students?.length > 0 && (
              <div>
                <h4 className="mb-0 text-base text-gray-700 w-max">
                  block 4 Students
                </h4>
                <DisplaySingleClass classList={block4Students} />
              </div>
            )}
            {block5Students?.length > 0 && (
              <div>
                <h4 className="mb-0 text-base text-gray-700 w-max">
                  block 5 Students
                </h4>
                <DisplaySingleClass classList={block5Students} />
              </div>
            )}
            {block6Students?.length > 0 && (
              <div>
                <h4 className="mb-0 text-base text-gray-700 w-max">
                  block 6 Students
                </h4>
                <DisplaySingleClass classList={block6Students} />
              </div>
            )}
            {block7Students?.length > 0 && (
              <div>
                <h4 className="mb-0 text-base text-gray-700 w-max">
                  block 7 Students
                </h4>
                <DisplaySingleClass classList={block7Students} />
              </div>
            )}
            {block8Students?.length > 0 && (
              <div>
                <h4 className="mb-0 text-base text-gray-700 w-max">
                  block 8 Students
                </h4>
                <DisplaySingleClass classList={block8Students} />
              </div>
            )}
            {block9Students?.length > 0 && (
              <div>
                <h4 className="mb-0 text-base text-gray-700 w-max">
                  block 9 Students
                </h4>
                <DisplaySingleClass classList={block9Students} />
              </div>
            )}
            {block10Students?.length > 0 && (
              <div>
                <h4 className="mb-0 text-base text-gray-700 w-max">
                  block 10 Students
                </h4>
                <DisplaySingleClass classList={block10Students} />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
