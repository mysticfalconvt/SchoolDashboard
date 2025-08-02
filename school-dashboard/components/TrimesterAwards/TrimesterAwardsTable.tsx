import { useMemo } from 'react';
import Table from '../Table';
import { useUser } from '../User';

interface Student {
  id: string;
  name: string;
}

interface Teacher {
  id: string;
  name: string;
}

interface Award {
  id: string;
  student: Student;
  teacher: Teacher;
  howl: string;
  trimester: string;
}

interface TrimesterAwardsTableProps {
  awards: Award[];
}

export default function TrimesterAwardsTable({
  awards,
}: TrimesterAwardsTableProps) {
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
            Cell: ({ value }: { value: string }) => {
              // capitalize first letter of each word
              const name = value
                .split(' ')
                .map(
                  (word) => `${word.charAt(0).toUpperCase() + word.slice(1)} `,
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
    [],
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
