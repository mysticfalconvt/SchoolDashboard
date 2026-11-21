import React, { Fragment, useState } from 'react';

interface CalendarEvent {
  id: string;
  name: string;
  description?: string;
  link?: string;
  linkTitle?: string;
  date: string;
  author?: {
    name: string;
  };
}

interface DisplayEventProps {
  event: CalendarEvent;
  onClick: () => void;
}

function DisplayEvent({ event, onClick }: DisplayEventProps) {
  return (
    <div className="w-full">
      <div
        onClick={onClick}
        className={`bg-linear-to-tl from-(--red) to-(--blue) text-(--navTextColor) font-medium border border-(--backgroundColor) rounded-xl uppercase text-lg px-4 py-3 inline-block transition-all duration-500 mx-0 max-h-full outline-hidden hover:border-(--red) hover:brightness-110 cursor-pointer wrap-break-word whitespace-normal select-none w-full`}
        tabIndex={0}
        role="button"
        aria-label={`Show details for ${event.name}`}
      >
        {event.name}
      </div>
    </div>
  );
}

interface EventModalProps {
  event: CalendarEvent | null;
  onClose: () => void;
}

function EventModal({ event, onClose }: EventModalProps) {
  if (!event) return null;
  const createdDate = new Date(event.date);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-linear-to-tl from-(--red) to-(--blue) text-(--navTextColor) rounded-2xl p-8 max-w-lg w-full relative border-4 border-(--backgroundColor) shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-2 right-2 text-2xl font-bold text-white bg-black/30 rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/60 transition"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-2 wrap-break-word whitespace-normal">
          {event.name}
        </h2>
        <p className="mb-2 wrap-break-word whitespace-normal">
          {event.description}
        </p>
        {event.link ? (
          <a
            href={
              event.link.startsWith('http')
                ? event.link
                : `http://${event.link}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-white break-all"
          >
            {event.linkTitle || 'Link'}
          </a>
        ) : null}
        <p className="mt-4 text-sm text-white/70">
          Created by: {event?.author?.name} on{' '}
          {createdDate.toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

interface SingleDayCalendarProps {
  dailyEvents: CalendarEvent[];
  day: string;
}

const SingleDayCalendar: React.FC<SingleDayCalendarProps> = ({
  dailyEvents,
  day,
}) => {
  const todaysDay = new Date().toLocaleString('en-us', { weekday: 'long' });
  const todayClass =
    'bg-linear-to-tr from-(--red) to-(--blue) p-4 rounded-2xl border-none text-white/50 w-full box-border';
  const notTodayClass =
    'text-(--blue) m-0.5 border-2 border-(--blue) rounded-2xl';
  const [openEvent, setOpenEvent] = useState<CalendarEvent | null>(null);

  return (
    <Fragment>
      <div
        className={`h-full ${todaysDay === day ? 'col-span-2 max-[650px]:col-span-1' : 'col-span-1'} ${todaysDay === day ? todayClass : notTodayClass}`}
      >
        <h2>{day}</h2>
        <div className="flex flex-col gap-2">
          {dailyEvents?.map((today) => (
            <DisplayEvent
              key={today.id}
              event={today}
              onClick={() => setOpenEvent(today)}
            />
          ))}
        </div>
      </div>
      <EventModal event={openEvent} onClose={() => setOpenEvent(null)} />
    </Fragment>
  );
};

export default SingleDayCalendar;
