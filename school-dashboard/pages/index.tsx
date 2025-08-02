import { google } from 'googleapis';
import gql from 'graphql-tag';
import type { GetStaticProps } from 'next';
import Link from 'next/link';
import AssignmentViewCardsStudent from '../components/Assignments/AssignmentViewCardsStudent';
import TeacherAssignments from '../components/Assignments/TeacherAssignments';
import NewBugReportButton from '../components/bugreports/NewBugReportButton';
import WeeklyCalendar, {
  GET_WEEK_CALENDARS,
  getLastAndNextSunday,
} from '../components/calendars/WeeklyCalendar';
import StudentCallbacks from '../components/Callback/StudentCallbacks';
import TaCallbacks from '../components/Callback/TaCallback';
import CreateSingleChromebookCheck from '../components/Chromebooks/CreateSingleChromebookCheck';
import SignOut from '../components/loginComponents/SignOut';
import HomePageLinks, {
  GET_HOMEPAGE_LINKS,
} from '../components/navagation/HomePageLinks';
import DisplayPbisCardWidget from '../components/PBIS/DisplayPbisCardsWidget';
import PbisCardFormButton from '../components/PBIS/PbisCardFormButton';
import { TOTAL_PBIS_CARDS } from '../components/PBIS/PbisFalcon';
import PbisWidget from '../components/PBIS/PbisWidget';
import StudentPbisData from '../components/PBIS/StudentPbisData';
import RequestReset from '../components/RequestReset';
import { SEARCH_ALL_USERS_QUERY } from '../components/Search';
import { useUser } from '../components/User';
import ViewStudentPage from '../components/users/ViewStudentPage';
import { callbackDisabled, endpoint, prodEndpoint } from '../config';
import getDisplayName from '../lib/displayName';
import { GraphQLClient } from '../lib/graphqlClient';
import isAllowed from '../lib/isAllowed';
import { useGQLQuery } from '../lib/useGqlQuery';

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

interface HomeProps {
  totalCards?: number | null;
  homePageLinks?: any | null;
  weeklyCalendar?: any | null;
  allUsersForSearch?: any | null;
  initialGoogleCalendarEvents?: any;
}

