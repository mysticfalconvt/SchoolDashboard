import gql from 'graphql-tag';
import type { NextPage } from 'next';
import CallbackTable from '../components/Callback/CallbackTable';
import DisplayError from '../components/ErrorMessage';
import Loading from '../components/Loading';
import ModifySpecialGroup from '../components/modifySpecialGroup';
import { useUser } from '../components/User';
import ViewTaStudentTable from '../components/users/ViewTaStudentTable';
import { useGQLQuery } from '../lib/useGqlQuery';
// import { ModifySpecialGroup } from "../components/modifySpecialGroup";

export const SPECIAL_GROUP_QUERY = gql`
  query specialGroup($id: ID!) {
    teacher: user(where: { id: $id }) {
      name
      id
      email

      specialGroupStudents {
        averageTimeToCompleteCallback
        studentDisciplineCount
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

interface CallbackItem {
  id: string;
  teacher: {
    id: string;
    name: string;
  };
  student: {
    name: string;
    preferredName: string;
    id: string;
  };
  link: string;
  description: string;
  title: string;
  dateAssigned: string;
  dateCompleted?: string;
  messageFromStudent?: string;
  messageFromTeacher?: string;
  messageFromStudentDate?: string;
  messageFromTeacherDate?: string;
}

interface SpecialGroupStudent {
  averageTimeToCompleteCallback: number;
  studentDisciplineCount: number;
  parent: {
    name: string;
    email: string;
  };
  taTeacher: {
    id: string;
    name: string;
  };
  id: string;
  name: string;
  preferredName: string;
  block1Teacher: {
    name: string;
    id: string;
    block1Assignment: string;
  };
  block2Teacher: {
    name: string;
    id: string;
    block2Assignment: string;
  };
  block3Teacher: {
    name: string;
    id: string;
    block3Assignment: string;
  };
  block4Teacher: {
    name: string;
    id: string;
    block4Assignment: string;
  };
  block5Teacher: {
    name: string;
    id: string;
    block5Assignment: string;
  };
  block6Teacher: {
    name: string;
    id: string;
    block6Assignment: string;
  };
  block7Teacher: {
    name: string;
    id: string;
    block7Assignment: string;
  };
  block8Teacher: {
    name: string;
    id: string;
    block8Assignment: string;
  };
  block9Teacher: {
    name: string;
    id: string;
    block9Assignment: string;
  };
  block10Teacher: {
    name: string;
    id: string;
    block10Assignment: string;
  };
  callbackCount: number;
  studentCellPhoneViolationCount: number;
  studentPbisCardsCount: number;
  studentCardCountInLastWeek: number;
  studentFocusStudentCount: number;
  callbackItemsCount: number;
  callbackItems: CallbackItem[];
}

interface Teacher {
  name: string;
  id: string;
  email: string;
  specialGroupStudents: SpecialGroupStudent[];
}

const SpecialGroup: NextPage = () => {
  // console.log(query)
  // console.log(initialData?.taTeacher?.name);
  const me = useUser();
  const { data, isLoading, error, refetch } = useGQLQuery(
    `specialGroup-${me?.id}-${me?.name}-query`,
    SPECIAL_GROUP_QUERY,
    {
      id: me?.id,
    },
    {
      enabled: !!me,
      staleTime: 0,
    },
  );
  if (!me) return <Loading />;
  if (isLoading) return <Loading />;
  if (error) return <DisplayError error={error} />;
  // get the callbacks from each student in the ta
  const allTaCallbacks =
    data?.teacher?.specialGroupStudents?.map(
      (student: SpecialGroupStudent) => student.callbackItems || null,
    ) || [];
  const allTaCallbacksFlattened =
    [].concat(...allTaCallbacks.filter(Boolean)) || [];

  // console.log('callbacks', allTaCallbacksFlattened);
  const students = data?.teacher?.specialGroupStudents || [];
  return (
    <div>
      <h1>{data?.teacher?.name}'s Special Group</h1>
      {students.length > 0 && (
        <>
          <ViewTaStudentTable users={students} title="TA Students" discipline />
          <CallbackTable callbacks={allTaCallbacksFlattened || []} />
        </>
      )}
      <ModifySpecialGroup />
    </div>
  );
};

export default SpecialGroup;
