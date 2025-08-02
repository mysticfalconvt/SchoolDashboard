import gql from 'graphql-tag';
import Link from 'next/link';
import React, { useMemo } from 'react';
import isAllowed from '../../lib/isAllowed';
import { useGQLQuery } from '../../lib/useGqlQuery';
import Table from '../Table';
import { useUser } from '../User';
import NewCalendar from './NewCalendar';

export const GET_CALENDARS = gql`
  query GET_CALENDARS {
    calendars(orderBy: { date: asc }) {
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

interface Calendar {
  name: string;
  id: string;
  description: string;
  date: string;
  author: {
    name: string;
  };
  status: string;
  dateCreated: string;
  link?: string;
  linkTitle?: string;
  isGoogleCalendarEvent?: boolean;
}

interface CalendarsProps {
  dates?: { date: string };
  initialData?: any;
  googleCalendarEvents?: Calendar[];
}

const Calendars: React.FC<CalendarsProps> = ({
  dates,
  initialData,
  googleCalendarEvents,
}) => {
  const me = useUser();
  const teacherWithStudentEvents = me?.isStaff && me?.canSeeStudentEvents;
  const status = me?.isStaff ? 'Teachers' : 'Students';
  const editor = isAllowed(me, 'canManageCalendar');
  const { data, isLoading, error, refetch } = useGQLQuery(
    'allCalendars',
    GET_CALENDARS,
    {
      status,
    },
    {
      initialData,
      enabled: !!me,
      staleTime: 1000 * 60 * 3, // 3 minutes
    },
  );

  const calendarsFilteredByUserType = useMemo(
    () =>
      (data?.calendars || []).filter((calendar: Calendar) => {
        if (calendar.status === 'Both') return true;
        if (me?.isStaff && calendar.status === 'Teachers') return true;
        if (me?.isStudent && calendar.status === 'Students') return true;
        if (me?.isParent && calendar.status === 'Students') return true;
        if (teacherWithStudentEvents && calendar.status === 'Students')
          return true;
        return false;
      }),
    [data, me, teacherWithStudentEvents],
  );

  const calendarsWithGoogleEvents = useMemo(() => {
    if (!googleCalendarEvents) return calendarsFilteredByUserType;
    return [...calendarsFilteredByUserType, ...googleCalendarEvents];
  }, [calendarsFilteredByUserType, googleCalendarEvents]);

  const filteredCalendars = calendarsWithGoogleEvents.filter(
    (singleCalendarToFilter: Calendar) => {
      const date = new Date(singleCalendarToFilter.date);
      const filterDate = new Date(dates?.date || new Date());
      return date >= filterDate;
    },
  );

  const columns = useMemo(
    () => [
      {
        Header: 'Events',
        columns: [
          {
            Header: 'Event',
            accessor: 'name',
            Cell: ({ cell, value }: any) => {
              return (
                <Link
                  href={
                    !cell.row.original.isGoogleCalendarEvent
                      ? `/calendarEvent/${cell.row.original.id}`
                      : cell.row.original.link
                  }
                >
                  {value}
                </Link>
              );
            },
          },
          {
            Header: 'Description',
            accessor: 'description',
            Cell: ({ cell, value }: any) => {
              return (
                <Link
                  href={
                    !cell.row.original.isGoogleCalendarEvent
                      ? `/calendarEvent/${cell.row.original.id}`
                      : cell.row.original.link
                  }
                >
                  {value}
                </Link>
              );
            },
          },
          {
            Header: 'Date',
            accessor: 'date',
            Cell: ({ cell: { value } }: any) => {
              const today = new Date().toLocaleDateString();
              const displayDate = new Date(value).toLocaleDateString();
              const isToday = today === displayDate;
              return isToday ? `📆 Today 📆` : displayDate;
            },
          },
          {
            Header: 'Link',
            accessor: 'link',
            Cell: ({ cell: { value } }: any) => (
              <Link
                href={value?.startsWith('http') ? value : `http://${value}`}
              >
                {value ? 'Link' : ''}
              </Link>
            ),
          },
          {
            Header: 'visibility',
            accessor: 'status',
          },
        ],
      },
    ],
    [],
  );

  if (!me) return <div>You must be logged in to view this page</div>;
  if (error) {
    return <p>{error.message}</p>;
  }
  return (
    <>
      <NewCalendar hidden={!editor} refetchCalendars={refetch} />
      <Table
        data={filteredCalendars || []}
        columns={columns}
        searchColumn="name"
        hiddenColumns={me?.isStaff ? [] : ['status']}
      />
    </>
  );
};

export default Calendars;
