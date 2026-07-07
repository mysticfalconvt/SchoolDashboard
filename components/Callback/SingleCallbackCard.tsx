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
  const studentName = capitalizeFirstLetter(
    getDisplayName(callback.student as any),
  );
  return (
    <div className="bg-gradient-to-tl from-[var(--redTrans)] to-[var(--blueTrans)] m-4 p-5 rounded-2xl text-xl flex flex-col justify-center items-center shadow-lg hover:shadow-xl transition-shadow duration-300">
      <Link
        href={`/callback/${callback.id}`}
        className="text-center block w-full"
      >
        <h1 className="text-2xl font-semibold mb-1">{callback.title}</h1>

        {/* Status badge */}
        <span
          className={`inline-block text-xs font-semibold uppercase tracking-wide px-3 py-0.5 rounded-full mb-3 ${
            callback.dateCompleted
              ? 'bg-green-500/30 text-green-100'
              : 'bg-yellow-500/30 text-yellow-100'
          }`}
        >
          {completed}
        </span>

        <p className="text-sm opacity-80 mb-1">
          {callback?.student?.id === me?.id ? 'You' : studentName}
          {callback?.teacher?.id === me?.id
            ? ''
            : ` • from ${callback.teacher.name}`}
        </p>
        <p className="text-sm opacity-80 mb-3">Assigned {dateAssigned}</p>

        {callback.description && (
          <p className="text-base break-words px-2 mb-2">
            {callback.description}
          </p>
        )}
      </Link>
      {callback.link && (
        <Link
          href={
            callback.link?.startsWith('http')
              ? callback.link
              : `http://${callback.link}`
          }
          className="bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors py-0.5 px-3 rounded-lg mb-3 cursor-pointer inline-block text-base"
        >
          Link
        </Link>
      )}

      {/* Divider before the messages / actions */}
      <div className="w-full border-t border-white/20 my-2" />

      <CallbackCardMessages me={me} callback={callback} />
      {!callback.dateCompleted && <MarkCallbackCompleted callback={callback} />}
    </div>
  );
}
