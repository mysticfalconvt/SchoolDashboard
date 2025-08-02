import React, { useMemo, useState } from 'react';
import GradientButton from '../styles/Button';
import Table from '../Table';

interface Teacher {
  id: string;
  name: string;
}

interface Student {
  id: string;
  name: string;
}

interface CellPhoneViolation {
  id: string;
  description?: string;
  dateGiven: string;
  teacher: Teacher;
  student: Student;
  count?: number;
}

interface ShowCellphoneViolationsProps {
  cellViolations: CellPhoneViolation[];
}

interface StudentCount {
  id: string;
  count: number;
}

function getDisplayCellData(
  cellViolations: CellPhoneViolation[],
): CellPhoneViolation[] {
  const cellViolationsSortedByDate = cellViolations.sort(
    (a, b) => new Date(b.dateGiven).getTime() - new Date(a.dateGiven).getTime(),
  );

  // function to take array of cell violations and get a list of individual student ids
  const getStudentIds = (cellViolations: CellPhoneViolation[]): string[] => {
    const studentIds: string[] = [];
    cellViolations.forEach((cellViolation) => {
      if (studentIds.indexOf(cellViolation?.student?.id) === -1) {
        studentIds.push(cellViolation?.student?.id);
      }
    });
    return studentIds;
  };
  const uniqueStudentIds = getStudentIds(cellViolationsSortedByDate);

  // get the number of times each unique student comes up in the array of cell violations
  const getStudentCount: StudentCount[] = uniqueStudentIds.map((studentId) => {
    const cellViolationTotals = cellViolationsSortedByDate.filter(
      (cellViolation) => cellViolation?.student?.id === studentId,
    ).length;
    return { id: studentId, count: cellViolationTotals };
  });

  const cellViolationsWithCounts = cellViolationsSortedByDate.map(
    (cellViolation) => {
      // get count that goes with this cell violation
      const cellViolationCount =
        getStudentCount.filter(
          (student) => student?.id === cellViolation?.student?.id,
        )[0]?.count || 0;
      return {
        ...cellViolation,
        count: cellViolationCount,
      };
    },
  );
  // console.log(cellViolationsWithCounts);
  return cellViolationsWithCounts;
}

const ShowCellphoneViolations: React.FC<ShowCellphoneViolationsProps> = ({
  cellViolations,
}) => {
  const [ShowCellphoneViolations, setShowCellphoneViolations] = useState(false);

  const columns = useMemo(
    () => [
      {
        Header: 'Cell Phone Violations',
        columns: [
          {
            Header: 'Student',
            accessor: 'student.name',
            // Cell: ({ cell }) => (
            //   <Link href={`/discipline/${cell?.row?.original?.id || ''}`}>
            //     {cell.value}
            //   </Link>
            // ),
          },
          {
            Header: 'Teacher',
            accessor: 'teacher.name',
            // Cell: ({ cell }) => (
            //   <Link href={`/discipline/${cell?.row?.original?.id || ''}`}>
            //     {cell.value}
            //   </Link>
            // ),
          },
          {
            Header: 'Date ',
            accessor: 'dateGiven',
            Cell: ({ cell: { value } }: { cell: { value: string } }) => {
              const today = new Date().toLocaleDateString();
              const displayDate = new Date(value).toLocaleDateString();
              const isToday = today === displayDate;
              return isToday ? `📆 Today` : displayDate;
            },
          },
          {
            Header: 'Total Violations',
            accessor: 'count',
          },
          {
            Header: 'Description',
            accessor: 'description',
          },
        ],
      },
    ],
    [],
  );

  return (
    <div className={ShowCellphoneViolations ? 'big' : ''}>
      <GradientButton
        onClick={() => setShowCellphoneViolations(!ShowCellphoneViolations)}
      >
        {ShowCellphoneViolations
          ? 'Hide Cell Phone Violations'
          : 'Show Cell Violations'}
      </GradientButton>
      {ShowCellphoneViolations && (
        <div className="big">
          <Table
            columns={columns}
            data={getDisplayCellData(cellViolations) || []}
            searchColumn="student.name"
          />
        </div>
      )}
    </div>
  );
};

export default ShowCellphoneViolations;
