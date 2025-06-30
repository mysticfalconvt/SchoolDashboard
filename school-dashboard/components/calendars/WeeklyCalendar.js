import gql from "graphql-tag";
import { useGQLQuery } from "../../lib/useGqlQuery";
import { useUser } from "../User";
import SingleDayCalendar from "./SingleDayCalendar";
import Loading from "../Loading";
import { useMemo } from "react";

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

export function getLastAndNextSunday(d) {
  const lastSunday = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate() - d.getDay()
  );
  const nextSunday = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate() + (7 - d.getDay())
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

function getDatesFromDayOfTheWeek(data, day) {
  const dates = data?.filter((date) => {
    const d = new Date(date.date);
    return d.getDay() === day;
  });
  return dates;
}

export default function WeeklyCalendar({
  initialData,
  initialGoogleCalendarEvents,
}) {
  const today = new Date();
  const me = useUser();
  // const status = me.isStaff ? 'Teachers' : 'Students';
  const todaysDay = today.getDay();
  const { lastSunday, nextSaturday } = getLastAndNextSunday(today);
  const { data, isLoading, error } = useGQLQuery(
    "weekCalendars",
    GET_WEEK_CALENDARS,
    {
      starting: lastSunday,
      ending: nextSaturday,
    },
    {
      initialData,
      staleTime: 1000 * 60 * 3, // 3 minutes
    }
  );
  const dailyEvents = useMemo(() => {
    const gcEvents = initialGoogleCalendarEvents?.events.filter((event) => {
      const date = new Date(event.date);
      return date >= new Date(lastSunday) && date <= new Date(nextSaturday);
    });

    // filter calendars by who can see them
    const filteredCalendars = data?.calendars?.filter((calendar) => {
      if (calendar.status === "Both") return true;
      if (calendar.status === "Teachers" && me.isStaff) return true;
      if (calendar.status === "Students" && me.isStudent) return true;
      if (calendar.status === "Students" && me.isParent) return true;
      return false;
    });
    const filteredCalendarsWithGoogle = [
      ...filteredCalendars,
      ...gcEvents,
    ].sort((a, b) => {
      const aDate = new Date(a.date);
      const bDate = new Date(b.date);
      return aDate - bDate;
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
  }, [initialGoogleCalendarEvents, data, lastSunday, nextSaturday, me]);
  if (!me) return <p />;
  // if (isLoading) return <Loading />;
  if (error) return <p>{error.message}</p>;

  return (
    <div className="grid grid-cols-8 flex-nowrap mb-1.5 max-[1100px]:grid-cols-4 max-[650px]:grid-cols-1">
      <SingleDayCalendar dailyEvents={dailyEvents.sundayEvents} day="Sunday" />
      <SingleDayCalendar dailyEvents={dailyEvents.mondayEvents} day="Monday" />
      <SingleDayCalendar dailyEvents={dailyEvents.tuesdayEvents} day="Tuesday" />
      <SingleDayCalendar dailyEvents={dailyEvents.wednesdayEvents} day="Wednesday" />
      <SingleDayCalendar dailyEvents={dailyEvents.thursdayEvents} day="Thursday" />
      <SingleDayCalendar dailyEvents={dailyEvents.fridayEvents} day="Friday" />
      <SingleDayCalendar dailyEvents={dailyEvents.saturdayEvents} day="Saturday" />
    </div>
  );
}
