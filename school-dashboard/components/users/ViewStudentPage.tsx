import gql from 'graphql-tag';
import { callbackDisabled } from '../../config';
import getDisplayName from '../../lib/displayName';
import { capitalizeFirstLetter } from '../../lib/nameUtils';
import { useGQLQuery } from '../../lib/useGqlQuery';
import AssignmentViewCardsStudent from '../Assignments/AssignmentViewCardsStudent';
import CallbackCards from '../Callback/CallbackCards';
import Loading from '../Loading';
import DisplayPbisCardsWidget from '../PBIS/DisplayPbisCardsWidget';
import QuickPbisButton from '../PBIS/QuickPbisButton';
import StudentPbisCardsPerCollection from '../PBIS/studentPbisCardsPerColelction';
import StudentPbisData from '../PBIS/StudentPbisData';
import { useUser } from '../User';

const GET_SINGLE_TEACHER = gql`
  query GET_SINGLE_TEACHER($id: ID!, $date: DateTime!) {
    user: user(where: { id: $id }) {
      id
      name
      preferredName
      email
      PbisCardCount: studentPbisCardsCount(where: { dateGiven: { gte: $date } })
      YearPbisCount: studentPbisCardsCount
      callbackItems(where: { dateCompleted: null }) {
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
        messageFromTeacherDate
      }
      block1Teacher {
        name
        id
        block1ClassName
        block1Assignment
        block1AssignmentLastUpdated
      }
      block2Teacher {
        name
        id
        block2ClassName
        block2Assignment
        block2AssignmentLastUpdated
      }
      block3Teacher {
        name
        id
        block3ClassName
        block3Assignment
        block3AssignmentLastUpdated
      }
      block4Teacher {
        name
        id
        block4ClassName
        block4Assignment
        block4AssignmentLastUpdated
      }
      block5Teacher {
        name
        id
        block5ClassName
        block5Assignment
        block5AssignmentLastUpdated
      }
      block6Teacher {
        name
        id
        block6ClassName
        block6Assignment
        block6AssignmentLastUpdated
      }
      block7Teacher {
        name
        id
        block7ClassName
        block7Assignment
        block7AssignmentLastUpdated
      }
      block8Teacher {
        name
        id
        block8ClassName
        block8Assignment
        block8AssignmentLastUpdated
      }
      block9Teacher {
        name
        id
        block9ClassName
        block9Assignment
        block9AssignmentLastUpdated
      }
      block10Teacher {
        name
        id
        block10ClassName
        block10Assignment
        block10AssignmentLastUpdated
      }
      taTeacher {
        id
        name
      }
      parent {
        id
        name
        email
      }
      taTeam {
        teamName
        currentLevel
      }
      studentPbisCards(
        orderBy: { dateGiven: desc }
        take: 20
        where: { category: { not: { equals: "physical" } } }
      ) {
        id
        cardMessage
        category
        teacher {
          id
          name
        }
        dateGiven
      }
      allCards: studentPbisCards(orderBy: { dateGiven: desc }) {
        dateGiven
      }
      studentFocusStudent(take: 2) {
        id
        comments
      }
    }
  }
`;

interface BlockTeacher {
  name: string;
  id: string;
  block1ClassName?: string;
  block1Assignment?: string;
  block1AssignmentLastUpdated?: string;
  block2ClassName?: string;
  block2Assignment?: string;
  block2AssignmentLastUpdated?: string;
  block3ClassName?: string;
  block3Assignment?: string;
  block3AssignmentLastUpdated?: string;
  block4ClassName?: string;
  block4Assignment?: string;
  block4AssignmentLastUpdated?: string;
  block5ClassName?: string;
  block5Assignment?: string;
  block5AssignmentLastUpdated?: string;
  block6ClassName?: string;
  block6Assignment?: string;
  block6AssignmentLastUpdated?: string;
  block7ClassName?: string;
  block7Assignment?: string;
  block7AssignmentLastUpdated?: string;
  block8ClassName?: string;
  block8Assignment?: string;
  block8AssignmentLastUpdated?: string;
  block9ClassName?: string;
  block9Assignment?: string;
  block9AssignmentLastUpdated?: string;
  block10ClassName?: string;
  block10Assignment?: string;
  block10AssignmentLastUpdated?: string;
}

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
  messageFromTeacherDate: string;
}

interface Parent {
  id: string;
  name: string;
  email: string;
}

interface TaTeam {
  teamName: string;
  currentLevel: number;
}

interface PbisCard {
  id: string;
  cardMessage: string;
  category: string;
  teacher: {
    id: string;
    name: string;
  };
  dateGiven: string;
}

interface StudentFocus {
  id: string;
  comments: string;
}

interface User {
  id: string;
  name: string;
  preferredName?: string;
  email: string;
  PbisCardCount: number;
  YearPbisCount: number;
  callbackItems: CallbackItem[];
  block1Teacher: BlockTeacher;
  block2Teacher: BlockTeacher;
  block3Teacher: BlockTeacher;
  block4Teacher: BlockTeacher;
  block5Teacher: BlockTeacher;
  block6Teacher: BlockTeacher;
  block7Teacher: BlockTeacher;
  block8Teacher: BlockTeacher;
  block9Teacher: BlockTeacher;
  block10Teacher: BlockTeacher;
  taTeacher: {
    id: string;
    name: string;
  };
  parent: Parent[];
  taTeam: TaTeam;
  studentPbisCards: PbisCard[];
  allCards: { dateGiven: string }[];
  studentFocusStudent: StudentFocus[];
}

interface Student {
  id: string;
  name: string;
}

interface ViewStudentPageProps {
  student: Student;
}

export default function ViewStudentPage({ student }: ViewStudentPageProps) {
  const { data, isLoading, error } = useGQLQuery(
    `SingleStudent-${student.id}`,
    GET_SINGLE_TEACHER,
    { id: student.id, date: new Date() },
    {
      enabled: !!student?.id,
    },
  );
  const me = useUser();
  if (isLoading) return <Loading />;
  const { user } = data;
  const canSendCallbackEmail = !(data.user.callbackItems.length > 0);
  // console.log(data.user.callbackItems.length);
  // console.log(user);
  return (
    <div>
      <h3>
        Student info for {getDisplayName(user)} TA: {user?.taTeacher?.name}
        {/* {me.isStaff && (
          <EmailParentsAboutCallback
            student={user}
            disabled={canSendCallbackEmail}
          />
        )} */}
        {me.isStaff && (
          <QuickPbisButton
            id={user.id}
            displayName={capitalizeFirstLetter(user.name)}
          />
        )}
      </h3>
      <AssignmentViewCardsStudent student={user} />
      <StudentPbisData student={user} />
      {user.parent.length > 0 && (
        <div className="rounded-2xl p-4 border border-[var(--blue)]">
          <h4>Parent Contact Info:</h4>
          {user.parent.map((parent) => (
            <p key={`parentID -${parent.id}`}>
              {parent.name} - {parent.email}
            </p>
          ))}
        </div>
      )}

      {!callbackDisabled && (
        <CallbackCards callbacks={user.callbackItems || []} />
      )}
      <StudentPbisCardsPerCollection cards={user.allCards || []} />
      <DisplayPbisCardsWidget cards={user.studentPbisCards || []} />
    </div>
  );
}
