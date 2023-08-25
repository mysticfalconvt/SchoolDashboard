import { gql, GraphQLClient } from "graphql-request";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import DisplayError from "../components/ErrorMessage";
import GradientButton from "../components/styles/Button";
import Table from "../components/Table";
import { useGQLQuery } from "../lib/useGqlQuery";
import Loading from "../components/Loading";
import NewUpdateUsers from "../components/users/NewUpdateUsers";
import isAllowed from "../lib/isAllowed";
import { useUser } from "../components/User";
import NewStaff from "../components/users/NewStaff";
import { endpoint, prodEndpoint } from "../config";

const GET_ALL_STUDENTS = gql`
  query GET_ALL_STUDENTS {
    students: users(
      where: {
        AND: [{ NOT: { taTeacher: null } }, { isStudent: { equals: true } }]
      }
    ) {
      id
      name
      preferredName
      taTeacher {
        name
        id
      }
      callbackCount
      YearPbisCount: studentPbisCardsCount
      averageTimeToCompleteCallback
      individualPbisLevel
      callbackItemsCount
      chromebookCheck {
        id
        time
        message
        student {
          id
          name
        }
      }
    }
  }
`;

const GET_ALL_TEACHERS = gql`
  query GET_ALL_TEACHERS {
    teachers: users(
      where: {
        OR: [{ hasTA: { equals: true } }, { isTeacher: { equals: true } }]
      }
      orderBy: { name: asc }
    ) {
      id
      name
      hasTA
      callbackCount

      virtualCards: teacherPbisCardsCount(
        where: { category: { not: { contains: "physical" } } }
      )
      averageTimeToCompleteCallback
      callbackAssignedCount(where: { dateCompleted: null })
      totalCallback: callbackAssignedCount

      currentTaWinner {
        name
        id
      }
      previousTaWinner {
        name
        id
      }
    }
  }
`;

const ButtonStyles = styled.div`
  display: flex;
  margin-bottom: 3.5rem;
  .hide {
    opacity: 0;
    visibility: hidden;
    transition: all 1s ease-in-out;
  }
  .show {
    opacity: 1;
    transition: all 1s ease-in-out;
  }
  button {
    transition: all 1s ease-in-out;
    position: absolute;
  }
  /* button {
    border: 1px solid var(--background-color);
    position: absolute;
    :hover {
      border: 2px solid var(--red);
    }
  }
  .hide {
    opacity: 0;
    visibility: hidden;
  }
  .show {
    opacity: 1;
  }
  padding-bottom: 3.5rem; */
`;

const ArrayValues = ({ values }) => (
  <>
    {values.map((arrayValue, idx) => (
      <span key={idx} className="badge">
        {arrayValue.name}
      </span>
    ))}
  </>
);

