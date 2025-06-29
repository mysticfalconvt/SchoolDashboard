import Link from 'next/link';
import { useMemo } from 'react';
import Table from '../Table';
import { useUser } from '../User';

export default function TrimesterAwardsTable({ awards }) {
  const me = useUser();
  const awardsMemo = useMemo(() => awards, [awards]);
  const columns = useMemo(
    () => [
      {
        Header: 'Trimester Awards For Current Trimester',
        columns: [
          {
            Header: 'Student',
            accessor: 'student.name',
            Cell: ({ value }) => {
              // capitalize first letter of each word
              const name = value
                .split(' ')
                .map(
                  (word) => `${word.charAt(0).toUpperCase() + word.slice(1)} `
                );
              return name;
            },
          },
          {
            Header: 'Teacher',
            accessor: 'teacher.name',
          },
          {
            Header: 'Award',
            accessor: 'howl',
          },
          {
            Header: 'Trimester',
            accessor: 'trimester',
          },
        ],
      },
    ],
    []
  );

  return (
    <div>
      <Table
        data={awardsMemo || []}
        searchColumn="student.name"
        columns={columns}
      />
    </div>
  );
}
