import gql from "graphql-tag";
import DisplayError from "../components/ErrorMessage";
import TaTeacherInfo from "../components/TA/TaTeacherInfo";
import { useUser } from "../components/User";
import { useGQLQuery } from "../lib/useGqlQuery";
import Loading from "../components/Loading";
import ViewTaStudentTable from "../components/users/ViewTaStudentTable";
import CallbackTable from "../components/Callback/CallbackTable";
import CountPhysicalCards from "../components/PBIS/CountPhysicalCards";

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
                new Date().getTime() - 7 * 24 * 60 * 60 * 1000
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

export default function TA() {
  const me = useUser();
  const { data, isLoading, error, refetch } = useGQLQuery(
    "TaInfo",
    TA_INFO_QUERY,
    {
      id: me?.id,
    },
    {
      enabled: !!me,
    }
  );
  if (!me) return <Loading />;
  if (isLoading) return <Loading />;
  if (error) return <DisplayError>{error.message}</DisplayError>;
  // get the callbacks from each student in the ta
  const allTaCallbacks = data.taTeacher.taStudents.map(
    (student) => student.callbackItems || null
  );
  const allTaCallbacksFlattened = [].concat(...allTaCallbacks);

  // console.log('callbacks', allTaCallbacksFlattened);
  const students = data.taTeacher.taStudents || [];

  const taTotalPbisCards = students.reduce(
    (acc, student) => acc + student.PbisCardCount,
    0
  );
  const taStudentCount = students.length;
  const taAveragePbisCards = taTotalPbisCards / taStudentCount;
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
}
