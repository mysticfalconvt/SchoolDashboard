import gql from "graphql-tag";
import React, { useMemo, useState } from "react";
import { useGQLQuery } from "../lib/useGqlQuery";
import { GraphQLClient } from "graphql-request";
import { endpoint, prodEndpoint } from "../config";
import GradientButton from "../components/styles/Button";
import ChromebookAssignmentsData from "../components/Chromebooks/ChromebookAssignmentsData";
import ChromebookChecksData from "../components/Chromebooks/ChromebookChecksData";
import isAllowed from "../lib/isAllowed";
import ChromebookCheck from "../components/Chromebooks/ChromebookCheck";
import { useUser } from "../components/User";

const GET_CHROMEBOOK_ASSIGNMENTS_QUERY = gql`
  query GET_CHROMEBOOK_ASSIGNMENTS_QUERY {
    users(where: { hasTA: { equals: true } }) {
      id
      name
      taStudents {
        id
        name
        chromebookCheck {
          id
          message
          time
        }
      }
    }
  }
`;

export default function Chromebooks({ initialChromebookAssignments }) {
  const me = useUser();
  const { data: chromebookAssignmentsData } = useGQLQuery(
    "Chromebook Assignments",
    GET_CHROMEBOOK_ASSIGNMENTS_QUERY,
    {},
    {
      staleTime: 1000,
      initialData: initialChromebookAssignments,
    }
  );

  const chromebookAssignments = useMemo(() => {
    if (!chromebookAssignmentsData) return [];
    return chromebookAssignmentsData.users;
  }, [chromebookAssignmentsData]);

  console.log("data", chromebookAssignments);
  if (!me) return <p>loading...</p>;
  return (
    <div>
      <div className="flex justify-center gap-4 items-center">
        <h1 className="text-2xl">Chromebooks</h1>
      </div>
      {isAllowed(me, "hasTA") && <ChromebookCheck taId={me.id} />}
      {/* {display === "Chromebook Assignments" ? (
        <ChromebookAssignmentsData assignments={chromebookAssignments} />
      ) : null} */}

      <ChromebookChecksData taTeachers={chromebookAssignments} />
    </div>
  );
}

export async function getStaticProps(context) {
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
  const fetchChromebookAssignments = async () =>
    graphQLClient.request(GET_CHROMEBOOK_ASSIGNMENTS_QUERY);

  const initialChromebookAssignments = await fetchChromebookAssignments();

  return {
    props: {
      initialChromebookAssignments,
    }, // will be passed to the page component as props
    revalidate: 1200, // In seconds
  };
}
