import gql from 'graphql-tag';
import type { GetStaticProps, NextPage } from 'next';
import { useMemo } from 'react';
import ChromebookCheck from '../components/Chromebooks/ChromebookCheck';
import ChromebookChecksData from '../components/Chromebooks/ChromebookChecksData';
import { useUser } from '../components/User';
import { smartGraphqlClient } from '../lib/smartGraphqlClient';
import isAllowed from '../lib/isAllowed';
import { useGQLQuery } from '../lib/useGqlQuery';

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

interface ChromebookCheck {
  id: string;
  message: string;
  time: string;
}

interface TaStudent {
  id: string;
  name: string;
  chromebookCheck: ChromebookCheck;
}

interface User {
  id: string;
  name: string;
  taStudents: TaStudent[];
}

interface ChromebooksPageProps {
  initialChromebookAssignments: {
    users: User[];
  };
}

const Chromebooks: NextPage<ChromebooksPageProps> = ({
  initialChromebookAssignments,
}) => {
  const me = useUser();
  const { data: chromebookAssignmentsData } = useGQLQuery(
    'Chromebook Assignments',
    GET_CHROMEBOOK_ASSIGNMENTS_QUERY,
    {},
    {
      staleTime: 1000,
      initialData: initialChromebookAssignments,
    },
  );

  const chromebookAssignments = useMemo(() => {
    if (!chromebookAssignmentsData) return [];
    return chromebookAssignmentsData.users;
  }, [chromebookAssignmentsData]);

  if (!me) return <p>loading...</p>;
  return (
    <div>
      <div className="flex justify-center gap-4 items-center">
        <h1 className="text-2xl">Chromebooks</h1>
      </div>
      {isAllowed(me, 'hasTA') && <ChromebookCheck />}
      {/* {display === "Chromebook Assignments" ? (
        <ChromebookAssignmentsData assignments={chromebookAssignments} />
      ) : null} */}

      <ChromebookChecksData taTeachers={chromebookAssignments} />
    </div>
  );
};

export const getStaticProps: GetStaticProps<ChromebooksPageProps> = async (
  context,
) => {
  // fetch PBIS Page data from the server
  const fetchChromebookAssignments = async (): Promise<{ users: User[] }> =>
    smartGraphqlClient.request(GET_CHROMEBOOK_ASSIGNMENTS_QUERY);

  const initialChromebookAssignments = await fetchChromebookAssignments();

  return {
    props: {
      initialChromebookAssignments,
    }, // will be passed to the page component as props
    revalidate: 1200, // In seconds
  };
};

export default Chromebooks;
