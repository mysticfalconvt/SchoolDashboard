import gql from 'graphql-tag';
import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import { useMemo } from 'react';
import CallbackTable from '../../components/Callback/CallbackTable';
import ChromebookCheck, {
  GET_TA_CHROMEBOOK_ASSIGNMENTS_QUERY,
} from '../../components/Chromebooks/ChromebookCheck';
import DisplayError from '../../components/ErrorMessage';
import Loading from '../../components/Loading';
import CountPhysicalCards from '../../components/PBIS/CountPhysicalCards';
import { useUser } from '../../components/User';
import ViewTaStudentTable from '../../components/users/ViewTaStudentTable';
import { callbackDisabled, endpoint, prodEndpoint } from '../../config';
import { GraphQLClient } from '../../lib/graphqlClient';
import { useGQLQuery } from '../../lib/useGqlQuery';

const TA_INFO_QUERY = gql`
  query TA_INFO_QUERY($id: ID!) {
    taTeacher: user(where: { id: $id }) {
      PbisCardCount
      taPbisCardCount
      name
      id
      email
      taTeamAveragePbisCardsPerStudent
      taTeam {
        teamName
        countedCards
        uncountedCards
        averageCardsPerStudent
        currentLevel
      }
      taStudents {
        averageTimeToCompleteCallback
        parent {
          name
          email
        }
        taTeacher {
          id
          name
        }
        id
        name
        preferredName
        parent {
          id
          name
          email
        }
        block1Teacher {
          name
          id
          block1Assignment
        }
        block2Teacher {
          name
          id
          block2Assignment
        }
        block3Teacher {
          name
          id
          block3Assignment
        }
        block4Teacher {
          name
          id
          block4Assignment
        }
        block5Teacher {
          name
          id
          block5Assignment
        }
        block6Teacher {
          name
          id
          block6Assignment
        }
        block7Teacher {
          name
          id
          block7Assignment
        }
        block8Teacher {
          name
          id
          block8Assignment
        }
        block9Teacher {
          name
          id
          block9Assignment
        }
        block10Teacher {
          name
          id
          block10Assignment
        }
        callbackCount
        studentCellPhoneViolationCount
        studentPbisCardsCount
        studentCardCountInLastWeek : studentPbisCardsCount(
          where: {
            dateGiven: {
              gte: "${new Date(
                new Date().getTime() - 7 * 24 * 60 * 60 * 1000,
              ).toISOString()}"
            }
          }
        )

        studentFocusStudentCount
        callbackItemsCount
        callbackItems(where: { dateCompleted: null }) {
          id
          teacher {
            id
            name
          }
          student {
            name
            preferredName
            id
          }
          link
          description
          title
          dateAssigned
          dateCompleted
          messageFromStudent
          messageFromTeacher
          messageFromStudentDate
          messageFromTeacherDate
        }
      }
    }
  }
`;

const TA_TEACHER_LIST_QUERY = gql`
  query TA_TEACHER_LIST_QUERY {
    users(where: { hasTA: { equals: true } }) {
      id
      name
      email
    }
  }
`;

interface TaStudent {
  averageTimeToCompleteCallback?: number;
  parent?: {
    name: string;
    email: string;
  };
  taTeacher?: {
    id: string;
    name: string;
  };
  id: string;
  name: string;
  preferredName?: string;
  block1Teacher?: {
    name: string;
    id: string;
    block1Assignment?: string;
  };
  block2Teacher?: {
    name: string;
    id: string;
    block2Assignment?: string;
  };
  block3Teacher?: {
    name: string;
    id: string;
    block3Assignment?: string;
  };
  block4Teacher?: {
    name: string;
    id: string;
    block4Assignment?: string;
  };
  block5Teacher?: {
    name: string;
    id: string;
    block5Assignment?: string;
  };
  block6Teacher?: {
    name: string;
    id: string;
    block6Assignment?: string;
  };
  block7Teacher?: {
    name: string;
    id: string;
    block7Assignment?: string;
  };
  block8Teacher?: {
    name: string;
    id: string;
    block8Assignment?: string;
  };
  block9Teacher?: {
    name: string;
    id: string;
    block9Assignment?: string;
  };
  block10Teacher?: {
    name: string;
    id: string;
    block10Assignment?: string;
  };
  callbackCount?: number;
  studentCellPhoneViolationCount?: number;
  studentPbisCardsCount: number;
  studentCardCountInLastWeek?: number;
  studentFocusStudentCount?: number;
  callbackItemsCount?: number;
  callbackItems?: any[];
  ChromebookChecks?: any[];
}

