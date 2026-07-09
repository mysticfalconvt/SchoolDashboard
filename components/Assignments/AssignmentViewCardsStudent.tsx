import React, { useState } from 'react';
import { NUMBER_OF_BLOCKS } from '../../config';
import AssignmentHistory from './AssignmentHistory';
import useAssignmentHistoryBlocks from './useAssignmentHistoryBlocks';

// Students: a block flashes when the teacher updated it within this window.
const RECENT_UPDATE_MS = 48 * 60 * 60 * 1000; // 48 hours

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
  const [showHistory, setShowHistory] = useState(false);
  const [historyBlock, setHistoryBlock] = useState<number>();
  const [historyTeacherId, setHistoryTeacherId] = useState<string>();

  const blockTeacherIds = [...Array(NUMBER_OF_BLOCKS)]
    .map((e, i) => {
      const bt = student[`block${i + 1}Teacher` as keyof Student] as
        | BlockTeacher
        | undefined;
      return bt?.id;
    })
    .filter((id): id is string => !!id);
  const hasHistory = useAssignmentHistoryBlocks(blockTeacherIds);

  return (
    <div className="flex flex-col text-center border-2 border-[var(--blue)] rounded-3xl m-2.5 justify-around w-full">
      <h3 className="m-2">Current Class Assignments</h3>
      {showHistory && historyBlock && historyTeacherId && (
        <AssignmentHistory
          teacherId={historyTeacherId}
          block={historyBlock}
          hide={setShowHistory}
        />
      )}
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

          const lastUpdated = new Date(
            (blockTeacher[
              `block${num}AssignmentLastUpdated` as keyof BlockTeacher
            ] as string) || '',
          );
          const hasValidDate = !Number.isNaN(lastUpdated.getTime());
          // Only flash when the teacher genuinely posted an update recently.
          // A block with no valid date (never posted) must not flash.
          const recentlyUpdated =
            hasValidDate && Date.now() - lastUpdated.getTime() < RECENT_UPDATE_MS;

          return (
            <div
              className={`flex flex-col m-2 p-2 rounded-3xl shadow-[2px_2px_var(--blue)] bg-gradient-to-tr from-[var(--blueTrans)] to-[var(--redTrans)] text-xl ${
                recentlyUpdated
                  ? 'flashAssignment bg-gradient-to-tr from-[var(--red)] to-[var(--redTrans)] bg-[length:400%_400%] shadow-[2px_2px_var(--red)]'
                  : ''
              }`}
              key={`key for student - ${student.id} - ${num}`}
            >
              <h4>{num}</h4>
              <p>{blockTeacher.name}</p>
              <p>
                {blockTeacher[`block${num}ClassName` as keyof BlockTeacher]}
              </p>
              <p>
                {blockTeacher[`block${num}Assignment` as keyof BlockTeacher]}
              </p>
              {hasValidDate && (
                <p>{lastUpdated.toLocaleString().split(',')[0]}</p>
              )}
              {hasHistory(blockTeacher.id, num) && (
                <button
                  type="button"
                  onClick={() => {
                    setHistoryTeacherId(blockTeacher.id);
                    setHistoryBlock(num);
                    setShowHistory(true);
                  }}
                  className="mt-2 self-center text-white bg-[var(--blueTrans)] hover:bg-[var(--blue)] border-none rounded-full px-4 py-1 text-sm"
                >
                  History
                </button>
              )}
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
        .flashAssignment {
          animation: AnimationName 3s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default AssignmentViewCardsStudent;
