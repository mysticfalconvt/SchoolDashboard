import gql from 'graphql-tag';
import Link from 'next/link';
import React, { useMemo } from 'react';
import getDisplayName from '../../lib/displayName';
import { useGQLQuery } from '../../lib/useGqlQuery';
import Table from '../Table';
import { useUser } from '../User';
import CallbackMessagesForTable from './CallbackMessagesForTable';
import MarkCallbackCompleted from './MarkCallbackCompleted';

const GET_STUDENTS_BY_BLOCK_QUERY = gql`
  query GET_STUDENTS_BY_BLOCK($id: ID) {
    user(where: { id: $id }) {
      id
      name
      block1Students {
        id
      }
      block2Students {
        id
      }
      block3Students {
        id
      }
      block4Students {
        id
      }
      block5Students {
        id
      }
      block6Students {
        id
      }
      block7Students {
        id
      }
      block8Students {
        id
      }
      block9Students {
        id
      }
      block10Students {
        id
      }
    }
  }
`;

interface Student {
  id: string;
  name: string;
}

interface Teacher {
  id: string;
  name: string;
}

interface Callback {
  id: string;
  title: string;
  description: string;
  link?: string;
  dateAssigned: string;
  dateCompleted?: string;
  messageFromTeacher?: string;
  messageFromTeacherDate?: string;
  messageFromStudent?: string;
  messageFromStudentDate?: string;
  student: Student;
  teacher: Teacher;
  block?: string;
}

interface User {
  id: string;
}

interface CallbackTableProps {
  callbacks: Callback[];
  showClassBlock?: boolean;
}

interface StudentsByBlock {
  B1?: string[];
  B2?: string[];
  B3?: string[];
  B4?: string[];
  B5?: string[];
  B6?: string[];
  B7?: string[];
  B8?: string[];
  B9?: string[];
  B10?: string[];
}

