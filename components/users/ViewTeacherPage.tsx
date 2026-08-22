import gql from 'graphql-tag';
import { useMemo } from 'react';
import { blockDisplayList } from '../../lib/blockNames';
import { useGQLQuery } from '../../lib/useGqlQuery';
import AssignmentViewCards from '../Assignments/AssignmentViewCards';
import CallbackCards from '../Callback/CallbackCards';
import Loading from '../Loading';
import GiveListOfStudentsACardButton from '../PBIS/GiveListOfStudentsACardButton';
import { useUser } from '../User';
import ViewStudentTable from './ViewStudentTable';

const GET_SINGLE_TEACHER = gql`
  query GET_SINGLE_TEACHER($id: ID!, $date: DateTime!) {
    user: user(where: { id: $id }) {
      id
      name
      email
      callbackAssigned(where: { dateCompleted: null }) {
        id
        title
        student {
          id
          name
        }
        teacher {
          id
          name
        }
        dateAssigned
        description
        link
        messageFromTeacher
        messageFromStudentDate
        messageFromStudent
        messageFromStudentDate
      }
      taStudents {
        id
        name
        preferredName
        individualPbisLevel
        callbackCount
        totalCallbackCount
        averageTimeToCompleteCallback
        PbisCardCount: studentPbisCardsCount(
          where: { dateGiven: { gte: $date } }
        )
        YearPbisCount: studentPbisCardsCount
        studentDisciplineCount
        studentFocusStudentCount
        taTeacher {
          id
          name
        }
      }
      block1Students {
        id
        name
        preferredName
        individualPbisLevel
        callbackCount
        totalCallbackCount
        averageTimeToCompleteCallback
        PbisCardCount: studentPbisCardsCount(
          where: { dateGiven: { gte: $date } }
        )
        YearPbisCount: studentPbisCardsCount
        taTeacher {
          id
          name
        }
      }
      block2Students {
        name
        preferredName
        id
        individualPbisLevel
        callbackCount
        totalCallbackCount
        averageTimeToCompleteCallback
        PbisCardCount: studentPbisCardsCount(
          where: { dateGiven: { gte: $date } }
        )
        YearPbisCount: studentPbisCardsCount
        taTeacher {
          id
          name
        }
      }
      block3Students {
        id
        name
        individualPbisLevel
        preferredName
        callbackCount
        totalCallbackCount
        averageTimeToCompleteCallback
        PbisCardCount: studentPbisCardsCount(
          where: { dateGiven: { gte: $date } }
        )
        YearPbisCount: studentPbisCardsCount
        taTeacher {
          id
          name
        }
      }
      block4Students {
        id
        name
        individualPbisLevel
        callbackCount
        totalCallbackCount
        averageTimeToCompleteCallback
        PbisCardCount: studentPbisCardsCount(
          where: { dateGiven: { gte: $date } }
        )
        YearPbisCount: studentPbisCardsCount
        taTeacher {
          id
          name
        }
      }
      block5Students {
        id
        name
        individualPbisLevel
        preferredName
        callbackCount
        totalCallbackCount
        averageTimeToCompleteCallback
        PbisCardCount: studentPbisCardsCount(
          where: { dateGiven: { gte: $date } }
        )
        YearPbisCount: studentPbisCardsCount
        taTeacher {
          id
          name
        }
      }
      block6Students {
        id
        name
        individualPbisLevel
        callbackCount
        totalCallbackCount
        averageTimeToCompleteCallback
        PbisCardCount: studentPbisCardsCount(
          where: { dateGiven: { gte: $date } }
        )
        YearPbisCount: studentPbisCardsCount
        taTeacher {
          id
          name
        }
      }
      block7Students {
        id
        name
        individualPbisLevel
        preferredName
        callbackCount
        totalCallbackCount
        averageTimeToCompleteCallback
        PbisCardCount: studentPbisCardsCount(
          where: { dateGiven: { gte: $date } }
        )
        YearPbisCount: studentPbisCardsCount
        taTeacher {
          id
          name
        }
      }
      block8Students {
        id
        name
        individualPbisLevel
        callbackCount
        totalCallbackCount
        averageTimeToCompleteCallback
        PbisCardCount: studentPbisCardsCount(
          where: { dateGiven: { gte: $date } }
        )
        YearPbisCount: studentPbisCardsCount
        taTeacher {
          id
          name
        }
      }
      block9Students {
        id
        name
        individualPbisLevel
        preferredName
        callbackCount
        totalCallbackCount
        averageTimeToCompleteCallback
        PbisCardCount: studentPbisCardsCount(
          where: { dateGiven: { gte: $date } }
        )
        YearPbisCount: studentPbisCardsCount
      }
      block10Students {
        id
        name
        individualPbisLevel
        callbackCount
        totalCallbackCount
        averageTimeToCompleteCallback
        PbisCardCount: studentPbisCardsCount(
          where: { dateGiven: { gte: $date } }
        )
        YearPbisCount: studentPbisCardsCount
      }
      block11Students {
        id
        name
        individualPbisLevel
        callbackCount
        totalCallbackCount
        averageTimeToCompleteCallback
        PbisCardCount: studentPbisCardsCount(
          where: { dateGiven: { gte: $date } }
        )
        YearPbisCount: studentPbisCardsCount
      }
      block12Students {
        id
        name
        individualPbisLevel
        callbackCount
        totalCallbackCount
        averageTimeToCompleteCallback
        PbisCardCount: studentPbisCardsCount(
          where: { dateGiven: { gte: $date } }
        )
        YearPbisCount: studentPbisCardsCount
      }

      block1Assignment
      block1ClassName
      block1AssignmentLastUpdated
      block2Assignment
      block2ClassName
      block2AssignmentLastUpdated
      block3Assignment
      block3ClassName
      block3AssignmentLastUpdated
      block4Assignment
      block4ClassName
      block4AssignmentLastUpdated
      block5Assignment
      block5ClassName
      block5AssignmentLastUpdated
      block6Assignment
      block6ClassName
      block6AssignmentLastUpdated
      block7Assignment
      block7ClassName
      block7AssignmentLastUpdated
      block8Assignment
      block8ClassName
      block8AssignmentLastUpdated
      block9Assignment
      block9ClassName
      block9AssignmentLastUpdated
      block10Assignment
      block10ClassName
      block10AssignmentLastUpdated
      block11Assignment
      block11ClassName
      block11AssignmentLastUpdated
      block12Assignment
      block12ClassName
      block12AssignmentLastUpdated
    }
  }
`;

