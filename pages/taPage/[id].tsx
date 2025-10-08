import gql from 'graphql-tag';
import { GetServerSideProps, NextPage } from 'next';
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
import { callbackDisabled } from '../../config';
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

interface TaPageProps {
  query: {
    id: string;
  };
}

const TA: NextPage<TaPageProps> = ({ query }) => {
  const me = useUser();
  const { data, isLoading, error, refetch } = useGQLQuery(
    `taInfo-${query.id}`,
    TA_INFO_QUERY,
    {
      id: query.id,
    },
    {
      enabled: !!me,
      staleTime: 0,
    },
  );
  const { data: existingChecks } = useGQLQuery(
    `TAChromebookChecks-${query.id}`,
    GET_TA_CHROMEBOOK_ASSIGNMENTS_QUERY,
    { id: query.id },
  );
  // get the callbacks from each student in the ta - memoized to prevent infinite rerenders
  const allTaCallbacksFlattened = useMemo(() => {
    const allTaCallbacks =
      data?.taTeacher?.taStudents?.map(
        (student: TaStudent) => student.callbackItems || null,
      ) || [];
    return [].concat(...allTaCallbacks.filter(Boolean)) || [];
  }, [data?.taTeacher?.taStudents]);

  const isAllowedPbisCardCounting =
    me?.id === data?.taTeacher?.id || me?.canManagePbis;

  const students = useMemo(
    () =>
      data?.taTeacher?.taStudents
        ?.map((student: TaStudent) => {
          const existingCheck = existingChecks?.user?.taStudents?.find(
            (check: any) => check.id === student.id,
          );
          return {
            ...student,
            ChromebookChecks: existingCheck
              ? existingCheck.chromebookCheck
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
            <div className="flex items-center gap-4 mb-6">
              <CountPhysicalCards taStudents={students} refetch={refetch} />
              <ChromebookCheck teacherId={query.id} />
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

export const getServerSideProps: GetServerSideProps<TaPageProps> = async ({
  params,
}) => {
  return {
    props: {
      query: { id: params?.id as string },
    },
  };
};

export default TA;
