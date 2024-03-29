import Head from "next/head";
import styled from "styled-components";
import gql from "graphql-tag";
import Link from "next/link";
import toast from "react-hot-toast";
import { GraphQLClient } from "graphql-request";
import WeeklyCalendar, {
  getLastAndNextSunday,
  GET_WEEK_CALENDARS,
} from "../components/calendars/WeeklyCalendar";
import StudentCallbacks from "../components/Callback/StudentCallbacks";
import SignOut from "../components/loginComponents/SignOut";
import HomePageLinks, {
  GET_HOMEPAGE_LINKS,
} from "../components/navagation/HomePageLinks";
import { useUser } from "../components/User";
import isAllowed from "../lib/isAllowed";
import DisplayPbisCardWidget from "../components/PBIS/DisplayPbisCardsWidget";
import StudentPbisData from "../components/PBIS/StudentPbisData";
import RequestReset from "../components/RequestReset";
import PbisFalcon, { TOTAL_PBIS_CARDS } from "../components/PBIS/PbisFalcon";
import PbisCardFormButton from "../components/PBIS/PbisCardFormButton";
import TeacherAssignments from "../components/Assignments/TeacherAssignments";
import TaCallbacks from "../components/Callback/TaCallback";
import UpdateMyPassword from "../components/users/UpdateMyPassword";
import ViewStudentPage from "../components/users/ViewStudentPage";
import StudentCakeChooser from "../components/Birthdays/StudentCakeChooser";
import NewBugReportButton from "../components/bugreports/NewBugReportButton";
import { useGQLQuery } from "../lib/useGqlQuery";
import AssignmentViewCardsStudent from "../components/Assignments/AssignmentViewCardsStudent";
import GradientButton from "../components/styles/Button";
import { endpoint, prodEndpoint } from "../config";
import { SEARCH_ALL_USERS_QUERY } from "../components/Search";
import getDisplayName from "../lib/displayName";
import { getGoogleCalendarEvents } from "../components/calendars/getGoogleCalendarEvents";
import PbisWidget from "../components/PBIS/PbisWidget";
import CreateSingleChromebookCheck from "../components/Chromebooks/CreateSingleChromebookCheck";

const DashboardContainerStyles = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  align-items: center;
  @media (max-width: 650px) {
    flex-wrap: wrap;
  }
`;

const GET_STUDENT_CLASSSWORK_QUERY = gql`
  query GET_SINGLE_TEACHER($id: ID!) {
    user: user(where: { id: $id }) {
      id
      name
      email

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
    }
  }
`;

export default function Home(props) {
  // console.log(process.env.NODE_ENV);
  const me = useUser();
  const { data, isLoading, error } = useGQLQuery(
    `SingleStudentClasswork-${me?.id}`,
    GET_STUDENT_CLASSSWORK_QUERY,
    { id: me?.id },
    { enabled: !!me?.isStudent && !!me?.id }
  );
  const { data: allUsers } = useGQLQuery(
    "allUsers",
    SEARCH_ALL_USERS_QUERY,
    {},
    {
      enabled: !!me,
      staleTime: 1000 * 60 * 60, // 1 hour
      initialData: props?.allUsersForSearch,
    }
  );

  if (!me) return <RequestReset />;
  return (
    <div>
      <main>
        <h1 className="center">
          Welcome to the NCUJHS Dashboard {getDisplayName(me)}
        </h1>
        <DashboardContainerStyles>
          <PbisWidget initialCardCount={props?.totalCards} />
          {me && isAllowed(me || {}, "isStaff") && (
            <PbisCardFormButton teacher={me} />
          )}
          {me && isAllowed(me || {}, "isStaff") && (
            <a
              href="https://ncujhs.ncsuvt.org/emergency"
              className="bg-gradient-to-r text-white from-red-950 from-10% via-yellow-900 via-50% to-red-950 to-90% p-4 rounded-xl"
            >
              <button type="button">Emergency</button>
            </a>
          )}
          {me && isAllowed(me || {}, "hasClasses") && (
            <GradientButton>
              <Link href={`/userProfile/${me?.id}`}>My Students</Link>
            </GradientButton>
          )}
          {/* {me && isAllowed(me || {}, "isStaff") && (
            <GradientButton>
              <Link href="/trimesterAwards">Trimester Awards</Link>
            </GradientButton>
          )} */}

          {me && isAllowed(me || {}, "isStaff") && (
            <GradientButton>
              <Link href="/allTeacherCurrentWork">Current Work</Link>
            </GradientButton>
          )}
          {me && isAllowed(me || {}, "isStaff") && (
            <CreateSingleChromebookCheck />
          )}
          <HomePageLinks me={me || {}} initialData={props?.homePageLinks} />
          {isAllowed(me, "hasClasses") && <TeacherAssignments />}
          <WeeklyCalendar
            me={me || {}}
            initialData={props?.weeklyCalendar}
            initialGoogleCalendarEvents={props?.initialGoogleCalendarEvents}
          />
          {isAllowed(me, "hasTA") && <TaCallbacks />}
          {me && isAllowed(me, "isStudent") && (
            <div>
              <StudentPbisData student={me} />
              {me?.birthday && !me?.birthday?.cakeType && (
                <StudentCakeChooser birthday={me.birthday} />
              )}
              <StudentCallbacks />
              {data?.user && (
                <AssignmentViewCardsStudent student={data?.user} />
              )}
              <DisplayPbisCardWidget cards={me.studentPbisCards} />
            </div>
          )}
          {me &&
            isAllowed(me, "isParent") &&
            me.children.map((child) => (
              <div key={child.id}>
                <ViewStudentPage student={child} />
              </div>
            ))}
        </DashboardContainerStyles>
      </main>

      <footer>
        {me ? (
          <div style={{ display: "flex", justifyContent: "start" }}>
            <SignOut />
            <NewBugReportButton />
            <UpdateMyPassword />
          </div>
        ) : (
          <RequestReset />
        )}
      </footer>
    </div>
  );
}

export async function getStaticProps(context) {
  // console.log(context);
  // fetch PBIS Page data from the server
  const headers = {
    credentials: "include",
    mode: "cors",
    headers: {
      authorization: `test auth for keystone`,
    },
  };

  // get dates for calendar
  const today = new Date();
  const { lastSunday, nextSaturday } = getLastAndNextSunday(today);

  const graphQLClient = new GraphQLClient(
    process.env.NODE_ENV === "development" ? endpoint : prodEndpoint,
    headers
  );

  const fetchTotalCards = async () => graphQLClient.request(TOTAL_PBIS_CARDS);
  const fetchHomePageLinks = async () =>
    graphQLClient.request(GET_HOMEPAGE_LINKS);
  const fetchWeeklyCalendar = async () =>
    graphQLClient.request(GET_WEEK_CALENDARS, {
      starting: lastSunday,
      ending: nextSaturday,
    });
  const fetchAllUsersForSearch = async () =>
    graphQLClient.request(SEARCH_ALL_USERS_QUERY);

  const totalCards = await fetchTotalCards();
  const homePageLinks = await fetchHomePageLinks();
  const weeklyCalendar = await fetchWeeklyCalendar();
  const allUsersForSearch = await fetchAllUsersForSearch();
  const initialGoogleCalendarEvents = await getGoogleCalendarEvents();
  return {
    props: {
      totalCards: totalCards.pbisCardsCount,
      homePageLinks,
      weeklyCalendar,
      allUsersForSearch,
      initialGoogleCalendarEvents,
    }, // will be passed to the page component as props
    revalidate: 60 * 60,
  };
}
