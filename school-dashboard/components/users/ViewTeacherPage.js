import gql from "graphql-tag";
import { useGQLQuery } from "../../lib/useGqlQuery";
import { useUser } from "../User";
import Loading from "../Loading";
import AssignmentViewCards from "../Assignments/AssignmentViewCards";
import ViewStudentTable from "./ViewStudentTable";
import CallbackCards from "../Callback/CallbackCards";
import GiveListOfStudentsACardButton from "../PBIS/GiveListOfStudentsACardButton";

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
    }
  }
`;

export default function ViewTeacherPage({ teacher }) {
  const me = useUser();
  const { data, isLoading, error } = useGQLQuery(
    `SingleTeacher-${teacher.id}`,
    GET_SINGLE_TEACHER,
    {
      id: teacher.id,
      date: new Date(me?.lastCollection || new Date()),
    },
    {
      enabled: teacher?.id !== "",
    }
  );
  if (isLoading) return <Loading />;
  //   console.log(data.user);
  const { user } = data || {};
  const {
    taStudents = [],
    block1Students = [],
    block2Students = [],
    block3Students = [],
    block4Students = [],
    block5Students = [],
    block6Students = [],
    block7Students = [],
    block8Students = [],
    block9Students = [],
    block10Students = [],
    callbackAssigned = [],
  } = user || {};
  return (
    <div>
      {me.id === teacher.id && (
        <div className="flex flex-row justify-around items-center max-w-[80%] flex-wrap rounded-3xl border-2 border-[var(--red)] p-2.5 mx-auto">
          <h3>Give a whole class a card</h3>
          <GiveListOfStudentsACardButton title="TA" students={taStudents} />
          <GiveListOfStudentsACardButton
            title="Block 1"
            students={block1Students}
          />
          <GiveListOfStudentsACardButton
            title="Block 2"
            students={block2Students}
          />
          <GiveListOfStudentsACardButton
            title="Block 3"
            students={block3Students}
          />
          <GiveListOfStudentsACardButton
            title="Block 4"
            students={block4Students}
          />
          <GiveListOfStudentsACardButton
            title="Block 5"
            students={block5Students}
          />
          <GiveListOfStudentsACardButton
            title="Block 6"
            students={block6Students}
          />
          <GiveListOfStudentsACardButton
            title="Block 7"
            students={block7Students}
          />
          <GiveListOfStudentsACardButton
            title="Block 8"
            students={block8Students}
          />
          <GiveListOfStudentsACardButton
            title="Block 9"
            students={block9Students}
          />
          <GiveListOfStudentsACardButton
            title="Block 10"
            students={block10Students}
          />
        </div>
      )}
      <h3>Teacher info</h3>
      <AssignmentViewCards assignments={user || {}} />
      {taStudents[0] && (
        <ViewStudentTable users={taStudents} title="TA Students" />
      )}
      {block1Students[0] && (
        <ViewStudentTable users={block1Students} title="Block 1" />
      )}
      {block2Students[0] && (
        <ViewStudentTable users={block2Students} title="Block 2" />
      )}
      {block3Students[0] && (
        <ViewStudentTable users={block3Students} title="Block 3" />
      )}
      {block4Students[0] && (
        <ViewStudentTable users={block4Students} title="Block 4" />
      )}
      {block5Students[0] && (
        <ViewStudentTable users={block5Students} title="Block 5" />
      )}
      {block6Students[0] && (
        <ViewStudentTable users={block6Students} title="Block 6" />
      )}
      {block7Students[0] && (
        <ViewStudentTable users={block7Students} title="Block 7" />
      )}
      {block8Students[0] && (
        <ViewStudentTable users={block8Students} title="Block 8" />
      )}
      {block9Students[0] && (
        <ViewStudentTable users={block9Students} title="Block 9" />
      )}
      {block10Students[0] && (
        <ViewStudentTable users={block10Students} title="Block 10" />
      )}
      <CallbackCards callbacks={callbackAssigned} />
    </div>
  );
}
