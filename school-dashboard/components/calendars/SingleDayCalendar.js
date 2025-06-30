import Link from 'next/link';
import React, { useState } from 'react';
import GradientButton, { SmallGradientButton } from '../styles/Button';

function DisplayEvent({ event }) {
  const day = new Date(event.date).toLocaleDateString();
  const createdDate = new Date(event.date);
  const [displayDetails, setDisplayDetails] = useState(true);
  return (
    <div>
      <div>
        {/* <p>{event.name}</p> */}
        <GradientButton onClick={() => setDisplayDetails(!displayDetails)}>
          {displayDetails ? event.name : 'Hide Details'}
        </GradientButton>
      </div>
      <div className="detailsContainer">
        <div className="details" hidden={displayDetails}>
          <div>
            <h2>{event.name}</h2>
            <p>{event.description}</p>
            {event.link ? (
              <Link
                href={
                  event.link.startsWith('http')
                    ? event.link
                    : `http://${event.link}`
                }
              >
                {event.linkTitle || 'Link'}
              </Link>
            ) : (
              ''
            )}
            <p>
              Created by: {event?.author?.name} on{' '}
              {createdDate.toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SingleDayCalendar({ dailyEvents, day }) {
  const todaysDay = new Date().toLocaleString('en-us', { weekday: 'long' });
  const todayClass = "bg-gradient-to-tr from-[var(--red)] to-[var(--blue)] p-4 rounded-2xl min-w-min border-none text-white/50 basis-[35%] col-span-2";
  const notTodayClass = "text-[var(--blue)] m-0.5 border-2 border-[var(--blue)] rounded-2xl basis-[10%]";
  return (
    <div className={todaysDay === day ? todayClass : notTodayClass}>
      <h2>{day}</h2>
      {dailyEvents?.map((today) => (
        <DisplayEvent key={today.id} event={today} />
      ))}
    </div>
  );
}
