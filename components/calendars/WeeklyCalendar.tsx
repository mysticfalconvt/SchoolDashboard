import gql from 'graphql-tag';
import { useMemo } from 'react';
import { useGQLQuery } from '../../lib/useGqlQuery';
import { useUser, type User } from '../User';
import SingleDayCalendar from './SingleDayCalendar';

export const GET_WEEK_CALENDARS = gql`
  query GET_WEEK_CALENDARS($starting: DateTime, $ending: DateTime) {
    calendars(
      orderBy: { date: asc }
      where: { AND: [{ date: { gte: $starting } }, { date: { lte: $ending } }] }
    ) {
      name
      id
      description
      date
      author {
        name
      }
      status
      dateCreated
      link
      linkTitle
    }
  }
`;

export function getLastAndNextSunday(d: Date) {
  const lastSunday = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate() - d.getDay(),
  );
  const nextSunday = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate() + (7 - d.getDay()),
  );
  const l = new Date(d);
  l.setDate(l.getDate() - l.getDay());
  const n = new Date(d);
  n.setDate(n.getDate() + ((5 - n.getDay() + 7) % 7) + 1);
  return {
    lastSunday: lastSunday.toISOString(),
    nextSaturday: nextSunday.toISOString(),
  };
}

interface CalendarEvent {
  name: string;
  id: string;
  description: string;
  date: string;
  author: { name: string };
  status: string;
  dateCreated: string;
  link: string;
  linkTitle: string;
}

interface GoogleCalendarEvent {
  date: string;
  name: string;
  description: string;
  link: string;
  id: string;
  isGoogleCalendarEvent: boolean;
}

function getDatesFromDayOfTheWeek(
  data: (CalendarEvent | GoogleCalendarEvent)[],
  day: number,
) {
  const dates = data?.filter((date) => {
    const d = new Date(date.date);
    return d.getDay() === day;
  });
  return dates;
}

interface WeeklyCalendarProps {
  me?: User;
  initialData?: {
    calendars: CalendarEvent[];
  };
  initialGoogleCalendarEvents?: {
    events: GoogleCalendarEvent[];
  };
}

export default function WeeklyCalendar({
  me,
  initialData,
  initialGoogleCalendarEvents,
}: WeeklyCalendarProps) {
  const today = new Date();
  const currentUser = useUser();
  const user = me || currentUser;
  // const status = user.isStaff ? 'Teachers' : 'Students';
  const todaysDay = today.getDay();
  const { lastSunday, nextSaturday } = getLastAndNextSunday(today);
  const { data, isLoading, error } = useGQLQuery(
    'weekCalendars',
    GET_WEEK_CALENDARS,
    {
      starting: lastSunday,
      ending: nextSaturday,
    },
    {
      initialData,
      staleTime: 1000 * 60 * 3, // 3 minutes
    },
  );
  const dailyEvents = useMemo(() => {
    const gcEvents = initialGoogleCalendarEvents?.events.filter((event) => {
      const date = new Date(event.date);
      return date >= new Date(lastSunday) && date <= new Date(nextSaturday);
    });

    // filter calendars by who can see them
    const filteredCalendars = data?.calendars?.filter((calendar) => {
      if (calendar.status === 'Both') return true;
      if (calendar.status === 'Teachers' && user.isStaff) return true;
      if (calendar.status === 'Students' && user.isStudent) return true;
      if (calendar.status === 'Students' && user.isParent) return true;
      return false;
    });
    const filteredCalendarsWithGoogle = [
      ...(filteredCalendars || []),
      ...(gcEvents || []),
    ].sort((a, b) => {
      const aDate = new Date(a.date);
      const bDate = new Date(b.date);
      return aDate.getTime() - bDate.getTime();
    });

    const dailyEvents = {
      sundayEvents: getDatesFromDayOfTheWeek(filteredCalendarsWithGoogle, 0),
      mondayEvents: getDatesFromDayOfTheWeek(filteredCalendarsWithGoogle, 1),
      tuesdayEvents: getDatesFromDayOfTheWeek(filteredCalendarsWithGoogle, 2),
      wednesdayEvents: getDatesFromDayOfTheWeek(filteredCalendarsWithGoogle, 3),
      thursdayEvents: getDatesFromDayOfTheWeek(filteredCalendarsWithGoogle, 4),
      fridayEvents: getDatesFromDayOfTheWeek(filteredCalendarsWithGoogle, 5),
      saturdayEvents: getDatesFromDayOfTheWeek(filteredCalendarsWithGoogle, 6),
    };
    return dailyEvents;
  }, [initialGoogleCalendarEvents, data, lastSunday, nextSaturday, user]);
  if (!user) return <p />;
  // if (isLoading) return <Loading />;
  if (error) return <p>{error.message}</p>;

  return (
    <div className="grid grid-cols-8 mb-1.5 max-[1100px]:grid-cols-4 max-[650px]:grid-cols-1">
      <SingleDayCalendar dailyEvents={dailyEvents.sundayEvents} day="Sunday" />
      <SingleDayCalendar dailyEvents={dailyEvents.mondayEvents} day="Monday" />
      <SingleDayCalendar
        dailyEvents={dailyEvents.tuesdayEvents}
        day="Tuesday"
      />
      <SingleDayCalendar
        dailyEvents={dailyEvents.wednesdayEvents}
        day="Wednesday"
      />
      <SingleDayCalendar
        dailyEvents={dailyEvents.thursdayEvents}
        day="Thursday"
      />
      <SingleDayCalendar dailyEvents={dailyEvents.fridayEvents} day="Friday" />
      <SingleDayCalendar
        dailyEvents={dailyEvents.saturdayEvents}
        day="Saturday"
      />
    </div>
  );
}
