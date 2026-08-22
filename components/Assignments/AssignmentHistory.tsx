import gql from 'graphql-tag';
import React from 'react';
import { blockName } from '../../lib/blockNames';
import { useGQLQuery } from '../../lib/useGqlQuery';
import Loading from '../Loading';

const GET_ASSIGNMENT_HISTORY = gql`
  query GET_ASSIGNMENT_HISTORY($teacher: ID!, $block: Int!) {
    assignmentHistories(
      where: {
        teacher: { id: { equals: $teacher } }
        block: { equals: $block }
      }
      orderBy: { dateRemoved: desc }
    ) {
      id
      assignment
      className
      dateAdded
      dateRemoved
    }
  }
`;

interface AssignmentHistoryItem {
  id: string;
  assignment?: string;
  className?: string;
  dateAdded?: string;
  dateRemoved?: string;
}

interface AssignmentHistoryProps {
  teacherId: string;
  block: number;
  hide: (show: boolean) => void;
}

function formatDate(date?: string): string {
  if (!date) return 'unknown';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'unknown';
  return parsed.toLocaleString().split(',')[0];
}

const AssignmentHistory: React.FC<AssignmentHistoryProps> = ({
  teacherId,
  block,
  hide,
}) => {
  const { data, isLoading } = useGQLQuery(
    `assignmentHistory-${teacherId}-${block}`,
    GET_ASSIGNMENT_HISTORY,
    { teacher: teacherId, block },
    { enabled: !!teacherId },
  );

  const history: AssignmentHistoryItem[] = data?.assignmentHistories || [];

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={() => hide(false)}
      />

      {/* Modal */}
      <div className="fixed z-50 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-4xl max-h-[80vh] rounded-3xl bg-gradient-to-tr from-[var(--red)] to-[var(--blue)] overflow-hidden border-2 border-[var(--blue)] shadow-2xl flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-[var(--blue)]">
          <h4 className="text-white text-xl font-semibold">
            Assignment History for {blockName(block)}
          </h4>
          <button
            type="button"
            onClick={() => hide(false)}
            className="w-8 h-8 text-white bg-[var(--redTrans)] hover:bg-[var(--blue)] rounded-full flex items-center justify-center text-lg font-bold transition-colors duration-200"
          >
            ×
          </button>
        </div>

        <div className="p-4 overflow-y-auto text-white">
          {isLoading && <Loading />}
          {!isLoading && history.length === 0 && (
            <p className="text-center">No past assignments recorded yet.</p>
          )}
          {!isLoading &&
            history.map((item) => (
              <div
                key={item.id}
                className="flex flex-col text-left p-3 mb-3 rounded-2xl bg-gradient-to-tr from-[var(--blueTrans)] to-[var(--redTrans)] shadow-[2px_2px_var(--blue)]"
              >
                {item.className && (
                  <p className="font-semibold">{item.className}</p>
                )}
                <p className="whitespace-pre-wrap">{item.assignment}</p>
                <p className="text-sm mt-2 opacity-90">
                  Added {formatDate(item.dateAdded)} · Replaced{' '}
                  {formatDate(item.dateRemoved)}
                </p>
              </div>
            ))}
        </div>
      </div>
    </>
  );
};

export default AssignmentHistory;
