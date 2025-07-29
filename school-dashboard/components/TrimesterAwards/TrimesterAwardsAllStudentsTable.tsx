import { useMemo } from 'react';
import Table from '../Table';
import { useUser } from '../User';
import TrimesterAwardButton from './TrimesterAwardButton';

interface Teacher {
  id: string;
  name: string;
}

interface Award {
  id: string;
  howl: string;
  teacher: Teacher;
}

interface Student {
  id: string;
  name: string;
  awards: Award[];
}

interface TrimesterAwardsAllStudentsTableProps {
  students: Student[];
  trimester: string;
  refetch: () => void;
}

export default function TrimesterAwardsAllStudentsTable({
  students,
  trimester,
  refetch,
}: TrimesterAwardsAllStudentsTableProps) {
  const me = useUser();
  const studentsMemo = useMemo(() => students, [students]);
  const columns = useMemo(
    () => [
      {
        Header: 'Trimester Awards Per Student',
        columns: [
          {
            Header: 'Student',
            accessor: 'name',
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
            Header: 'Give Awards',
            accessor: 'giveAwards',
            Cell: ({ cell }: { cell: { row: { original: Student } } }) => (
              // console.log(cell.row.original);
              // <p>test</p>
              <TrimesterAwardButton
                student={cell.row.original}
                trimester={trimester}
                refetch={refetch}
              />
            ),
          },
          {
            Header: 'Awards',
            accessor: 'awards.length',
            Cell: ({ cell }: { cell: { row: { original: Student } } }) => {
              const awards = cell.row.original.awards.map(
                (award) =>
                  `${award.teacher.name} - ${award.howl.toUpperCase()}`,
              );
              const numberOfAwards = cell.row.original.awards.length;
              return (
                <div
                  className="relative flex items-center justify-center group"
                  key={cell.row.original.id}
                >
                  <span>{numberOfAwards}</span>
                  {numberOfAwards > 0 && (
                    <>
                      <span className="inline-block text-center text-white rounded-full bg-gradient-to-tr from-[var(--red)] to-[var(--blue)] w-16 h-12 m-4">
                        info
                      </span>
                      <div className="invisible group-hover:visible w-[clamp(200px,30vw,60vw)] bg-black/80 text-white text-center rounded-md p-1.5 absolute right-0 z-50">
                        {awards.map((award) => (
                          <p key={award}>{award}</p>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            },
          },
        ],
      },
    ],
    [refetch, trimester],
  );

  return (
    <div>
      <Table data={studentsMemo || []} searchColumn="name" columns={columns} />
    </div>
  );
}
