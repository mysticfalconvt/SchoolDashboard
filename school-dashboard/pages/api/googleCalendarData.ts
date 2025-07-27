import { google } from 'googleapis';
import type { NextApiRequest, NextApiResponse } from 'next';

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

export const getCalendarData = async (
  req: NextApiRequest,
  res: NextApiResponse,
) => {
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
    const start = new Date(event.date);
    const end = new Date(event.endDate);
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
  const initialGoogleCalendarEvents =
    events?.map((event) => {
      return {
        ...event,
        date: new Date(event.date).toISOString(),
        endDate: new Date(event.endDate).toISOString(),
        description: event.description || '',
      };
    }) || [];
  res.status(200).json({ events: initialGoogleCalendarEvents });
};

export default getCalendarData;