interface CallbackItem {
  id: string;
  title: string;
  student: {
    id: string;
    name: string;
  };
  teacher: {
    id: string;
    name: string;
  };
  dateAssigned: string;
  description: string;
  link: string;
  messageFromTeacher: string;
  messageFromStudentDate: string;
  messageFromStudent: string;
}

interface Student {
  id: string;
  name: string;
  preferredName?: string;
  individualPbisLevel?: number;
  callbackCount?: number;
  totalCallbackCount?: number;
  averageTimeToCompleteCallback?: number;
  PbisCardCount?: number;
  YearPbisCount?: number;
  studentDisciplineCount?: number;
  studentFocusStudentCount?: number;
  taTeacher?: {
    id: string;
    name: string;
  };
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  callbackAssigned: CallbackItem[];
  taStudents: Student[];
  block1Students: Student[];
  block2Students: Student[];
  block3Students: Student[];
  block4Students: Student[];
  block5Students: Student[];
  block6Students: Student[];
  block7Students: Student[];
  block8Students: Student[];
  block9Students: Student[];
  block10Students: Student[];
  block11Students: Student[];
  block12Students: Student[];
  block1Assignment?: string;
  block1ClassName?: string;
  block1AssignmentLastUpdated?: string;
  block2Assignment?: string;
  block2ClassName?: string;
  block2AssignmentLastUpdated?: string;
  block3Assignment?: string;
  block3ClassName?: string;
  block3AssignmentLastUpdated?: string;
  block4Assignment?: string;
  block4ClassName?: string;
  block4AssignmentLastUpdated?: string;
  block5Assignment?: string;
  block5ClassName?: string;
  block5AssignmentLastUpdated?: string;
  block6Assignment?: string;
  block6ClassName?: string;
  block6AssignmentLastUpdated?: string;
  block7Assignment?: string;
  block7ClassName?: string;
  block7AssignmentLastUpdated?: string;
  block8Assignment?: string;
  block8ClassName?: string;
  block8AssignmentLastUpdated?: string;
  block9Assignment?: string;
  block9ClassName?: string;
  block9AssignmentLastUpdated?: string;
  block10Assignment?: string;
  block10ClassName?: string;
  block10AssignmentLastUpdated?: string;
  block11Assignment?: string;
  block11ClassName?: string;
  block11AssignmentLastUpdated?: string;
  block12Assignment?: string;
  block12ClassName?: string;
  block12AssignmentLastUpdated?: string;
}

interface ViewTeacherPageProps {
  teacher: {
    id: string;
    name: string;
  };
}

export default function ViewTeacherPage({ teacher }: ViewTeacherPageProps) {
  const me = useUser();

  // Memoize variables to prevent infinite re-renders
  const variables = useMemo(
    () => ({
      id: teacher.id,
      date: new Date(me?.lastCollection || new Date()),
    }),
    [teacher.id, me?.lastCollection],
  );

  const { data, isLoading, error } = useGQLQuery(
    `SingleTeacher-${teacher.id}`,
    GET_SINGLE_TEACHER,
    variables,
    {
      enabled: teacher?.id !== '',
    },
  );
  if (isLoading) return <Loading />;
  //   console.log(data.user);
  const { user } = data || {};
  const { taStudents = [], callbackAssigned = [] } = user || {};

  const studentsForBlock = (block: number): any[] =>
    user?.[`block${block}Students`] || [];
  const rosterKey = (block: number): string =>
    studentsForBlock(block)
      .map((student: { id: string }) => student.id)
      .sort()
      .join(',');
  // A colour taught to the same roster in both rotations is one class here.
  const blocksToShow = blockDisplayList(
    (a, b) => rosterKey(a) === rosterKey(b),
  );
  return (
    <div>
      {me.id === teacher.id && (
        <div className="flex flex-row justify-around items-center max-w-[80%] flex-wrap rounded-3xl border-2 border-[var(--red)] p-2.5 mx-auto">
          <h3>Give a whole class a card</h3>
          <GiveListOfStudentsACardButton title="TA" students={taStudents} />
          {blocksToShow.map(({ block, blocks, name }) => (
            <GiveListOfStudentsACardButton
              key={blocks.join('-')}
              title={name}
              students={studentsForBlock(block)}
            />
          ))}
        </div>
      )}
      <h3>Teacher info</h3>
      <AssignmentViewCards assignments={user || {}} />
      {taStudents[0] && (
        <ViewStudentTable users={taStudents} title="TA Students" />
      )}
      {blocksToShow.map(({ block, blocks, name }) =>
        studentsForBlock(block)[0] ? (
          <ViewStudentTable
            key={blocks.join('-')}
            users={studentsForBlock(block)}
            title={name}
          />
        ) : null,
      )}
      <CallbackCards callbacks={callbackAssigned} />
    </div>
  );
}
