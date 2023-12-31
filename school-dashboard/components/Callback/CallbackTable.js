import Link from "next/link";
import { useMemo } from "react";
import styled from "styled-components";
import getDisplayName from "../../lib/displayName";
import Table from "../Table";
import { useUser } from "../User";
import CallbackMessagesForTable from "./CallbackMessagesForTable";
import MarkCallbackCompleted from "./MarkCallbackCompleted";
import gql from "graphql-tag";
import { useGQLQuery } from "../../lib/useGqlQuery";

export const ToolTipStyles = styled.div`
  position: relative;
  display: inline-block;
  .toolTipText {
    visibility: hidden;
    width: clamp(200px, 30vw, 60vw);
    background-color: rgba(0, 0, 0, 0.8);
    color: #fff;
    text-align: center;
    border-radius: 6px;
    padding: 5px 5px;

    /* Position the tooltip */
    position: absolute;
    z-index: 1;
  }

  :hover .toolTipText {
    visibility: visible;
  }
`;

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

export default function CallbackTable({ callbacks, showClassBlock = false }) {
  const me = useUser();

  const { data } = useGQLQuery(
    "studentsByBlock",
    GET_STUDENTS_BY_BLOCK_QUERY,
    {
      id: me?.id,
    },
    {
      enabled: !!me && !!showClassBlock,
    }
  );
  const studentsByBlock = useMemo(() => {
    const students = data?.user;
    const B1 = students?.block1Students?.map((student) => student.id);
    const B2 = students?.block2Students?.map((student) => student.id);
    const B3 = students?.block3Students?.map((student) => student.id);
    const B4 = students?.block4Students?.map((student) => student.id);
    const B5 = students?.block5Students?.map((student) => student.id);
    const B6 = students?.block6Students?.map((student) => student.id);
    const B7 = students?.block7Students?.map((student) => student.id);
    const B8 = students?.block8Students?.map((student) => student.id);
    const B9 = students?.block9Students?.map((student) => student.id);
    const B10 = students?.block10Students?.map((student) => student.id);
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
    const callbackWithName = callbacks?.map((callback) => {
      const name = getDisplayName(callback.student);
      const student = { ...callback.student, name };
      // check which block student is in from studentsByBlock
      const block =
        Object.keys(studentsByBlock).find((block) => {
          const students = studentsByBlock[block];
          return students?.includes(student.id);
        }) || "n/a";

      return { ...callback, student, block };
    });
    return callbackWithName.sort((a, b) => {
      if (a.student.name < b.student.name) {
        return -1;
      }
      if (a.student.name > b.student.name) {
        return 1;
      }
      return 0;
    });
  }, [callbacks, studentsByBlock]);
  const columns = useMemo(
    () => [
      {
        Header: "Callback",
        columns: [
          {
            Header: "Student",
            accessor: "student.name",
            Cell: ({ cell }) => (
              <Link
                href={`/userProfile/${cell?.row?.original?.student?.id || ""}`}
              >
                {cell.value}
              </Link>
            ),
          },
          {
            Header: "Teacher",
            accessor: "teacher.name",
            Cell: ({ cell }) => (
              <Link
                href={`/userProfile/${cell?.row?.original?.teacher?.id || ""}`}
              >
                {cell.value}
              </Link>
            ),
          },
          {
            Header: "Assignment",
            accessor: "title",
            Cell: ({ cell }) => (
              <Link href={`/callback/${cell.row.original.id}`}>
                {cell.value}
              </Link>
            ),
          },
          {
            Header: "Description",
            accessor: "description",
            Cell: ({ cell }) => {
              let shortDescription = cell.value
                .split(" ")
                .reduce((acc, word) => {
                  if (acc.length > 50) {
                    return acc;
                  }
                  return `${acc} ${word}`;
                }, "");
              // if description was shortened add ...
              if (shortDescription.length < cell.value.length) {
                shortDescription = `${shortDescription}...`;
              }
              return (
                <>
                  <ToolTipStyles>
                    <Link href={`/callback/${cell.row.original.id}`}>
                      {shortDescription}
                    </Link>
                    <span className="toolTipText">{cell.value}</span>
                  </ToolTipStyles>
                </>
              );
            },
          },
          {
            Header: "Date Assigned",
            accessor: "dateAssigned",
            Cell: ({ cell: { value } }) => {
              const today = new Date().toLocaleDateString();
              const displayDate = new Date(value).toLocaleDateString();
              const isToday = today === displayDate;
              return isToday ? `📆 Today 📆` : displayDate;
            },
          },
          {
            Header: "Completed",
            accessor: "dateCompleted",
            Cell: ({ cell: { value } }) => {
              if (!value) {
                return <>---</>;
              }
              const today = new Date().toLocaleDateString();
              const displayDate = new Date(value).toLocaleDateString();
              const isToday = today === displayDate;
              return isToday ? `📆 Today 📆` : displayDate;
            },
          },
          {
            Header: "Link",
            accessor: "link",
            Cell: ({ cell: { value } }) => (
              <Link
                href={value?.startsWith("http") ? value : `http://${value}`}
              >
                {value ? "Link" : ""}
              </Link>
            ),
          },
          {
            Header: "Block",
            accessor: "block",
          },
        ],
      },
      {
        Header: "Message",
        columns: [
          {
            Header: "Message",
            accessor: "messageFromTeacher",
            Cell: ({ cell }) => {
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
        Header: "Complete",
        columns: [
          {
            Header: "Mark Completed",
            accessor: "id",
            Cell: ({ cell }) => {
              // console.log(cell.row);
              const isTeacher = me.id === cell.row.original.teacher.id;
              return isTeacher ? (
                <MarkCallbackCompleted callback={cell.row.original} />
              ) : null;
            },
          },
        ],
      },
    ],
    [me]
  );

  return (
    <div>
      <p>
        You have {callbacksMemo.length} item
        {callbacksMemo.length === 1 ? "" : "s"} on Callback{" "}
      </p>
      <Table
        data={callbacksMemo || []}
        searchColumn="student.name"
        columns={columns}
        hiddenColumns={!showClassBlock ? ["block"] : []}
      />
    </div>
  );
}
