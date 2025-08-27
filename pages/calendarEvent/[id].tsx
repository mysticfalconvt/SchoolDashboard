import gql from 'graphql-tag';
import { GetServerSideProps, NextPage } from 'next';
import { useUser } from '../../components/User';
import EditCalendarEvent from '../../components/calendars/EditCalendar';
import { endpoint } from '../../config';
import { GraphQLClient } from '../../lib/graphqlClient';
import isAllowed from '../../lib/isAllowed';

interface CalendarEvent {
  id: string;
  name: string;
  description?: string;
  status: string;
  date: string;
  dateCreated: string;
  link?: string;
  linkTitle?: string;
  author?: {
    id: string;
    name: string;
  };
}

interface CalendarEventPageProps {
  query: {
    id: string;
  };
  data: CalendarEvent;
}

const CalendarEvent: NextPage<CalendarEventPageProps> = ({
  query,
  data: calendar,
}) => {
  const me = useUser();
  if (!calendar) {
    return <div>No Event Found...</div>;
  }

  const date = new Date(calendar.date).toLocaleDateString();
  const dateCreated = new Date(calendar.dateCreated).toLocaleDateString();
  const daysUntil = new Date(calendar.date).getTime() - Date.now();
  const daysUntilString = Math.ceil(daysUntil / (1000 * 60 * 60 * 24));
  const daysUntilStringPlural = daysUntilString === 1 ? 'day' : 'days';
  const eventDayOfTheWeek = new Date(calendar.date).toLocaleDateString(
    'en-US',
    { weekday: 'long' },
  );
  const eventHasLink = calendar.link ? true : false;
  const linkWithHTTP = calendar.link?.startsWith('http')
    ? calendar.link
    : `http://${calendar.link}`;
  const eventLinkTitle = calendar.linkTitle
    ? `Link: ${calendar.linkTitle}`
    : 'Attached Link';
  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-[var(--background-color)] p-5 rounded-md shadow-md overflow-hidden">
      <h1>{calendar.name}</h1>
      <p>{calendar.description}</p>
      <p>
        {eventDayOfTheWeek} - {date}
      </p>
      <p>
        {daysUntilString} {daysUntilStringPlural} until event
      </p>
      {eventHasLink && <a href={linkWithHTTP}>{eventLinkTitle}</a>}
      <br />
      <p>Event is for Students or Teachers: {calendar.status}</p>
      <p>
        Event was created by: {calendar.author?.name} on {dateCreated}
      </p>
      {isAllowed(me, 'isStaff') ? (
        <EditCalendarEvent calendar={calendar} refetch={() => {}} />
      ) : null}
    </div>
  );
};

const GET_SINGLE_CALENDAR_EVENT = gql`
  query GET_SINGLE_CALENDAR($id: ID) {
    calendar(where: { id: $id }) {
      id
      name
      description
      status
      date
      dateCreated
      link
      linkTitle
      author {
        id
        name
      }
    }
  }
`;

export const getServerSideProps: GetServerSideProps<
  CalendarEventPageProps
> = async (context) => {
  const graphQLClient = new GraphQLClient(
    endpoint,
    {
      headers: {
        authorization: `test auth for keystone`,
      },
    },
  );
  const fetchThisCalendar = async (): Promise<{ calendar: CalendarEvent }> =>
    graphQLClient.request(GET_SINGLE_CALENDAR_EVENT, { id: context.query.id });

  const thisCalendar = await fetchThisCalendar();

  return {
    props: {
      query: context.query as { id: string },
      data: thisCalendar.calendar,
    },
  };
};

export default CalendarEvent;