export default function Users(props) {
  const me = useUser();
  const [userSortType, setUserSortType] = useState("student");
  const cachedStudents = props?.students;
  const cachedTeachers = props?.teachers;
  // stale time of 2 minutes
  const staleTime = 2 * 60 * 1000;
  const {
    data: students,
    isLoading: studentLoading,
    error,
  } = useGQLQuery(
    "allStudents",
    GET_ALL_STUDENTS,
    {
      date: new Date(),
    },
    {
      enabled: userSortType === "student",
      initialData: cachedStudents,
      staleTime,
    }
  );
  const { data: teachers, isLoading: teacherLoading } = useGQLQuery(
    "allTeachers",
    GET_ALL_TEACHERS,
    {},
    {
      enabled: userSortType === "staff",
      initialData: cachedTeachers,
      staleTime,
    }
  );
  const studentColumns = useMemo(
    () => [
      {
        Header: "Students",
        columns: [
          {
            Header: "Name",
            accessor: "name",
            Cell: ({ row }) => {
              const { name } = row.original;
              const nameWithFirstLetterUpperCase = name
                .split(" ")
                .map((name) => name.charAt(0).toUpperCase() + name.slice(1))
                .join(" ");

              const { preferredName } = row.original;
              const nameToShow = preferredName
                ? `${nameWithFirstLetterUpperCase} - (${preferredName})`
                : nameWithFirstLetterUpperCase;
              return (
                <Link href={`/userProfile/${row.original.id}`}>
                  {nameToShow}
                </Link>
              );
            },
          },
          // {
          //   Header: 'Type',
          //   accessor: 'role',
          //   Cell: ({ cell: { value } }) => <ArrayValues values={value || []} />,
          // },
          {
            Header: "TA Teacher",
            accessor: "taTeacher.name",
            Cell: ({ row }) => {
              const showLink = !!row.original?.taTeacher?.id;
              //   console.log(showLink);
              if (showLink)
                return (
                  <Link href={`/userProfile/${row.original?.taTeacher?.id}`}>
                    {row.original?.taTeacher?.name}
                  </Link>
                );
              return null;
            },
          },

          {
            Header: "Callback",
            accessor: "callbackCount",
          },
          {
            Header: "Total Callback",
            accessor: "callbackItemsCount",
          },
          {
            Header: "Yearly PBIS",
            accessor: "YearPbisCount",
          },
          {
            Header: "Individual PBIS Level",
            accessor: "individualPbisLevel",
          },
          {
            Header: "Average days on callback",
            accessor: "averageTimeToCompleteCallback",
          },
          {
            Header: "Chromebook",
            accessor: "chromebookCheck",
            Cell: ({ cell }) => {
              const [showTooltip, setShowTooltip] = useState(false);
              const chromebookCheckExist = cell.value?.length > 0;
              const icon = "";
              const count = cell.value?.length;
              const passedCount = cell.value?.filter(
                (item) => item.message === "Passed"
              )?.length;
              const failedCount = cell.value?.filter(
                (item) => item.message !== "Passed"
              )?.length;
              if (count === passedCount) icon = "✅";
              if (count === failedCount) icon = "❌";
              if (!count) icon = "🅾️";
              if (count > passedCount && count > failedCount) icon = "⚠️";
              return (
                <div
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  {showTooltip && (
                    <div
                      style={{
                        position: "absolute",
                        backgroundColor: "white",
                        border: "1px solid black",
                        padding: "1rem",
                        borderRadius: "5px",
                        boxShadow: "0 0 10px 0 rgba(0,0,0,0.2)",
                        zIndex: 1,
                        width: "max-content",
                        transform: "translateX(-50%)",
                      }}
                    >
                      <div>Passed: {passedCount}</div>
                      <div>Failed: {failedCount}</div>
                      {cell.value
                        ?.filter((item) => item.message !== "Passed")
                        ?.map((item) => (
                          <div key={item.id}>
                            {item.message} -{" "}
                            {new Date(item.time).toLocaleDateString()}
                          </div>
                        ))}
                    </div>
                  )}
                  <span>{icon}</span> {count}
                </div>
              );
            },
          },
        ],
      },
    ],
    []
  );

  const teacherColumns = useMemo(
    () => [
      {
        Header: "Teachers",
        columns: [
          {
            Header: "Name",
            accessor: "name",
            Cell: ({ row }) => (
              <>
                <Link href={`/userProfile/${row.original.id}`}>
                  {row.original.name}
                </Link>
                {isAllowed(me, "canManagePbis") && row.original.hasTA && (
                  <Link href={`/taPage/${row.original.id}`}> - TA</Link>
                )}
              </>
            ),
          },

          {
            Header: "Callback",
            accessor: "callbackCount",
          },
          {
            Header: "Total Callback",
            accessor: "totalCallback",
          },
          // {
          //   Header: 'Weekly PBIS',
          //   accessor: 'PbisCardCount',
          // },
          // {
          //   Header: 'Yearly PBIS',
          //   accessor: 'YearPbisCount',
          // },
          {
            Header: "Virtual PBIS Given",
            accessor: "virtualCards",
          },
          // {
          //   Header: "Latest PBIS Winner",
          //   accessor: "currentTaWinner.name",
          // },
          // {
          //   Header: "Previous PBIS Winner",
          //   accessor: "previousTaWinner.name",
          // },
          // {
          //   Header: 'TA Count',
          //   accessor: '_taStudentsMeta.count',
          // },
        ],
      },
    ],
    [me]
  );

  const isLoading = studentLoading || teacherLoading;

  const sortedStudents = useMemo(() => {
    if (!students) return [];
    return (
      students?.students?.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        // sort by last name
        const aLastName = aName.split(" ")[1];
        const bLastName = bName.split(" ")[1];
        if (aLastName < bLastName) return -1;
        if (aLastName > bLastName) return 1;
        // if last names are the same, sort by first name
        const aFirstName = aName.split(" ")[0];
        const bFirstName = bName.split(" ")[0];
        if (aFirstName < bFirstName) return -1;
        if (aFirstName > bFirstName) return 1;
        return 0;
      }) || []
    );
  }, [students]);

  const sortedTeachers = useMemo(() => {
    if (!teachers) return [];
    return (
      teachers?.teachers?.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        // sort by last name
        const aLastName = aName.split(" ")[1];
        const bLastName = bName.split(" ")[1];
        if (aLastName < bLastName) return -1;
        if (aLastName > bLastName) return 1;
        // if last names are the same, sort by first name
        const aFirstName = aName.split(" ")[0];
        const bFirstName = bName.split(" ")[0];
        if (aFirstName < bFirstName) return -1;
        if (aFirstName > bFirstName) return 1;
        return 0;
      }) || []
    );
  }, [teachers]);
  if (!me?.isStaff) return <p>User does not have access</p>;
  // if (studentLoading) return <Loading />;
  if (error) return <DisplayError>{error.message}</DisplayError>;
  return (
    <div>
      <ButtonStyles>
        <GradientButton
          onClick={() => {
            setUserSortType("staff");
          }}
          className={userSortType === "staff" ? "hide" : "show"}
        >
          Show Teachers
        </GradientButton>
        <GradientButton
          onClick={() => {
            setUserSortType("student");
          }}
          className={userSortType === "student" ? "hide" : "show"}
        >
          Show Students
        </GradientButton>
      </ButtonStyles>
      {/* {isAllowed(me, 'isSuperAdmin') && <NewUpdateUsers />}
      {isAllowed(me, 'isSuperAdmin') && <NewStaff />} */}
      {userSortType === "staff" && (
        <Table
          data={sortedTeachers || []}
          columns={teacherColumns}
          searchColumn="name"
        />
      )}
      {userSortType === "student" && (
        <Table
          data={sortedStudents || []}
          columns={studentColumns}
          searchColumn="name"
        />
      )}
    </div>
  );
}

export async function getStaticProps(context) {
  // console.log(context);
  // fetch PBIS Page data from the server
  const headers = {
    credentials: "include",
    mode: "cors",
    headers: {
      authorization: `test auth for keystone`,
    },
  };

  const graphQLClient = new GraphQLClient(
    process.env.NODE_ENV === "development" ? endpoint : prodEndpoint,
    headers
  );
  const fetchStudents = async () => graphQLClient.request(GET_ALL_STUDENTS);
  const fetchTeachers = async () => graphQLClient.request(GET_ALL_TEACHERS);

  const students = await fetchStudents();
  const teachers = await fetchTeachers();

  return {
    props: {
      students,
      teachers,
    }, // will be passed to the page component as props
    revalidate: 1200, // In seconds
  };
}
