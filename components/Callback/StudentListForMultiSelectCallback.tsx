import { useState } from 'react';
import { lastNameCommaFirstName } from '@/lib/lastNameCommaFirstName';
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
  block11Students?: Student[];
  block12Students?: Student[];
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
    block11Students,
    block12Students,
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
    ...(block11Students || []),
    ...(block12Students || []),
  ];

  // Remove duplicates based on student ID
  const uniqueStudents = allStudents.filter(
    (student, index, self) =>
      index === self.findIndex((s) => s.id === student.id),
  );

  const allStudentsAlphabetical = uniqueStudents.sort((a, b) => {
    if (firstNameSort) {
      const aFirstName = a.name.split(' ')[0]?.toLowerCase() || '';
      const bFirstName = b.name.split(' ')[0]?.toLowerCase() || '';
      return aFirstName > bFirstName ? 1 : -1;
    } else {
      const aFormatted = lastNameCommaFirstName(a.name).toLowerCase();
      const bFormatted = lastNameCommaFirstName(b.name).toLowerCase();
      return aFormatted.localeCompare(bFormatted);
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
        const aFormatted = lastNameCommaFirstName(a.name).toLowerCase();
        const bFormatted = lastNameCommaFirstName(b.name).toLowerCase();
        return aFormatted.localeCompare(bFormatted);
      }
    });

    return (
      <ul className="list-none m-0 p-0 space-y-1">
        {uniqueClassList.map((student) => {
          const isSelected = selectedStudents.includes(student.id);
          return (
            <li
              className="list-none m-0 p-0"
              key={`${student.id}-${student.name}`}
            >
              <label
                htmlFor={student.id}
                className={`flex items-start gap-2 text-sm leading-5 cursor-pointer m-0 -mx-1.5 px-1.5 py-0.5 rounded transition-colors duration-150 ${
                  isSelected
                    ? 'bg-white/15 text-white font-semibold'
                    : 'text-white/80 font-normal hover:bg-white/5'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  id={student.id}
                  name={student.name}
                  className="h-4 w-4 shrink-0 mt-0.5 cursor-pointer accent-[#38B6FF]"
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
                <span className="min-w-0 break-words">
                  {firstNameSort
                    ? student.name
                    : lastNameCommaFirstName(student.name)}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    );
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
      <div className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-6 gap-y-4 items-start">
        {showSingleClass ? (
          <>
            {allStudentsAlphabetical?.length > 0 && (
              <div>
                <h4 className="mb-1 text-base font-semibold text-white">
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
                <h4 className="mb-1 text-base font-semibold text-white">
                  block 1 Students
                </h4>
                <DisplaySingleClass classList={block1Students} />
              </div>
            )}
            {block2Students?.length > 0 && (
              <div>
                <h4 className="mb-1 text-base font-semibold text-white">
                  block 2 Students
                </h4>
                <DisplaySingleClass classList={block2Students} />
              </div>
            )}
            {block3Students?.length > 0 && (
              <div>
                <h4 className="mb-1 text-base font-semibold text-white">
                  block 3 Students
                </h4>
                <DisplaySingleClass classList={block3Students} />
              </div>
            )}
            {block4Students?.length > 0 && (
              <div>
                <h4 className="mb-1 text-base font-semibold text-white">
                  block 4 Students
                </h4>
                <DisplaySingleClass classList={block4Students} />
              </div>
            )}
            {block5Students?.length > 0 && (
              <div>
                <h4 className="mb-1 text-base font-semibold text-white">
                  block 5 Students
                </h4>
                <DisplaySingleClass classList={block5Students} />
              </div>
            )}
            {block6Students?.length > 0 && (
              <div>
                <h4 className="mb-1 text-base font-semibold text-white">
                  block 6 Students
                </h4>
                <DisplaySingleClass classList={block6Students} />
              </div>
            )}
            {block7Students?.length > 0 && (
              <div>
                <h4 className="mb-1 text-base font-semibold text-white">
                  block 7 Students
                </h4>
                <DisplaySingleClass classList={block7Students} />
              </div>
            )}
            {block8Students?.length > 0 && (
              <div>
                <h4 className="mb-1 text-base font-semibold text-white">
                  block 8 Students
                </h4>
                <DisplaySingleClass classList={block8Students} />
              </div>
            )}
            {block9Students?.length > 0 && (
              <div>
                <h4 className="mb-1 text-base font-semibold text-white">
                  block 9 Students
                </h4>
                <DisplaySingleClass classList={block9Students} />
              </div>
            )}
            {block10Students?.length > 0 && (
              <div>
                <h4 className="mb-1 text-base font-semibold text-white">
                  block 10 Students
                </h4>
                <DisplaySingleClass classList={block10Students} />
              </div>
            )}
            {block11Students?.length > 0 && (
              <div>
                <h4 className="mb-1 text-base font-semibold text-white">
                  block 11 Students
                </h4>
                <DisplaySingleClass classList={block11Students} />
              </div>
            )}
            {block12Students?.length > 0 && (
              <div>
                <h4 className="mb-1 text-base font-semibold text-white">
                  block 12 Students
                </h4>
                <DisplaySingleClass classList={block12Students} />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