const CallbackTable = React.memo(function CallbackTable({
  callbacks,
  showClassBlock = false,
}: CallbackTableProps) {
  const me = useUser() as User;

  const { data } = useGQLQuery(
    'studentsByBlock',
    GET_STUDENTS_BY_BLOCK_QUERY,
    {
      id: me?.id,
    },
    {
      enabled: !!me && !!showClassBlock,
    },
  );
  const studentsByBlock = useMemo((): StudentsByBlock => {
    const students = data?.user;
    const B1 = students?.block1Students?.map(
      (student: { id: string }) => student.id,
    );
    const B2 = students?.block2Students?.map(
      (student: { id: string }) => student.id,
    );
    const B3 = students?.block3Students?.map(
      (student: { id: string }) => student.id,
    );
    const B4 = students?.block4Students?.map(
      (student: { id: string }) => student.id,
    );
    const B5 = students?.block5Students?.map(
      (student: { id: string }) => student.id,
    );
    const B6 = students?.block6Students?.map(
      (student: { id: string }) => student.id,
    );
    const B7 = students?.block7Students?.map(
      (student: { id: string }) => student.id,
    );
    const B8 = students?.block8Students?.map(
      (student: { id: string }) => student.id,
    );
    const B9 = students?.block9Students?.map(
      (student: { id: string }) => student.id,
    );
    const B10 = students?.block10Students?.map(
      (student: { id: string }) => student.id,
    );
    const studentsByBlock = {
      B1,
      B2,
      B3,
      B4,
      B5,
      B6,
      B7,
      B8,
      B9,
      B10,
    };
    return studentsByBlock;
  }, [data]);

  const callbacksMemo = useMemo(() => {
    if (!callbacks) {
      return [];
    }
    
    const callbackWithName = callbacks.map((callback) => {
      const name = getDisplayName(callback.student as any);
      const student = { ...callback.student, name };
      // check which block student is in from studentsByBlock
      const block =
        Object.keys(studentsByBlock).find((block) => {
          const students = studentsByBlock[block as keyof StudentsByBlock];
          return students?.includes(student.id);
        }) || 'n/a';

      return { ...callback, student, block };
    });
    const sorted = callbackWithName.sort((a, b) => {
      if (a.student.name < b.student.name) {
        return -1;
      }
      if (a.student.name > b.student.name) {
        return 1;
      }
      return 0;
    });
    return sorted;
  }, [callbacks, studentsByBlock]);
  // Create today's date once and memoize it
  const todayString = useMemo(() => new Date().toLocaleDateString(), []);
  
  const columns = useMemo(() => {
    return [
      {
        Header: 'Callback',
        columns: [
          {
            Header: 'Student',
            accessor: 'student.name',
            Cell: ({
              cell,
            }: {
              cell: { value: string; row: { original: Callback } };
            }) => (
              <Link
                href={`/userProfile/${cell?.row?.original?.student?.id || ''}`}
                >
                {cell.value}
              </Link>
            ),
          },
          {
            Header: 'Teacher',
            accessor: 'teacher.name',
            Cell: ({
              cell,
            }: {
              cell: { value: string; row: { original: Callback } };
            }) => (
              <Link
                href={`/userProfile/${cell?.row?.original?.teacher?.id || ''}`}
                >
                {cell.value}
              </Link>
            ),
          },
          {
            Header: 'Assignment',
            accessor: 'title',
            Cell: ({
              cell,
            }: {
              cell: { value: string; row: { original: Callback } };
            }) => (
              <Link href={`/callback/${cell.row.original.id}`} >
                {cell.value}
              </Link>
            ),
          },
          {
            Header: 'Description',
            accessor: 'description',
            Cell: ({
              cell,
            }: {
              cell: { value: string; row: { original: Callback } };
            }) => {
              let shortDescription = cell.value
                .split(' ')
                .reduce((acc, word) => {
                  if (acc.length > 50) {
                    return acc;
                  }
                  return `${acc} ${word}`;
                }, '');
              // if description was shortened add ...
              if (shortDescription.length < cell.value.length) {
                shortDescription = `${shortDescription}...`;
              }
              return (
                <>
                  <div className="relative inline-block group">
                    <Link href={`/callback/${cell.row.original.id}`} >
                      {shortDescription}
                    </Link>
                    <span className="invisible group-hover:visible w-[clamp(200px,30vw,60vw)] bg-black/80 text-white text-center rounded-md p-1.5 absolute z-10">
                      {cell.value}
                    </span>
                  </div>
                </>
              );
            },
          },
          {
            Header: 'Date Assigned',
            accessor: 'dateAssigned',
            Cell: ({ cell: { value } }: { cell: { value: string } }) => {
              const displayDate = new Date(value).toLocaleDateString();
              const isToday = todayString === displayDate;
              return isToday ? `📆 Today 📆` : displayDate;
            },
          },
          {
            Header: 'Completed',
            accessor: 'dateCompleted',
            Cell: ({ cell: { value } }: { cell: { value?: string } }) => {
              if (!value) {
                return <>---</>;
              }
              const displayDate = new Date(value).toLocaleDateString();
              const isToday = todayString === displayDate;
              return isToday ? `📆 Today 📆` : displayDate;
            },
          },
          {
            Header: 'Link',
            accessor: 'link',
            Cell: ({ cell: { value } }: { cell: { value?: string } }) => (
              <Link
                href={value?.startsWith('http') ? value : `http://${value}`}
                >
                {value ? 'Link' : ''}
              </Link>
            ),
          },
          {
            Header: 'Block',
            accessor: 'block',
          },
        ],
      },
      {
        Header: 'Message',
        columns: [
          {
            Header: 'Message',
            accessor: 'messageFromTeacher',
            Cell: ({ cell }: { cell: { row: { original: Callback } } }) => {
              // console.log(cell);
              return (
                <CallbackMessagesForTable callbackItem={cell.row.original} />
              );
            },
          },
          // {
          //   Header: 'Teacher',
          //   accessor: 'messageFromTeacher',
          //   Cell: ({ cell }) => (
          //     <Link href={`/callback/${cell.row.original.id}`}>
          //       <>
          //       {cell.value || '-----'} {' '}
          //       {cell.row.original.messageFromTeacherDate || ''}
          //       </>
          //     </Link>
          //   ),
          // },
          // {
          //   Header: 'Student',
          //   accessor: 'messageFromStudent',
          //   Cell: ({ cell }) => (
          //     <Link href={`/callback/${cell.row.original.id}`}>
          //       <>
          //       {cell.value || '-----'}{' '}
          //       {cell.row.original.messageFromStudentDate ||""}
          //       </>
          //     </Link>
          //   ),
          // },
        ],
      },
      {
        Header: 'Complete',
        columns: [
          {
            Header: 'Mark Completed',
            accessor: 'id',
            Cell: ({ cell }: { cell: { row: { original: Callback } } }) => {
              // console.log(cell.row);
              const isTeacher = me.id === cell.row.original.teacher.id;
              return isTeacher ? (
                <MarkCallbackCompleted callback={cell.row.original} />
              ) : null;
            },
          },
        ],
      },
    ];
  }, [me, todayString]);

  return (
    <div>
      <p>
        You have {callbacksMemo?.length} item
        {callbacksMemo?.length === 1 ? '' : 's'} on Callback{' '}
      </p>
      <Table
        data={callbacksMemo || []}
        searchColumn="student.name"
        columns={columns}
        hiddenColumns={!showClassBlock ? ['block'] : []}
      />
    </div>
  );
});

export default CallbackTable;
