import gql from "graphql-tag";
import React, { useMemo, useState } from "react";
import { useGQLQuery } from "../lib/useGqlQuery";
import { GraphQLClient } from "graphql-request";
import { endpoint, prodEndpoint } from "../config";
import GradientButton from "../components/styles/Button";
import ChromebookAssignmentsData from "../components/Chromebooks/ChromebookAssignmentsData";
import ChromebookChecksData from "../components/Chromebooks/ChromebookChecksData";

const GET_CHROMEBOOK_ASSIGNMENTS_QUERY = gql`
  query GET_CHROMEBOOK_ASSIGNMENTS_QUERY {
    chromebookAssignments {
      id
      student {
        id
        name
      }
      teacher {
        id
        name
      }
      number
      checkLogCount
      checkLog(orderBy: { time: asc }) {
        id
        time
        message
      }
    }
  }
`;

export default function Chromebooks({ initialChromebookAssignments }) {
  const [display, setDisplay] = useState("Chromebook Checks");

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
    return chromebookAssignmentsData.chromebookAssignments;
  }, [chromebookAssignmentsData]);

  const handleDisplayButtonClick = () => {
    if (display === "Chromebook Assignments") {
      setDisplay("Chromebook Checks");
    }
    if (display === "Chromebook Checks") {
      setDisplay("Chromebook Assignments");
    }
  };

  return (
    <div>
      <div className="flex justify-center gap-4 items-center">
        <h1 className="text-2xl">Chromebooks</h1>
        <GradientButton onClick={handleDisplayButtonClick}>
          {display}
        </GradientButton>
      </div>
      {display === "Chromebook Assignments" ? (
        <ChromebookAssignmentsData assignments={chromebookAssignments} />
      ) : null}
      {display === "Chromebook Checks" ? (
        <ChromebookChecksData assignments={chromebookAssignments} />
      ) : null}
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
