import gql from 'graphql-tag';
import type { NextPage } from 'next';
import Link from 'next/link';
import { useState } from 'react';
import Toggle from 'react-toggle';
import 'react-toggle/style.css';
import CallbackCards from '../components/Callback/CallbackCards';
import CallbackTable from '../components/Callback/CallbackTable';
import NewCallback from '../components/Callback/NewCallbackButton';
import NewCallbackMultiStudent from '../components/Callback/newCallbackMultiStudent';
import DisplayError from '../components/ErrorMessage';
import Loading from '../components/Loading';
import GradientButton from '../components/styles/Button';
import { useUser } from '../components/User';
import { useGQLQuery } from '../lib/useGqlQuery';

const MY_CALLBACK_ASSIGNMENTS = gql`
  query MY_CALLBACK_ASSIGNMENTS($teacher: ID) {
    callbacks(
      orderBy: { dateAssigned: asc }
      where: { teacher: { id: { equals: $teacher } } }
    ) {
      id
      teacher {
        id
        name
      }
      student {
        name
        preferredName
        id
      }
      link
      description
      title
      dateAssigned
      dateCompleted
      messageFromStudent
      messageFromTeacher
      messageFromStudentDate
      messageFromTeacherDate
    }
  }
`;

interface Callback {
  id: string;
  teacher: {
    id: string;
    name: string;
  };
  student: {
    name: string;
    preferredName: string;
    id: string;
  };
  link: string;
  description: string;
  title: string;
  dateAssigned: string;
  dateCompleted?: string;
  messageFromStudent?: string;
  messageFromTeacher?: string;
  messageFromStudentDate?: string;
  messageFromTeacherDate?: string;
}

const Callback: NextPage = () => {
  const me = useUser();
  const [showCompleted, setShowCompleted] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const { data, isLoading, error, refetch } = useGQLQuery(
    'myAssignedCallbacks',
    MY_CALLBACK_ASSIGNMENTS,
    {
      teacher: me?.id,
    },
    {
      enabled: !!me,
    },
  );

  if (!me) return <p>Please Log In</p>;
  if (isLoading) return <Loading />;
  if (error) return <DisplayError error={error} />;
  const callbacks = data.callbacks.filter((callback: Callback) => {
    if (showCompleted) return true;
    return !callback.dateCompleted;
  });
  // if (!showTable && callbacks.length > 1) {
  //   setShowTable(true);
  // } else {
  //   setShowTable(showTable);
  // }
  return (
    <div>
      {/* Controls Section: Buttons in one row, toggles left-aligned below */}
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-4 py-6">
        <div className="flex flex-row flex-nowrap items-center gap-4 justify-center">
          <div className="flex flex-row items-center gap-2">
            <NewCallback refetch={refetch} />
            <NewCallbackMultiStudent refetch={refetch} />
            <GradientButton>
              <Link href="/mystudentscallback" className="text-white">My class students callback</Link>
            </GradientButton>
          </div>
        </div>
        <div className="flex flex-row flex-wrap items-center gap-6 justify-start w-full">
          <label className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
            Show Completed
            <Toggle
              checked={showCompleted}
              onChange={() => setShowCompleted(!showCompleted)}
            />
          </label>
          <label className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
            Show As Table
            <Toggle
              checked={showTable}
              onChange={() => setShowTable(!showTable)}
            />
          </label>
        </div>
      </div>
      {/* Main Content Below Controls */}
      <div className="pt-0">
        {showTable && <CallbackTable showClassBlock callbacks={callbacks} />}
        {!showTable && <CallbackCards callbacks={callbacks} />}
      </div>
    </div>
  );
};

export default Callback;
