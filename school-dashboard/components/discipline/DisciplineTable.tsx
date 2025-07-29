import Link from 'next/link';
import React, { useMemo } from 'react';
import { capitalizeFirstLetter } from '../../lib/nameUtils';
import Table from '../Table';

interface Teacher {
  id: string;
  name: string;
}

interface Student {
  name: string;
  id: string;
}

interface Discipline {
  id: string;
  date: string;
  teacher: Teacher;
  student: Student;
  classType?: string;
  timeOfDay?: string;
}

interface DisciplineTableProps {
  disciplines: Discipline[];
}

const DisciplineTable: React.FC<DisciplineTableProps> = ({ disciplines }) => {
  const columns = useMemo(
    () => [
      {
        Header: 'Discipline',
        columns: [
          {
            Header: 'Student',
            accessor: 'student.name',
            Cell: ({ cell }: { cell: any }) => (
              <Link href={`/discipline/${cell?.row?.original?.id || ''}`} >
                {capitalizeFirstLetter(cell.value)}
              </Link>
            ),
          },
          {
            Header: 'Teacher',
            accessor: 'teacher.name',
            Cell: ({ cell }: { cell: any }) => (
              <Link href={`/discipline/${cell?.row?.original?.id || ''}`} >
                {cell.value}
              </Link>
            ),
          },
          {
            Header: 'Date ',
            accessor: 'date',
            Cell: ({ cell: { value } }: { cell: { value: string } }) => {
              const today = new Date().toLocaleDateString();
              const displayDate = new Date(value).toLocaleDateString();
              const isToday = today === displayDate;
              return isToday ? `📆 Today 📆` : displayDate;
            },
          },
          {
            Header: 'Class Type',
            accessor: 'classType',
          },
          {
            Header: 'Time',
            accessor: 'timeOfDay',
          },
        ],
      },
    ],
    [],
  );

  return (
    <div>
      <Table
        data={disciplines || []}
        searchColumn="student.name"
        columns={columns}
      />
    </div>
  );
};

export default DisciplineTable;
