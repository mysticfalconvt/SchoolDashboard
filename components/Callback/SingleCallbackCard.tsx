import Link from 'next/link';
import getDisplayName from '../../lib/displayName';
import { capitalizeFirstLetter } from '../../lib/nameUtils';
import { useUser } from '../User';
import CallbackCardMessages from './CallbackCardMessages';
import MarkCallbackCompleted from './MarkCallbackCompleted';

interface Teacher {
  id: string;
  name: string;
}

interface Student {
  id: string;
  name: string;
}

interface Callback {
  id: string;
  title: string;
  description: string;
  link?: string;
  dateAssigned: string;
  dateCompleted?: string;
  teacher: Teacher;
  student: Student;
}

interface User {
  id: string;
}

interface SingleCallbackCardProps {
  callback: Callback;
}

export default function SingleCallbackCard({
  callback,
}: SingleCallbackCardProps) {
  const me = useUser() as User;
  const dateAssigned = new Date(callback.dateAssigned).toLocaleDateString();
  const completed = callback.dateCompleted
    ? `Completed on ${new Date(callback.dateCompleted).toLocaleDateString()}`
    : 'Incomplete';

  if (!callback.student) return null;
  return (
    <div className="bg-gradient-to-tl from-[var(--redTrans)] to-[var(--blueTrans)] m-4 p-4 rounded-2xl text-xl flex flex-col justify-center items-center">
      <Link href={`/callback/${callback.id}`} className="text-center block">
        <h1 className="my-2 mx-4">{callback.title}</h1>
        <p className="mx-4 mb-4">
          {callback?.teacher?.id === me?.id
            ? ''
            : `${callback.teacher.name} -- `}{' '}
          {dateAssigned}
        </p>
        <p className="mx-4 mb-4">
          {callback?.student?.id === me?.id
            ? ''
            : `${capitalizeFirstLetter(
                getDisplayName(callback.student as any),
              )} -- `}{' '}
          {completed}
        </p>
        <p className="mx-4 mb-4">{callback.description}</p>
      </Link>
      {callback.link && (
        <Link
          href={
            callback.link?.startsWith('http')
              ? callback.link
              : `http://${callback.link}`
          }
          className="bg-white bg-opacity-20 py-0.5 px-2 rounded-lg -mt-2 mb-2 cursor-pointer inline-block"
        >
          {callback.link ? 'Link' : ''}
        </Link>
      )}
      <CallbackCardMessages me={me} callback={callback} />
      {!callback.dateCompleted && <MarkCallbackCompleted callback={callback} />}
    </div>
  );
}