export default function Home(props: HomeProps) {
  // console.log(process.env.NODE_ENV);
  const me = useUser();
  const { data, isLoading, error } = useGQLQuery(
    `SingleStudentClasswork-${me?.id}`,
    GET_STUDENT_CLASSSWORK_QUERY,
    { id: me?.id },
    { enabled: !!me?.isStudent && !!me?.id },
  );
  const { data: allUsers } = useGQLQuery(
    'allUsers',
    SEARCH_ALL_USERS_QUERY,
    {},
    {
      enabled: !!me,
      staleTime: 1000 * 60 * 60, // 1 hour
      initialData: props?.allUsersForSearch,
    },
  );

  if (!me) return null;

  // Handle case where static props failed to load data
  const hasStaticDataError =
    !props?.totalCards && !props?.homePageLinks && !props?.weeklyCalendar;
  return (
    <div>
      <main>
        {hasStaticDataError && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            <strong>Warning:</strong> Some data could not be loaded. This may be
            due to the server being unavailable.
          </div>
        )}
        <h1 className="center">
          Welcome to the NCUJHS Dashboard {getDisplayName(me)}
        </h1>
        <div className="flex flex-wrap justify-around items-center">
          <PbisWidget initialCardCount={props?.totalCards} />
          {me && isAllowed(me, 'isStaff') && (
            <PbisCardFormButton teacher={me} />
          )}
          {/* {me && isAllowed(me || {}, "isStaff") && (
            <a
              href="https://ncujhs.ncsuvt.org/emergency"
              className="bg-gradient-to-r text-white from-red-950 from-10% via-yellow-900 via-50% to-red-950 to-90% p-4 rounded-xl"
            >
              <button type="button">Emergency</button>
            </a>
          )} */}
          {me && isAllowed(me, 'hasClasses') && (
            <Link
              href={`/userProfile/${me?.id}`}
              className="bg-gradient-to-tl from-[var(--red)] to-[var(--blue)] text-[var(--navTextColor)] font-medium border border-[var(--backgroundColor)] rounded-xl uppercase text-lg px-6 py-3 skew-x-[-2deg] inline-block transition-all duration-500 m-1 max-h-full outline-none hover:border-[var(--red)] hover:brightness-110 break-words whitespace-normal"
            >
              My Students
            </Link>
          )}
          {/* {me && isAllowed(me || {}, "isStaff") && (
            <GradientButton>
              <Link href="/trimesterAwards">Trimester Awards</Link>
            </GradientButton>
          )} */}

          {/* {me && isAllowed(me || {}, "isStaff") && (
            <GradientButton>
              <Link href="/allTeacherCurrentWork">Current Work</Link>
            </GradientButton>
          )} */}
          {me && isAllowed(me, 'isStaff') && <CreateSingleChromebookCheck />}
          <HomePageLinks me={me} initialData={props?.homePageLinks} />
          {isAllowed(me, 'hasClasses') && <TeacherAssignments />}
          <WeeklyCalendar
            me={me}
            initialData={props?.weeklyCalendar}
            initialGoogleCalendarEvents={props?.initialGoogleCalendarEvents}
          />
          {isAllowed(me, 'hasTA') && !callbackDisabled && <TaCallbacks />}
          {me && isAllowed(me, 'isStudent') && (
            <div>
              <StudentPbisData student={me} />
              {/* {me?.birthday && !me?.birthday?.cakeType && (
                <StudentCakeChooser birthday={me.birthday} />
              )} */}
              {!callbackDisabled && <StudentCallbacks />}
              {data?.user && (
                <AssignmentViewCardsStudent student={data?.user} />
              )}
              <DisplayPbisCardWidget cards={me.studentPbisCards} />
            </div>
          )}
          {me &&
            isAllowed(me, 'isParent') &&
            me.children?.map((child) => (
              <div key={child.id}>
                <ViewStudentPage student={child} />
              </div>
            ))}
        </div>
      </main>

      <footer>
        {me ? (
          <div style={{ display: 'flex', justifyContent: 'start' }}>
            <SignOut />
            <NewBugReportButton />
            {/* <UpdateMyPassword /> */}
          </div>
        ) : (
          <RequestReset />
        )}
      </footer>
    </div>
  );
}

interface CalendarEvent {
  status: string;
  isMultiDayEvent: boolean;
  isGCDate: boolean;
  isGCDateTime: boolean;
  date: string;
  endDate: string;
  name: string;
  description: string;
  link: string;
  id: string;
  isGoogleCalendarEvent: boolean;
}

const getCalendarData = async (): Promise<CalendarEvent[]> => {
  const calendarId = process.env.CALENDAR_ID;
  const scopes = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events.readonly',
  ];
  const now = new Date(); // now
  const timeMin = new Date(now.getFullYear(), now.getMonth(), 1); // 1 week before current month
  const timeMax = new Date(now.getFullYear(), now.getMonth() + 4, 0); // 1 week after current month

  const credentials = JSON.parse(process.env.CREDENTIALS || '');

  const jwt = new google.auth.JWT(
    credentials.client_email,
    undefined,
    credentials.private_key,
    scopes,
  );

  const calendar = await google.calendar({
    version: 'v3',
    auth: jwt,
  });

  const Calendar = await calendar.events.list({
    auth: jwt,
    calendarId: calendarId,

    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),

    singleEvents: true,
    orderBy: 'startTime',
  });

  const rawEvents = Calendar.data.items || [];

  let events = rawEvents.map((event) => {
    const status = 'Both';
    const isGCDate = event.start.date ? true : false;
    const isGCDateTime = event.start.dateTime ? true : false;
    const startDate = new Date(event.start.date || event.start.dateTime);
    const endDate = new Date(event.end.date || event.end.dateTime);
    const isMultiDayEvent =
      endDate.getTime() - startDate.getTime() > 1000 * 60 * 60 * 24;
    const date = new Date(
      isGCDate ? startDate.setDate(startDate.getDate() + 1) : startDate,
    );
    const name = event.summary;
    const description = event.description;
    const link = event.htmlLink;
    const id = event.id;
    return {
      status,
      isMultiDayEvent,
      isGCDate,
      isGCDateTime,
      date,
      endDate,
      name,
      description,
      link,
      id,
      isGoogleCalendarEvent: true,
    };
  });
  const multiDayEvents = events.filter((event) => {
    return event.isMultiDayEvent;
  });
  multiDayEvents.forEach((event) => {
    const start = new Date(event?.date);
    const end = new Date(event?.endDate || event?.date || new Date());
    const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    for (let i = 1; i < days; i++) {
      const newDate = new Date(start);
      newDate.setDate(newDate.getDate() + i);
      const newEvent = {
        ...event,
        date: newDate,
        isMultiDayEvent: false,
      };
      events.push(newEvent);
    }
  });
  events = events.sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
  const initialGoogleCalendarEvents = events.map((event) => {
    return {
      ...event,
      date: event?.date ? new Date(event.date).toISOString() : '',
      endDate: event?.endDate ? new Date(event.endDate).toISOString() : '',
      description: event.description || '',
    };
  });
  return initialGoogleCalendarEvents;
};

export const getStaticProps: GetStaticProps<HomeProps> = async (context) => {
  try {
    // console.log(context);
    // fetch PBIS Page data from the server
    // get dates for calendar
    const today = new Date();
    const { lastSunday, nextSaturday } = getLastAndNextSunday(today);

    const graphQLClient = new GraphQLClient(
      process.env.NODE_ENV === 'development' ? endpoint : prodEndpoint,
      {
        headers: {
          authorization: `test auth for keystone`,
        },
      },
    );

    // Reusable fetch with retry logic
    const fetchWithRetry = async (
      fetchFn: () => Promise<any>,
      retries = 3,
      delay = 1000,
    ) => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          return await fetchFn();
        } catch (error) {
          console.error(`Attempt ${attempt} failed:`, error);
          if (attempt === retries) {
            console.error('Failed to fetch after retries:', error);
            return null; // Return null instead of an object with fetchError
          }
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    };

    // Add a timeout to prevent hanging
    const fetchWithTimeout = async (
      fetchFn: () => Promise<any>,
      timeout = 5000,
    ) => {
      return Promise.race([
        fetchFn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), timeout),
        ),
      ]);
    };

    const fetchTotalCards = () => graphQLClient.request(TOTAL_PBIS_CARDS);
    const fetchHomePageLinks = () => graphQLClient.request(GET_HOMEPAGE_LINKS);
    const fetchWeeklyCalendar = () =>
      graphQLClient.request(GET_WEEK_CALENDARS, {
        starting: lastSunday,
        ending: nextSaturday,
      });
    const fetchAllUsersForSearch = () =>
      graphQLClient.request(SEARCH_ALL_USERS_QUERY);

    const totalCards = await fetchWithRetry(() =>
      fetchWithTimeout(fetchTotalCards),
    );
    const homePageLinks = await fetchWithRetry(() =>
      fetchWithTimeout(fetchHomePageLinks),
    );
    const weeklyCalendar = await fetchWithRetry(() =>
      fetchWithTimeout(fetchWeeklyCalendar),
    );
    const allUsersForSearch = await fetchWithRetry(() =>
      fetchWithTimeout(fetchAllUsersForSearch),
    );
    const initialGoogleCalendarEvents = await getCalendarData();
    return {
      props: {
        totalCards: totalCards?.pbisCardsCount ?? null,
        homePageLinks: homePageLinks ?? null,
        weeklyCalendar: weeklyCalendar ?? null,
        allUsersForSearch: allUsersForSearch ?? null,
        initialGoogleCalendarEvents: { events: initialGoogleCalendarEvents },
      }, // will be passed to the page component as props
      revalidate: 60 * 60,
    };
  } catch (error) {
    console.warn('Error during static generation for index page:', error);
    return {
      props: {
        totalCards: null,
        homePageLinks: null,
        weeklyCalendar: null,
        allUsersForSearch: null,
        initialGoogleCalendarEvents: { events: [] },
      },
      revalidate: 60 * 60,
    };
  }
};
