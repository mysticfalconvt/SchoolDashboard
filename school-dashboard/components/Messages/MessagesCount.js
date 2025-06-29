import gql from 'graphql-tag';
import React, { useState } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { useGQLQuery } from '../../lib/useGqlQuery';
import { useUser } from '../User';
import MessagesList from './MessagesList';
import Loading from '../Loading';

const MY_CALLBACK_ASSIGNMENTS = gql`
  query MY_CALLBACK_ASSIGNMENTS($me: ID) {
  messages(orderBy: {sent: asc}, where: { receiver:{id: {equals:$me}} }) {
    id
    subject
    message
    read
    link
    sent
    sender {
      id
      name
    }
  }
  messagesCount(where: { receiver: { id: {equals: $me} }, read: {equals: false} }) 
    
  
}
`;

export default function MessagesCount({ mobile = false }) {
  const me = useUser();
  const { data, isLoading, error, refetch } = useGQLQuery(
    'myMessages',
    MY_CALLBACK_ASSIGNMENTS,
    {
      me: me?.id,
    },
    {
      enabled: !!me,
      refetchInterval: 300000,
    }
  );
  const unread = data?.messagesCount;
  const [viewAllMessages, setViewAllMessages] = useState(false);
  if (isLoading) return <Loading />;
  return (
    <span className="hidePrint relative">
      <TransitionGroup>
        <CSSTransition
          unmountOnExit
          classNames="count"
          className="count"
          key={unread}
          timeout={{ enter: 400, exit: 400 }}
        >
          <>
            <button
              type="button"
              className={
                mobile
                  ? "flex items-center justify-center bg-gradient-to-tl from-[var(--blue)] to-[var(--red)] text-white font-bold rounded-lg my-2 w-full h-10 px-4 shadow transition-transform duration-200 hover:brightness-110 skew-x-[-20deg] border-none focus:outline-none"
                  : "flex items-center justify-center bg-gradient-to-tl from-[var(--blue)] to-[var(--red)] text-white font-bold rounded-lg ml-1 min-w-8 h-10 px-2 shadow transition-transform duration-200 hover:brightness-110 skew-x-[-20deg] border-none focus:outline-none"
              }
              style={mobile ? {} : { minWidth: '2.5rem', width: '2.5rem', padding: 0 }}
              onClick={() => setViewAllMessages(!viewAllMessages)}
              aria-label="Show unread messages"
            >
              <span className={mobile ? "skew-x-[20deg] w-full text-center text-lg" : "skew-x-[20deg] w-full text-center text-lg"}>
                {mobile ? `${unread} messages` : unread}
              </span>
            </button>
            {viewAllMessages && <MessagesList messages={data?.messages || []} />}
          </>
        </CSSTransition>
      </TransitionGroup>
    </span>
  );
}
