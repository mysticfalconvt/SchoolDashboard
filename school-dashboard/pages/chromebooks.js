import gql from "graphql-tag";
import React, { useMemo, useState } from "react";
import { useGQLQuery } from "../lib/useGqlQuery";
import { GraphQLClient } from "graphql-request";
import { endpoint, prodEndpoint } from "../config";

const GET_ALL_CHROMEBOOK_CHECKS_QUERY = gql`
  query GET_CHROMEBOOKS_QUERY {
    chromebookChecks {
      id
      time
      message
      assignment {
        id
      }
    }
  }
`;

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
    }
  }
`;

export default function Chromebooks({
  initialChromebookChecks,
  initialChromebookAssignments,
}) {
  const [display, setDisplay] = useState("assignments");
  const { data: chromebookChecksData } = useGQLQuery(
    "Chromebooks",
    GET_ALL_CHROMEBOOK_CHECKS_QUERY,
    {},
    {
      staleTime: 1000,
      initialData: initialChromebookChecks,
    }
  );
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

  const chromebookChecks = useMemo(() => {
    if (!chromebookChecksData) return [];
    return chromebookChecksData.chromebookChecks;
  }, [chromebookChecksData]);

  return <div>chromebooks</div>;
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
  const fetchChromebookChecks = async () =>
    graphQLClient.request(GET_ALL_CHROMEBOOK_CHECKS_QUERY);
  const fetchChromebookAssignments = async () =>
    graphQLClient.request(GET_CHROMEBOOK_ASSIGNMENTS_QUERY);

  const initialChromebookChecks = await fetchChromebookChecks();
  const initialChromebookAssignments = await fetchChromebookAssignments();

  return {
    props: {
      initialChromebookChecks,
      initialChromebookAssignments,
    }, // will be passed to the page component as props
    revalidate: 1200, // In seconds
  };
}
