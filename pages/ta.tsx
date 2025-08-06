import gql from 'graphql-tag';
import React from 'react';
import CallbackTable from '../components/Callback/CallbackTable';
import DisplayError from '../components/ErrorMessage';
import Loading from '../components/Loading';
import CountPhysicalCards from '../components/PBIS/CountPhysicalCards';
import { useUser } from '../components/User';
import ViewTaStudentTable from '../components/users/ViewTaStudentTable';
import { useGQLQuery } from '../lib/useGqlQuery';

const TA_INFO_QUERY = gql`
  query TA_INFO_QUERY($id: ID!) {
    taTeacher: user(where: { id: $id }) {
      PbisCardCount
      taPbisCardCount
      name
      id
      email

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
        PbisCardCount

        studentFocusStudentCount
        YearPbisCount
        studentCardCountInLastWeek : studentPbisCardsCount(
          where: {
            dateGiven: {
              gte: "${new Date(
                new Date().getTime() - 7 * 24 * 60 * 60 * 1000,
              ).toISOString()}"
            }
          }
        )

        # studentPbisCards(take:10) {
        #   id
        #   cardMessage
        #   category
        #   teacher {
        #     id
        #     name
        #   }
        #   dateGiven
        # }
        callbackItems(where: { dateCompleted: null }) {
          id
          teacher {
            id
            name
          }
          student {
            name
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

interface Parent {
  id: string;
  name: string;
  email: string;
}

interface BlockTeacher {
  name: string;
  id: string;
  block1Assignment?: string;
  block2Assignment?: string;
  block3Assignment?: string;
  block4Assignment?: string;
  block5Assignment?: string;
  block6Assignment?: string;
  block7Assignment?: string;
  block8Assignment?: string;
  block9Assignment?: string;
  block10Assignment?: string;
}

interface CallbackItem {
  id: string;
  teacher: {
    id: string;
    name: string;
  };
  student: {
    name: string;
    id: string;
  };
  link?: string;
  description?: string;
  title?: string;
  dateAssigned?: string;
  dateCompleted?: string;
  messageFromStudent?: string;
  messageFromTeacher?: string;
  messageFromStudentDate?: string;
  messageFromTeacherDate?: string;
}

interface TaStudent {
  averageTimeToCompleteCallback?: number;
  parent?: Parent;
  taTeacher?: {
    id: string;
    name: string;
  };
  id: string;
  name: string;
  preferredName?: string;
  block1Teacher?: BlockTeacher;
  block2Teacher?: BlockTeacher;
  block3Teacher?: BlockTeacher;
  block4Teacher?: BlockTeacher;
  block5Teacher?: BlockTeacher;
  block6Teacher?: BlockTeacher;
  block7Teacher?: BlockTeacher;
  block8Teacher?: BlockTeacher;
  block9Teacher?: BlockTeacher;
  block10Teacher?: BlockTeacher;
  callbackCount?: number;
  studentCellPhoneViolationCount?: number;
  PbisCardCount: number;
  studentFocusStudentCount?: number;
  YearPbisCount?: number;
  studentCardCountInLastWeek?: number;
  callbackItems?: CallbackItem[];
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
  taTeam?: TaTeam;
  taStudents: TaStudent[];
}

const TA: React.FC = () => {
  const me = useUser();
  const { data, isLoading, error, refetch } = useGQLQuery(
    'TaInfo',
    TA_INFO_QUERY,
    {
      id: me?.id,
    },
    {
      enabled: !!me,
    },
  );
  if (!me) return <Loading />;
  if (isLoading) return <Loading />;
  if (error) return <DisplayError error={error as any} />;
  // get the callbacks from each student in the ta
  const allTaCallbacks =
    data?.taTeacher?.taStudents?.map(
      (student: TaStudent) => student.callbackItems || null,
    ) || [];
  const allTaCallbacksFlattened = [].concat(...allTaCallbacks.filter(Boolean));

  // console.log('callbacks', allTaCallbacksFlattened);
  const students = data?.taTeacher?.taStudents || [];

  const taTotalPbisCards = students.reduce(
    (acc: number, student: TaStudent) => acc + student.PbisCardCount,
    0,
  );
  const taStudentCount = students.length;
  const taAveragePbisCards =
    taStudentCount > 0 ? taTotalPbisCards / taStudentCount : 0;
  return (
    <div>
      <h1>{me?.name}'s TA</h1>
      <p>{taStudentCount} students</p>
      <p>{taTotalPbisCards} total PBIS cards</p>
      <p>{taAveragePbisCards} average PBIS cards per student</p>
      {students.length > 0 && (
        <>
          <CountPhysicalCards taStudents={students} refetch={refetch} />
          <ViewTaStudentTable users={students} title="TA Students" />
          <CallbackTable callbacks={allTaCallbacksFlattened || []} />
        </>
      )}
    </div>
  );
};

export default TA;