interface TaTeam {
  teamName: string;
  countedCards: number;
  uncountedCards: number;
  averageCardsPerStudent: number;
  currentLevel: number;
}

interface TaTeacher {
  PbisCardCount: number;
  taPbisCardCount: number;
  name: string;
  id: string;
  email: string;
  taTeamAveragePbisCardsPerStudent?: number;
  taTeam?: TaTeam;
  taStudents: TaStudent[];
}

interface TaPageProps {
  data: {
    taTeacher?: TaTeacher;
  };
  query: {
    id: string;
  };
}

const TA: NextPage<TaPageProps> = ({ data: initialData, query }) => {
  const me = useUser();
  const { data, isLoading, error, refetch } = useGQLQuery(
    `taInfo-${initialData?.taTeacher?.name}`,
    TA_INFO_QUERY,
    {
      id: query.id,
    },
    {
      enabled: !!me,
      initialData,
      staleTime: 0,
    },
  );
  const { data: existingChecks, isLoading: CBCheckLoading } = useGQLQuery(
    `TAChromebookChecks-${query.id}`,
    GET_TA_CHROMEBOOK_ASSIGNMENTS_QUERY,
    { id: query.id },
  );
  // get the callbacks from each student in the ta
  const allTaCallbacks =
    data?.taTeacher?.taStudents?.map(
      (student: TaStudent) => student.callbackItems || null,
    ) || [];
  const allTaCallbacksFlattened = [].concat(...allTaCallbacks) || [];

  const isAllowedPbisCardCounting =
    me?.id === data?.taTeacher?.id || me?.canManagePbis;

  const students = useMemo(
    () =>
      data?.taTeacher?.taStudents
        ?.map((student: TaStudent) => {
          const existingCheck = existingChecks?.users?.filter(
            (check: any) => check.id === student.id,
          );
          return {
            ...student,
            ChromebookChecks: existingCheck
              ? existingCheck[0].chromebookCheck
              : [],
          };
        })
        .sort((a: TaStudent, b: TaStudent) => a.name.localeCompare(b.name)) ||
      [],
    [data, existingChecks],
  );

  if (!me) return <Loading />;
  if (isLoading) return <Loading />;
  if (error) return <DisplayError error={error as any} />;
  const taTotalPbisCards = students.reduce(
    (acc: number, student: TaStudent) =>
      acc + (student.studentPbisCardsCount || 0),
    0,
  );
  const taStudentCount = students.length;
  const taAveragePbisCards =
    taStudentCount > 0 ? taTotalPbisCards / taStudentCount : 0;

  return (
    <div>
      <h1>{data?.taTeacher?.name}'s TA</h1>
      <p>{taStudentCount} students</p>
      <p>{taTotalPbisCards} total PBIS cards</p>
      <p>
        {data?.taTeacher?.taTeamAveragePbisCardsPerStudent || 0} average PBIS
        cards per student
      </p>
      {students.length > 0 && (
        <>
          {isAllowedPbisCardCounting && (
            <div style={{ display: 'flex' }}>
              <CountPhysicalCards taStudents={students} refetch={refetch} />
              <ChromebookCheck />
            </div>
          )}

          <ViewTaStudentTable users={students} title="TA Students" />
          {!callbackDisabled && (
            <CallbackTable callbacks={allTaCallbacksFlattened || []} />
          )}
        </>
      )}
    </div>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const graphQLClient = new GraphQLClient(
    process.env.NODE_ENV === 'development' ? endpoint : prodEndpoint,
    {
      headers: {
        authorization: `test auth for keystone`,
      },
    },
  );
  const fetchData = async (): Promise<{ users: any[] }> =>
    graphQLClient.request(TA_TEACHER_LIST_QUERY);
  const data = await fetchData();
  const usersToUse = data?.users || [];

  const paths =
    usersToUse?.map((user: any) => ({
      params: {
        id: user.id,
      },
    })) || [];
  return {
    paths,
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps<TaPageProps> = async ({
  params,
}) => {
  const graphQLClient = new GraphQLClient(
    process.env.NODE_ENV === 'development' ? endpoint : prodEndpoint,
    {
      headers: {
        authorization: `test auth for keystone`,
      },
    },
  );
  const fetchData = async () => {
    try {
      const dataFromFetch = await graphQLClient.request(TA_INFO_QUERY, {
        id: params?.id,
      });
      return dataFromFetch;
    } catch (e) {
      console.log(e);
      console.log('error', params?.id);
    }
  };
  const data = (await fetchData()) || {};

  return {
    props: {
      data,
      query: { id: params?.id as string },
    },
    revalidate: 60 * 60 * 1, // 1 hours (in seconds)
  };
};

export default TA;
