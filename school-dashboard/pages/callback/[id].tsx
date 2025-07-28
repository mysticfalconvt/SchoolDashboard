import gql from 'graphql-tag';
import { NextPage } from 'next';
import Link from 'next/link';
import { useState } from 'react';
import CallbackCardMessages from '../../components/Callback/CallbackCardMessages';
import CallbackEditor from '../../components/Callback/CallbackEditor';
import DuplicateCallback from '../../components/Callback/DuplicateCallback';
import MarkCallbackCompleted from '../../components/Callback/MarkCallbackCompleted';
import Loading from '../../components/Loading';
import { SmallGradientButton } from '../../components/styles/Button';
import { useUser } from '../../components/User';
import { useGQLQuery } from '../../lib/useGqlQuery';

const GET_SINGLE_CALLBACK = gql`
  query GET_SINGLE_CALLBACK($id: ID!) {
    callback(where: { id: $id }) {
      id
      title
      description
      daysLate
      dateAssigned
      dateCompleted
      messageFromTeacher
      messageFromTeacherDate
      messageFromStudent
      messageFromStudentDate
      link

      teacher {
        name
        id
      }
      student {
        id
        name
        averageTimeToCompleteCallback
        callbackCount
        email
        parent {
          email
          id
          name
        }
      }
    }
  }
`;

interface Parent {
  email: string;
  id: string;
  name: string;
}

interface Student {
  id: string;
  name: string;
  averageTimeToCompleteCallback?: number;
  callbackCount?: number;
  email?: string;
  parent?: Parent;
}

interface Teacher {
  name: string;
  id: string;
}

interface Callback {
  id: string;
  title: string;
  description?: string;
  daysLate?: number;
  dateAssigned: string;
  dateCompleted?: string;
  messageFromTeacher?: string;
  messageFromTeacherDate?: string;
  messageFromStudent?: string;
  messageFromStudentDate?: string;
  link?: string;
  teacher: Teacher;
  student: Student;
}

interface SingleCallbackPageProps {
  query: {
    id: string;
  };
}

const SingleCallbackPage: NextPage<SingleCallbackPageProps> = ({ query }) => {
  const me = useUser();
  const { data, isLoading, error, refetch } = useGQLQuery(
    `SingleCallback-${query.id}`,
    GET_SINGLE_CALLBACK,
    {
      id: query.id,
    },
  );
  const [editing, setEditing] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  if (isLoading) return <Loading />;
  if (error) return <p>{error.message}</p>;
  const callback = data?.callback as Callback;
  if (!callback) return <div>Callback not found</div>;

  const dateAssigned = new Date(callback?.dateAssigned).toLocaleDateString();
  const dateCompleted = callback?.dateCompleted
    ? new Date(callback?.dateCompleted).toLocaleDateString()
    : 'Not Yet Completed';
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl shadow-lg bg-gradient-to-tl from-[var(--redTrans)] to-[var(--blueTrans)]">
      <h1 className="rounded-3xl shadow-lg py-1 px-5 mt-2.5 mb-0 bg-gradient-to-bl from-[var(--redTrans)] to-[var(--blueTrans)]">
        {me?.id === callback?.teacher.id && (
          <SmallGradientButton
            onClick={() => {
              setEditing(!editing);
            }}
          >
            Edit
          </SmallGradientButton>
        )}
        {callback.title}{' '}
        {me?.id === callback?.teacher.id && (
          <SmallGradientButton
            onClick={() => {
              setDuplicating(!duplicating);
            }}
          >
            Duplicate
          </SmallGradientButton>
        )}
      </h1>
      {!editing && !duplicating && (
        <>
          <h2 className="font-medium mt-0 mb-0">
            Assigned By: {callback.teacher.name}
          </h2>
          <h2 className="font-medium mt-0 mb-0">{callback.student.name}</h2>
          <p className="my-1.5">
            Average Time For {callback.student.name} To Complete Callback:{' '}
            {callback.student.averageTimeToCompleteCallback
              ? callback.student.averageTimeToCompleteCallback
              : 'N/A'}{' '}
            Days
          </p>
          <p className="my-1.5">{callback.description}</p>
          <p className="my-1.5">
            Assigned on {dateAssigned} - Completed on {dateCompleted}
          </p>
          {callback.link && (
            <Link
              legacyBehavior
              href={
                callback.link?.startsWith('http')
                  ? callback.link
                  : `http://${callback.link}`
              }
            >
              <a className="link">
                {callback.link ? `Link to ${callback.link}` : ''}
              </a>
            </Link>
          )}
          <div>
            <CallbackCardMessages callback={callback} me={me} />
          </div>
          {!callback.dateCompleted && (
            <MarkCallbackCompleted callback={callback} />
          )}{' '}
        </>
      )}

      {/* editing form */}
      {editing && (
        <>
          <CallbackEditor
            callback={callback}
            refetch={refetch}
            setEditing={setEditing}
          />
        </>
      )}
      {duplicating && (
        <>
          <DuplicateCallback
            callback={callback}
            setDuplicating={setDuplicating}
          />
        </>
      )}
    </div>
  );
};

export default SingleCallbackPage;
