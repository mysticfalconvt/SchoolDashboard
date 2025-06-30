import gql from "graphql-tag";
import React, { useMemo } from "react";
import Link from "next/link";
import { GraphQLClient } from "graphql-request";
import Table from "../components/Table";
import { useGQLQuery } from "../lib/useGqlQuery";
import { endpoint, NUMBER_OF_BLOCKS, prodEndpoint } from "../config";

const ALL_TEACHERS_QUERY = gql`
  query BULLYING_DATA_QUERY {
    users(where: { hasClasses: { equals: true } }, orderBy: { name: asc }) {
      id
      name
      block1ClassName
      block1Assignment
      block1AssignmentLastUpdated
      block2ClassName
      block2Assignment
      block2AssignmentLastUpdated
      block3ClassName
      block3Assignment
      block3AssignmentLastUpdated
      block4ClassName
      block4Assignment
      block4AssignmentLastUpdated
      block5ClassName
      block5Assignment
      block5AssignmentLastUpdated
      block6ClassName
      block6Assignment
      block6AssignmentLastUpdated
      block7ClassName
      block7Assignment
      block7AssignmentLastUpdated
      block8ClassName
      block8Assignment
      block8AssignmentLastUpdated
      block9ClassName
      block9Assignment
      block9AssignmentLastUpdated
      block10ClassName
      block10Assignment
      block10AssignmentLastUpdated
    }
  }
`;

function DisplayClasswork({ data, block }) {
  if (!data) return null;

  const classname = data[`block${block}ClassName`];
  const assignment = data[`block${block}Assignment`];
  const lastUpdated = data[`block${block}AssignmentLastUpdated`];

  // Simple check if data exists without date calculations
  const hasData = classname && assignment && lastUpdated;

  // Format date deterministically to avoid hydration issues
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="max-w-full">
      {hasData ? (
        <>
          <h3 className="m-0 p-0 text-xl font-semibold">
            <strong>{classname}</strong>
          </h3>
          <p className="m-0 p-0 text-lg">
            <strong>{assignment}</strong>
          </p>
          <p className="m-0 p-0 text-lg">
            <strong>Last Updated: {formatDate(lastUpdated)}</strong>
          </p>
        </>
      ) : (
        <h3 className="m-0 p-0 text-xl font-semibold">No Data</h3>
      )}
    </div>
  );
}

export default function AllTeacherCurrentWork(props) {
  // Temporarily remove useUser to test hydration
  // const me = useUser();

  const { data } = useGQLQuery(
    "allTeachers",
    ALL_TEACHERS_QUERY,
    {},
    {
      staleTime: 1000 * 60 * 3,
      initialData: props?.initialWorkData,
    }
  );

  const columns = useMemo(() => {
    const columns = [
      {
        Header: "Teacher",
        columns: [
          {
            Header: "Name",
            accessor: "name",
            Cell: ({ cell }) => (
              <Link href={`/userProfile/${cell?.row?.original?.id || ""}`}>
                {cell.value}
              </Link>
            ),
          },
          {
            Header: "Block 1",
            accessor: "block1Assignment",
            Cell: ({ row }) => (
              <DisplayClasswork data={row.original} block="1" />
            ),
          },
          {
            Header: "Block 2",
            accessor: "block2Assignment",
            Cell: ({ row }) => (
              <DisplayClasswork data={row.original} block="2" />
            ),
          },
          {
            Header: "Block 3",
            accessor: "block3Assignment",
            Cell: ({ row }) => (
              <DisplayClasswork data={row.original} block="3" />
            ),
          },
          {
            Header: "Block 4",
            accessor: "block4Assignment",
            Cell: ({ row }) => (
              <DisplayClasswork data={row.original} block="4" />
            ),
          },
          {
            Header: "Block 5",
            accessor: "block5Assignment",
            Cell: ({ row }) => (
              <DisplayClasswork data={row.original} block="5" />
            ),
          },
          {
            Header: "Block 6",
            accessor: "block6Assignment",
            Cell: ({ row }) => (
              <DisplayClasswork data={row.original} block="6" />
            ),
          },
          {
            Header: "Block 7",
            accessor: "block7Assignment",
            Cell: ({ row }) => (
              <DisplayClasswork data={row.original} block="7" />
            ),
          },
          {
            Header: "Block 8",
            accessor: "block8Assignment",
            Cell: ({ row }) => (
              <DisplayClasswork data={row.original} block="8" />
            ),
          },
          {
            Header: "Block 9",
            accessor: "block9Assignment",
            Cell: ({ row }) => (
              <DisplayClasswork data={row.original} block="9" />
            ),
          },
          {
            Header: "Block 10",
            accessor: "block10Assignment",
            Cell: ({ row }) => (
              <DisplayClasswork data={row.original} block="10" />
            ),
          },
        ],
      },
    ];
    const numberOfBlocksToRemove = 10 - NUMBER_OF_BLOCKS;
    // remove number of columns based on number of blocks
    return [
      {
        ...columns[0],
        columns: columns[0].columns.slice(
          0,
          columns[0].columns.length - numberOfBlocksToRemove
        ),
      },
    ];
  }, [NUMBER_OF_BLOCKS]);

  return (
    <div className="flex flex-col flex-wrap justify-around w-full">
      <h1 className="text-center text-2xl font-bold mb-6">All Teacher Current Work</h1>
      <Table data={data?.users || []} columns={columns} searchColumn="name" />
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
  const fetchTeacherWork = async () =>
    graphQLClient.request(ALL_TEACHERS_QUERY);

  const initialWorkData = await fetchTeacherWork();
  // console.log(initialWorkData.users);
  return {
    props: {
      initialWorkData,
    }, // will be passed to the page component as props
    revalidate: 1200, // In seconds
  };
}
