import gql from "graphql-tag";
import { GraphQLClient } from "graphql-request";
import DisplayError from "../../components/ErrorMessage";
import TaTeacherInfo from "../../components/TA/TaTeacherInfo";
import { useUser } from "../../components/User";
import { useGQLQuery } from "../../lib/useGqlQuery";
import Loading from "../../components/Loading";
import ViewTaStudentTable from "../../components/users/ViewTaStudentTable";
import CallbackTable from "../../components/Callback/CallbackTable";
import CountPhysicalCards from "../../components/PBIS/CountPhysicalCards";
import { endpoint, prodEndpoint } from "../../config";
import ChromebookCheck, {
  GET_TA_CHROMEBOOK_ASSIGNMENTS_QUERY,
} from "../../components/Chromebooks/ChromebookCheck";
import { useMemo } from "react";

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

export default function TA({ data: initialData, query }) {
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
    }
  );
  const { data: existingChecks, isLoading: CBCheckLoading } = useGQLQuery(
    `TAChromebookChecks-${query.id}`,
    GET_TA_CHROMEBOOK_ASSIGNMENTS_QUERY,
    { id: query.id }
  );
  // get the callbacks from each student in the ta
  const allTaCallbacks =
    data?.taTeacher?.taStudents?.map(
      (student) => student.callbackItems || null
    ) || [];
  const allTaCallbacksFlattened = [].concat(...allTaCallbacks) || [];

  const isAllowedPbisCardCounting =
    me?.id === data?.taTeacher?.id || me?.canManagePbis;

  const students = useMemo(
    () =>
      data?.taTeacher?.taStudents
        .map((student) => {
          const existingCheck = existingChecks?.users?.filter(
            (check) => check.id === student.id
          );
          return {
            ...student,
            ChromebookChecks: existingCheck
              ? existingCheck[0].chromebookCheck
              : [],
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name)),
    [data, existingChecks]
  );

  if (!me) return <Loading />;
  if (isLoading) return <Loading />;
  if (error) return <DisplayError>{error.message}</DisplayError>;
  console.log(students);
  const taTotalPbisCards = students.reduce(
    (acc, student) => acc + student.studentPbisCardsCount || 0,
    0
  );
  const taStudentCount = students.length;
  const taAveragePbisCards = taTotalPbisCards / taStudentCount;

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
            <div style={{ display: "flex" }}>
              <CountPhysicalCards taStudents={students} refetch={refetch} />
              <ChromebookCheck taId={query.id} />
            </div>
          )}

          <ViewTaStudentTable users={students} title="TA Students" />
          <CallbackTable callbacks={allTaCallbacksFlattened || []} />
        </>
      )}
    </div>
  );
}

export async function getStaticPaths() {
  try {
    const headers = {
      credentials: "include",
      mode: "cors",
      headers: {
        authorization: `test auth for keystone`,
      },
    };

    const graphQLClient = new GraphQLClient(
      process.env.NODE_ENV === "development" ? endpoint : prodEndpoint,
      headers
    );

    const fetchData = async () => graphQLClient.request(TA_TEACHER_LIST_QUERY);
    const data = await fetchData();
    const usersToUse = data.users;

    const paths =
      usersToUse?.map((user) => ({
        params: {
          id: user.id,
        },
      })) || [];

    return {
      paths,
      fallback: "blocking",
    };
  } catch (error) {
    console.error(error);
    return {
      paths: [],
      fallback: "blocking",
    };
  }
}

export async function getStaticProps({ params }) {
  try {
    const headers = {
      credentials: "include",
      mode: "cors",
      headers: {
        authorization: `test auth for keystone`,
      },
    };

    const graphQLClient = new GraphQLClient(
      process.env.NODE_ENV === "development" ? endpoint : prodEndpoint,
      headers
    );

    const fetchData = async () => {
      try {
        const dataFromFetch = await graphQLClient.request(TA_INFO_QUERY, {
          id: params.id,
        });
        return dataFromFetch;
      } catch (e) {
        console.log(e);
        console.log("error", params.id);
        throw new Error("Failed to fetch data"); // Throw an error to indicate that the fetch failed
      }
    };

    const data = await fetchData();
    console.log("data", data);

    return {
      props: {
        data,
        revalidate: 60 * 60 * 1, // 1 hours (in seconds)
      },
    };
  } catch (error) {
    console.error("Error in getStaticProps:", error);
    return {
      notFound: true, // If there's an error, return a 404 page
    };
  }
}
