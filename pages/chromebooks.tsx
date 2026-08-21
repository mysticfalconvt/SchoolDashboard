import gql from 'graphql-tag';
import type { GetStaticProps, NextPage } from 'next';
import { useMemo } from 'react';
import ChromebookChecksData from '../components/Chromebooks/ChromebookChecksData';
import CreateSingleChromebookCheck from '../components/Chromebooks/CreateSingleChromebookCheck';
import { useUser } from '../components/User';
import isAllowed from '../lib/isAllowed';
import { smartGraphqlClient } from '../lib/smartGraphqlClient';
import { useGQLQuery } from '../lib/useGqlQuery';

const GET_CHROMEBOOK_CHECKS_QUERY = gql`
  query GET_CHROMEBOOK_CHECKS_QUERY {
    chromebookChecks(orderBy: { time: desc }) {
      id
      message
      time
      student {
        id
        name
      }
      classroom {
        id
        name
      }
    }
  }
`;

interface ChromebookCheck {
  id: string;
  message: string;
  time: string;
  student: { id: string; name: string } | null;
  classroom: { id: string; name: string } | null;
}

interface ChromebooksPageProps {
  initialChromebookChecks: {
    chromebookChecks: ChromebookCheck[];
  };
}

const Chromebooks: NextPage<ChromebooksPageProps> = ({
  initialChromebookChecks,
}) => {
  const me = useUser();
  const { data: chromebookChecksData } = useGQLQuery(
    'Chromebook Checks',
    GET_CHROMEBOOK_CHECKS_QUERY,
    {},
    {
      staleTime: 1000,
      initialData: initialChromebookChecks,
    },
  );

  const chromebookChecks = useMemo(
    () => chromebookChecksData?.chromebookChecks ?? [],
    [chromebookChecksData],
  );

  if (!me) return <p>loading...</p>;
  return (
    <div>
      <div className="flex justify-center gap-4 items-center">
        <h1 className="text-2xl">Chromebooks</h1>
      </div>
      <div className="flex justify-center gap-4 items-center">
        {isAllowed(me, 'isStaff') && <CreateSingleChromebookCheck />}
      </div>

      <ChromebookChecksData checks={chromebookChecks} />
    </div>
  );
};

export const getStaticProps: GetStaticProps<ChromebooksPageProps> = async (
  context,
) => {
  const fetchChromebookChecks = async (): Promise<{
    chromebookChecks: ChromebookCheck[];
  }> => smartGraphqlClient.request(GET_CHROMEBOOK_CHECKS_QUERY);

  const initialChromebookChecks = await fetchChromebookChecks();

  return {
    props: {
      initialChromebookChecks,
    }, // will be passed to the page component as props
    revalidate: 1200, // In seconds
  };
};

export default Chromebooks;
