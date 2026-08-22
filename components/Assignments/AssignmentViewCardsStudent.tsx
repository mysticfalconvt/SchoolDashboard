import React, { useState } from 'react';
import { NUMBER_OF_BLOCKS } from '../../config';
import { blockDisplayList } from '../../lib/blockNames';
import BlockLabel from '../BlockLabel';
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

  const teacherForBlock = (block: number): BlockTeacher | undefined =>
    student[`block${block}Teacher` as keyof Student] as
      | BlockTeacher
      | undefined;

  const blockTeacherIds = [...Array(NUMBER_OF_BLOCKS)]
    .map((e, i) => teacherForBlock(i + 1)?.id)
    .filter((id): id is string => !!id);
  const hasHistory = useAssignmentHistoryBlocks(blockTeacherIds);

  const fieldFor = (block: number, field: string): string =>
    (teacherForBlock(block)?.[
      `block${block}${field}` as keyof BlockTeacher
    ] as string) || '';

  // The class a student sits in is the teacher they sit with, so the same
  // teacher in both rotations is one colour to read, not two. The B half is
  // hidden, so the card reads exactly like a single-rotation one.
  const blocksToShow = blockDisplayList(
    (a, b) => teacherForBlock(a)?.id === teacherForBlock(b)?.id,
  );

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
        style={{ '--num-blocks': blocksToShow.length } as React.CSSProperties}
      >
        {blocksToShow.map(({ block: num, blocks, name, color }) => {
          const blockTeacher = teacherForBlock(num);
          const cardKey = `key for student - ${student.id} - ${blocks.join('-')}`;

          if (!blockTeacher) {
            return (
              <div
                className="flex flex-col m-2 p-2 rounded-3xl shadow-[2px_2px_var(--blue)] bg-gradient-to-tr from-[var(--blueTrans)] to-[var(--redTrans)] text-xl"
                key={cardKey}
              >
                <h4>
                  <BlockLabel name={name} color={color} />
                </h4>
              </div>
            );
          }

          const updatedTimes = blocks
            .map((b) =>
              new Date(fieldFor(b, 'AssignmentLastUpdated')).getTime(),
            )
            .filter((time) => !Number.isNaN(time));
          // Only flash when the teacher genuinely posted an update recently.
          // A block with no valid date (never posted) must not flash.
          const recentlyUpdated =
            updatedTimes.length > 0 &&
            Date.now() - Math.max(...updatedTimes) < RECENT_UPDATE_MS;

          return (
            <div
              className={`flex flex-col m-2 p-2 rounded-3xl shadow-[2px_2px_var(--blue)] bg-gradient-to-tr from-[var(--blueTrans)] to-[var(--redTrans)] text-xl ${
                recentlyUpdated
                  ? 'flashAssignment bg-gradient-to-tr from-[var(--red)] to-[var(--redTrans)] bg-[length:400%_400%] shadow-[2px_2px_var(--red)]'
                  : ''
              }`}
              key={cardKey}
            >
              <h4>
                <BlockLabel name={name} color={color} />
              </h4>
              <p>{blockTeacher.name}</p>
              <p>{fieldFor(num, 'ClassName')}</p>
              <p>{fieldFor(num, 'Assignment')}</p>
              {!Number.isNaN(
                new Date(fieldFor(num, 'AssignmentLastUpdated')).getTime(),
              ) && (
                <p>
                  {
                    new Date(fieldFor(num, 'AssignmentLastUpdated'))
                      .toLocaleString()
                      .split(',')[0]
                  }
                </p>
              )}
              {blocks.some((b) => hasHistory(blockTeacher.id, b)) && (
                <button
                  type="button"
                  onClick={() => {
                    setHistoryTeacherId(blockTeacher.id);
                    setHistoryBlock(
                      blocks.find((b) => hasHistory(blockTeacher.id, b)),
                    );
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
