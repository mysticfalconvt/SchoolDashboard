import React from 'react';
import { NUMBER_OF_BLOCKS } from '../../config';

interface BlockTeacher {
  id: string;
  name: string;
  block1ClassName?: string;
  block1Assignment?: string;
  block1AssignmentLastUpdated?: string;
  block2ClassName?: string;
  block2Assignment?: string;
  block2AssignmentLastUpdated?: string;
  block3ClassName?: string;
  block3Assignment?: string;
  block3AssignmentLastUpdated?: string;
  block4ClassName?: string;
  block4Assignment?: string;
  block4AssignmentLastUpdated?: string;
  block5ClassName?: string;
  block5Assignment?: string;
  block5AssignmentLastUpdated?: string;
  [key: string]: any;
}

interface Student {
  id: string;
  name: string;
  block1Teacher?: BlockTeacher;
  block2Teacher?: BlockTeacher;
  block3Teacher?: BlockTeacher;
  block4Teacher?: BlockTeacher;
  block5Teacher?: BlockTeacher;
  [key: string]: any;
}

interface AssignmentViewCardsStudentProps {
  student: Student;
}

const AssignmentViewCardsStudent: React.FC<AssignmentViewCardsStudentProps> = ({
  student,
}) => {
  return (
    <div className="flex flex-col text-center border-2 border-[var(--blue)] rounded-3xl m-2.5 justify-around w-full">
      <h3 className="m-2">Current Class Assignments</h3>
      <div
        className="grid grid-cols-1 md:grid-cols-[repeat(var(--num-blocks),minmax(0,1fr))]"
        style={{ '--num-blocks': NUMBER_OF_BLOCKS } as React.CSSProperties}
      >
        {[...Array(NUMBER_OF_BLOCKS)].map((e, i) => {
          const num = i + 1;
          const blockTeacher = student[
            `block${num}Teacher` as keyof Student
          ] as BlockTeacher | undefined;

          if (!blockTeacher) {
            return (
              <div
                className="flex flex-col m-2 p-2 rounded-3xl shadow-[2px_2px_var(--blue)] bg-gradient-to-tr from-[var(--blueTrans)] to-[var(--redTrans)] text-xl"
                key={`key for student - ${student.id} - ${num}`}
              />
            );
          }

          const today = new Date();
          const messageDate = new Date(
            (blockTeacher[
              `block${num}AssignmentLastUpdated` as keyof BlockTeacher
            ] as string) || '',
          );
          const newUpdate = today.getTime() - messageDate.getTime() < 164000000;

          return (
            <div
              className={`flex flex-col m-2 p-2 rounded-3xl shadow-[2px_2px_var(--blue)] bg-gradient-to-tr from-[var(--blueTrans)] to-[var(--redTrans)] text-xl ${
                newUpdate
                  ? 'needsUpdate bg-gradient-to-tr from-[var(--red)] to-[var(--redTrans)] bg-[length:400%_400%] shadow-[2px_2px_var(--red)]'
                  : ''
              }`}
              key={`key for student - ${student.id} - ${num}`}
            >
              <h4>Block {num}</h4>
              <p>{blockTeacher.name}</p>
              <p>
                {blockTeacher[`block${num}ClassName` as keyof BlockTeacher]}
              </p>
              <p>
                {blockTeacher[`block${num}Assignment` as keyof BlockTeacher]}
              </p>
              <p>
                {
                  new Date(
                    blockTeacher[
                      `block${num}AssignmentLastUpdated` as keyof BlockTeacher
                    ] as string,
                  )
                    .toLocaleString()
                    .split(',')[0]
                }
              </p>
            </div>
          );
        })}
      </div>
      <style jsx>{`
        @keyframes AnimationName {
          0% {
            background-position: 0% 57%;
          }
          50% {
            background-position: 100% 44%;
          }
          100% {
            background-position: 0% 57%;
          }
        }
        .needsUpdate {
          animation: AnimationName 3s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default AssignmentViewCardsStudent;
