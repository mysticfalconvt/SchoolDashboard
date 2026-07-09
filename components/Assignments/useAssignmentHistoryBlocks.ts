import gql from 'graphql-tag';
import { useGQLQuery } from '../../lib/useGqlQuery';

// Fetches the minimal set of (teacher, block) pairs that have any assignment
// history, so callers can hide a "History" button when there's nothing to show.
const GET_ASSIGNMENT_HISTORY_BLOCKS = gql`
  query GET_ASSIGNMENT_HISTORY_BLOCKS($ids: [ID!]) {
    assignmentHistories(where: { teacher: { id: { in: $ids } } }) {
      id
      block
      teacher {
        id
      }
    }
  }
`;

interface HistoryRow {
  id: string;
  block?: number;
  teacher?: { id: string };
}

export default function useAssignmentHistoryBlocks(teacherIds: string[]) {
  // De-dupe + stable order so the query key is consistent across renders.
  const ids = Array.from(new Set(teacherIds.filter(Boolean))).sort();

  const { data } = useGQLQuery(
    `assignmentHistoryBlocks-${ids.join(',')}`,
    GET_ASSIGNMENT_HISTORY_BLOCKS,
    { ids },
    { enabled: ids.length > 0, staleTime: 1000 * 60 * 5 },
  );

  const keys = new Set<string>();
  (data?.assignmentHistories || []).forEach((row: HistoryRow) => {
    if (row?.teacher?.id && row.block != null) {
      keys.add(`${row.teacher.id}-${row.block}`);
    }
  });

  return (teacherId?: string, block?: number): boolean =>
    !!teacherId && block != null && keys.has(`${teacherId}-${block}`);
}
