import Link from 'next/link';
import { useMemo } from 'react';
import { callbackDisabled } from '../../config';
import { blockColorGroups, blockRotation } from '../../lib/blockNames';
import { lastNameCommaFirstName } from '../../lib/lastNameCommaFirstName';
import BlockLabel from '../BlockLabel';
import Table from '../Table';

interface BlockTeacher {
  id: string;
  name: string;
}

interface Parent {
  id: string;
  name: string;
  email: string;
}

interface Student {
  id: string;
  name: string;
  preferredName?: string;
  studentPbisCardsCount?: number;
  studentCardCountInLastWeek?: number;
  callbackCount?: number;
  callbackItemsCount?: number;
  averageTimeToCompleteCallback?: number;
  block1Teacher?: BlockTeacher;
  block2Teacher?: BlockTeacher;
  block3Teacher?: BlockTeacher;
  block4Teacher?: BlockTeacher;
  block5Teacher?: BlockTeacher;
  block6Teacher?: BlockTeacher;
  block7Teacher?: BlockTeacher;
  block8Teacher?: BlockTeacher;
  block9Teacher?: BlockTeacher;
  block10Teacher?: BlockTeacher;
  block11Teacher?: BlockTeacher;
  block12Teacher?: BlockTeacher;
  parent?: any;
  studentDisciplineCount?: number;
}

interface ViewTaStudentTableProps {
  users: Student[];
  title?: string;
  discipline?: boolean;
}

const teacherForBlock = (
  student: Student,
  block: number,
): BlockTeacher | undefined =>
  student[`block${block}Teacher` as keyof Student] as BlockTeacher | undefined;

function TeacherLink({ teacher }: { teacher?: BlockTeacher }) {
  if (!teacher?.id) return null;
  return <Link href={`/userProfile/${teacher.id}`}>{teacher.name}</Link>;
}

export default function ViewTaStudentTable({
  users,
  title,
  discipline = false,
}: ViewTaStudentTableProps) {
  const columns = useMemo(
    () => [
      {
        Header: title || 'Students',
        columns: [
          {
            Header: 'Name',
            accessor: 'name',
            Cell: ({ row }: { row: { original: Student } }) => {
              const { name, preferredName } = row.original;
              const formattedName = lastNameCommaFirstName(name);
              const nameToShow = preferredName
                ? `${formattedName} - (${preferredName})`
                : formattedName;
              return (
                <Link href={`/userProfile/${row.original.id}`}>
                  {nameToShow}
                </Link>
              );
            },
          },

          {
            Header: 'PBIS Cards',
            accessor: 'studentPbisCardsCount',
          },
          {
            Header: 'This Week PBIS Cards',
            accessor: 'studentCardCountInLastWeek',
          },
          {
            Header: 'Callback',
            accessor: 'callbackCount',
          },
          {
            Header: 'Total Callbacks',
            accessor: 'callbackItemsCount',
          },
          {
            Header: 'Average days on callback',
            accessor: 'averageTimeToCompleteCallback',
          },
          // One column per colour. Most students keep the same teacher across
          // the A/B rotation, so only the ones who don't show both halves.
          ...blockColorGroups().map(({ color, name, blockA, blockB }) => ({
            Header: () => <BlockLabel name={name} color={color} />,
            id: `block${blockA}Teacher`,
            accessor: `block${blockA}Teacher.name`,
            Cell: ({ row }: { row: { original: Student } }) => {
              const student = row.original;
              const teacherA = teacherForBlock(student, blockA);
              const teacherB = blockB
                ? teacherForBlock(student, blockB)
                : undefined;

              if (!blockB || teacherA?.id === teacherB?.id) {
                return <TeacherLink teacher={teacherA} />;
              }
              return (
                <div className="flex flex-col">
                  {[blockA, blockB].map((block) => (
                    <span key={block}>
                      <span className="opacity-70 mr-1">
                        {blockRotation(block)}:
                      </span>
                      <TeacherLink teacher={teacherForBlock(student, block)} />
                    </span>
                  ))}
                </div>
              );
            },
          })),
          {
            Header: 'Parent Account',
            accessor: 'parent',
            Cell: ({ cell }: { cell: { value?: Parent[] } }) => {
              const parentAcountExist = cell.value?.length > 0;
              // console.log(parentAcountExist);
              return parentAcountExist ? '✅' : '❌';
            },
          },
          {
            Header: 'ODR',
            accessor: 'studentDisciplineCount',
          },
          // {
          //   Header: "Chromebook",
          //   accessor: "ChromebookChecks",
          //   Cell: ({ cell }) => {
          //     const [showTooltip, setShowTooltip] = useState(false);
          //     const chromebookCheckExist = cell.value?.length > 0;
          //     const icon = "";
          //     const count = cell.value?.length;
          //     const passedCount = cell.value?.filter(
          //       (item) => item.message === "Passed"
          //     )?.length;
          //     const failedCount = cell.value?.filter(
          //       (item) => item.message !== "Passed"
          //     )?.length;
          //     if (count === passedCount) icon = "✅";
          //     if (count === failedCount) icon = "❌";
          //     if (!count) icon = "🅾️";
          //     if (count > passedCount && count > failedCount) icon = "⚠️";
          //     return (
          //       <div
          //         onMouseEnter={() => setShowTooltip(true)}
          //         onMouseLeave={() => setShowTooltip(false)}
          //       >
          //         {showTooltip && (
          //           <div
          //             style={{
          //               position: "absolute",
          //               backgroundColor: "white",
          //               border: "1px solid black",
          //               padding: "1rem",
          //               borderRadius: "5px",
          //               boxShadow: "0 0 10px 0 rgba(0,0,0,0.2)",
          //               zIndex: 1,
          //               width: "max-content",
          //               transform: "translateX(-50%)",
          //             }}
          //           >
          //             <div>Passed: {passedCount}</div>
          //             <div>Failed: {failedCount}</div>
          //             {cell.value
          //               ?.filter((item) => item.message !== "Passed")
          //               ?.map((item) => (
          //                 <div key={item.id}>
          //                   {item.message} -{" "}
          //                   {new Date(item.time).toLocaleDateString()}
          //                 </div>
          //               ))}
          //           </div>
          //         )}
          //         <span>{icon}</span> {count}
          //       </div>
          //     );
          //   },
          // },
        ],
      },
    ],
    [title],
  );

  const sortedStudents = useMemo(() => {
    if (!users) return [];
    return users.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      // sort by last name
      const aLastName = aName.split(' ')[1];
      const bLastName = bName.split(' ')[1];
      if (aLastName < bLastName) return -1;
      if (aLastName > bLastName) return 1;
      // if last names are the same, sort by first name
      const aFirstName = aName.split(' ')[0];
      const bFirstName = bName.split(' ')[0];
      if (aFirstName < bFirstName) return -1;
      if (aFirstName > bFirstName) return 1;
      return 0;
    });
  }, [users]);

  const hiddenColumns = discipline
    ? ['ChromebookChecks']
    : ['studentDisciplineCount'];
  if (callbackDisabled) {
    hiddenColumns.push(
      'callbackCount',
      'callbackItemsCount',
      'averageTimeToCompleteCallback',
    );
  }
  return (
    <div>
      <Table
        data={sortedStudents || []}
        columns={columns}
        searchColumn="name"
        showSearch={false}
        hiddenColumns={hiddenColumns}
      />
    </div>
  );
}
