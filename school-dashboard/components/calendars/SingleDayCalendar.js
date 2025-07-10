import Link from 'next/link';
import React, { useState } from 'react';
import { Fragment } from 'react';
import GradientButton, { SmallGradientButton } from '../styles/Button';

function DisplayEvent({ event, onClick }) {
  return (
    <div className="w-full">
      <div
        onClick={onClick}
        className={`bg-gradient-to-tl from-[var(--red)] to-[var(--blue)] text-[var(--navTextColor)] font-medium border border-[var(--backgroundColor)] rounded-xl uppercase text-lg px-4 py-3 inline-block transition-all duration-500 mx-0 max-h-full outline-none hover:border-[var(--red)] hover:brightness-110 cursor-pointer break-words whitespace-normal select-none w-full`}
        tabIndex={0}
        role="button"
        aria-label={`Show details for ${event.name}`}
      >
        {event.name}
      </div>
    </div>
  );
}

function EventModal({ event, onClose }) {
  if (!event) return null;
  const createdDate = new Date(event.date);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={onClose}>
      <div
        className="bg-gradient-to-tl from-[var(--red)] to-[var(--blue)] text-[var(--navTextColor)] rounded-2xl p-8 max-w-lg w-full relative border-4 border-[var(--backgroundColor)] shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <button
          className="absolute top-2 right-2 text-2xl font-bold text-white bg-black bg-opacity-30 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-60 transition"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-2 break-words whitespace-normal">{event.name}</h2>
        <p className="mb-2 break-words whitespace-normal">{event.description}</p>
        {event.link ? (
          <a
            href={event.link.startsWith('http') ? event.link : `http://${event.link}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-white break-all"
          >
            {event.linkTitle || 'Link'}
          </a>
        ) : null}
        <p className="mt-4 text-sm text-white/70">
          Created by: {event?.author?.name} on {createdDate.toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

export default function SingleDayCalendar({ dailyEvents, day }) {
  const todaysDay = new Date().toLocaleString('en-us', { weekday: 'long' });
  const todayClass = "bg-gradient-to-tr from-[var(--red)] to-[var(--blue)] p-4 rounded-2xl border-none text-white/50 w-full box-border";
  const notTodayClass = "text-[var(--blue)] m-0.5 border-2 border-[var(--blue)] rounded-2xl";
  const [openEvent, setOpenEvent] = useState(null);
  return (
    <Fragment>
      <div className={`h-full ${todaysDay === day ? 'col-span-2' : 'col-span-1'} ${todaysDay === day ? todayClass : notTodayClass}`}>
        <h2>{day}</h2>
        <div className="flex flex-col gap-2">
          {dailyEvents?.map((today) => (
            <DisplayEvent key={today.id} event={today} onClick={() => setOpenEvent(today)} />
          ))}
        </div>
      </div>
      <EventModal event={openEvent} onClose={() => setOpenEvent(null)} />
    </Fragment>
  );
}
