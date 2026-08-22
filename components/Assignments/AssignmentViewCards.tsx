import React, { useState } from 'react';
import { blockDisplayList, sameText } from '../../lib/blockNames';
import BlockLabel from '../BlockLabel';
import AssignmentHistory from './AssignmentHistory';
import useAssignmentHistoryBlocks from './useAssignmentHistoryBlocks';

// Teachers: a block flashes when it hasn't been updated in longer than this.
const STALE_ASSIGNMENT_MS = 8 * 24 * 60 * 60 * 1000; // 8 days

interface AssignmentData {
  block1Assignment?: string;
  block1ClassName?: string;
  block1AssignmentLastUpdated?: string;
  block2Assignment?: string;
  block2ClassName?: string;
  block2AssignmentLastUpdated?: string;
  block3Assignment?: string;
  block3ClassName?: string;
  block3AssignmentLastUpdated?: string;
  block4Assignment?: string;
  block4ClassName?: string;
  block4AssignmentLastUpdated?: string;
  block5Assignment?: string;
  block5ClassName?: string;
  block5AssignmentLastUpdated?: string;
  block6Assignment?: string;
  block6ClassName?: string;
  block6AssignmentLastUpdated?: string;
  block7Assignment?: string;
  block7ClassName?: string;
  block7AssignmentLastUpdated?: string;
  block8Assignment?: string;
  block8ClassName?: string;
  block8AssignmentLastUpdated?: string;
  block9Assignment?: string;
  block9ClassName?: string;
  block9AssignmentLastUpdated?: string;
  block10Assignment?: string;
  block11Assignment?: string;
  block12Assignment?: string;
  block10ClassName?: string;
  block11ClassName?: string;
  block12ClassName?: string;
  block10AssignmentLastUpdated?: string;
  block11AssignmentLastUpdated?: string;
  block12AssignmentLastUpdated?: string;
  [key: string]: any;
}

interface AssignmentViewCardsProps {
  assignments: AssignmentData;
}

const AssignmentViewCards: React.FC<AssignmentViewCardsProps> = ({
  assignments,
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const [historyBlock, setHistoryBlock] = useState<number>();
  const teacherId = assignments?.id as string | undefined;
  const hasHistory = useAssignmentHistoryBlocks(teacherId ? [teacherId] : []);
  // A merged card's history can sit under either rotation.
  const historyBlockFor = (blocks: number[]): number | undefined =>
    blocks.find((b) => teacherId && hasHistory(teacherId, b));
  // One card per colour when both rotations carry the same class. The B half
  // is hidden rather than stacked under the A half.
  const blocksToShow = blockDisplayList((a, b) =>
    sameText(
      assignments[`block${a}ClassName`],
      assignments[`block${b}ClassName`],
    ),
  );

  return (
    <div className="flex flex-col text-center border-2 border-[var(--blue)] rounded-3xl m-2.5 justify-around w-full">
      <h3 className="m-2">Current Class Assignments</h3>
      {showHistory && historyBlock && teacherId && (
        <AssignmentHistory
          teacherId={teacherId}
          block={historyBlock}
          hide={setShowHistory}
        />
      )}
      <div
        className="grid grid-cols-1 md:grid-cols-[repeat(var(--num-blocks),minmax(0,1fr))]"
        style={{ '--num-blocks': blocksToShow.length } as React.CSSProperties}
      >
        {blocksToShow.map(({ block: num, blocks, name, color }) => {
          // Teachers: flag a block that has never been updated (flash until
          // it's first filled in), or that has gone stale — not updated in
          // over 8 days (once-a-week cadence plus a buffer). Either half of a
          // merged card falling behind flags the card.
          const isStale = blocks.some((b) => {
            const raw = assignments[`block${b}AssignmentLastUpdated`];
            const updated = raw ? new Date(raw) : null;
            if (!updated || Number.isNaN(updated.getTime())) return true;
            return Date.now() - updated.getTime() > STALE_ASSIGNMENT_MS;
          });

          return (
            <div
              className={`flex flex-col m-2 p-2 rounded-3xl shadow-[2px_2px_var(--blue)] bg-gradient-to-tr from-[var(--blueTrans)] to-[var(--redTrans)] text-xl ${
                isStale
                  ? 'flashAssignment bg-gradient-to-tr from-[var(--red)] to-[var(--redTrans)] bg-[length:400%_400%] shadow-[2px_2px_var(--red)]'
                  : ''
              }`}
              key={`key ${blocks.join('-')}`}
            >
              <h4>
                <BlockLabel name={name} color={color} />
              </h4>
              <p>{assignments[`block${num}ClassName`]}</p>
              <p>{assignments[`block${num}Assignment`]}</p>
              {/* <p>
                {
                  new Date(assignments[`block${num}AssignmentLastUpdated`])
                    .toLocaleString()
                    .split(',')[0]
                }
              </p> */}
              {teacherId && historyBlockFor(blocks) && (
                <button
                  type="button"
                  onClick={() => {
                    setHistoryBlock(historyBlockFor(blocks));
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

export default AssignmentViewCards;
