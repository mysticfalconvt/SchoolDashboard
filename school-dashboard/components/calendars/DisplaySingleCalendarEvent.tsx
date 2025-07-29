import Link from 'next/link';
import React, { useState } from 'react';
import { SmallGradientButton } from '../styles/Button';

interface CalendarEvent {
  id: string;
  name: string;
  description?: string;
  link?: string;
  linkTitle?: string;
  date: string;
  dateCreated: string;
  author: {
    name: string;
  };
}

interface DisplaySingleCalendarEventProps {
  calendar: CalendarEvent;
}

const DisplaySingleCalendarEvent: React.FC<DisplaySingleCalendarEventProps> = ({
  calendar,
}) => {
  const [displayDetails, setDisplayDetails] = useState(true);
  const date = new Date(calendar.date);
  const createdDate = new Date(calendar.dateCreated).toLocaleDateString();
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  // console.log(`${calendar.name} - ${date} - ${today}`);

  return (
    <div className="flex flex-col basis-1/4">
      <div className="m-4 p-4 rounded-2xl opacity-80 bg-gradient-to-tl from-[var(--red)] to-[var(--blue)]">
        <h2>
          <span style={{ color: 'var(--red)' }} hidden={!isToday}>
            Today 📆{' '}
          </span>
          {calendar.name}
        </h2>
        <h4>{date.toDateString()}</h4>
        <SmallGradientButton onClick={() => setDisplayDetails(!displayDetails)}>
          {displayDetails ? 'Details' : 'Hide Details'}
        </SmallGradientButton>
      </div>
      <div className="ml-2.5 w-2.5 h-2.5 z-[100]">
        <div className="w-[200px] overflow-visible" hidden={displayDetails}>
          <div className="mt-[-2rem] p-4 bg-gradient-to-tr from-[var(--red)] to-[var(--blue)] text-white opacity-80 rounded-xl">
            <p>{calendar.description}</p>
            {calendar.link ? (
              <Link
                href={
                  calendar.link.startsWith('http')
                    ? calendar.link
                    : `http://${calendar.link}`
                }
              >
                {calendar.linkTitle || 'Link'}
              </Link>
            ) : (
              ''
            )}
            <p>
              Created by: {calendar.author.name} on {createdDate}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisplaySingleCalendarEvent;
