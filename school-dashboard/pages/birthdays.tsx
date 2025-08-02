import gql from 'graphql-tag';
import type { GetStaticProps, NextPage } from 'next';
import BirthdaysTable from '../components/Birthdays/BirthdaysTable';
import { useUser } from '../components/User';
import { endpoint, prodEndpoint } from '../config';
import { GraphQLClient } from '../lib/graphqlClient';
import { useGQLQuery } from '../lib/useGqlQuery';

const ALL_BIRTHDAYS_QUERY = gql`
  query ALL_BIRTHDAYS_QUERY {
    birthdays {
      id
      cakeType
      date
      hasChosen
      hasDelivered
      student {
        id
        name
        taTeacher {
          id
          name
        }
      }
    }
  }
`;

interface Birthday {
  id: string;
  cakeType: string;
  date: string;
  hasChosen: boolean;
  hasDelivered: boolean;
  student: {
    id: string;
    name: string;
    taTeacher: {
      id: string;
      name: string;
    };
  };
}

interface BirthdayPageProps {
  initialBirthdays?: {
    birthdays: Birthday[];
  };
}

const BirthdayPage: NextPage<BirthdayPageProps> = (props) => {
  const me = useUser();
  const { data, isLoading, error } = useGQLQuery(
    'AllBirthdays',
    ALL_BIRTHDAYS_QUERY,
    {},
    {
      enabled: !!me,
      initialData: props?.initialBirthdays,
      staleTime: 1000 * 60 * 3,
    },
  );
  return (
    <div>
      <h1>Birthdays</h1>
      <BirthdaysTable birthdays={data?.birthdays} />
    </div>
  );
};

export const getStaticProps: GetStaticProps<BirthdayPageProps> = async (
  context,
) => {
  // console.log(context);

  const graphQLClient = new GraphQLClient(
    process.env.NODE_ENV === 'development' ? endpoint : prodEndpoint,
    {
      headers: {
        authorization: `test auth for keystone`,
      },
    },
  );
  const fetchBirthdayData = async (): Promise<{ birthdays: Birthday[] }> =>
    graphQLClient.request(ALL_BIRTHDAYS_QUERY);

  const initialBirthdays = await fetchBirthdayData();

  return {
    props: {
      initialBirthdays,
    }, // will be passed to the page component as props
    revalidate: 1200, // In seconds
  };
};

export default BirthdayPage;
