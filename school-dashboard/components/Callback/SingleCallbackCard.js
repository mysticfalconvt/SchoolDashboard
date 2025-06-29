import Link from "next/link";
import getDisplayName from "../../lib/displayName";
import { capitalizeFirstLetter } from "../../lib/nameUtils";
import { useUser } from "../User";
import CallbackCardMessages from "./CallbackCardMessages";
import MarkCallbackCompleted from "./MarkCallbackCompleted";

export default function SingleCallbackCard({ callback }) {
  const me = useUser();
  const dateAssigned = new Date(callback.dateAssigned).toLocaleDateString();
  const completed = callback.dateCompleted
    ? `Completed on ${new Date(callback.dateCompleted).toLocaleDateString()}`
    : "Incomplete";

  if (!callback.student) return null;
  return (
    <div className="bg-gradient-to-tl from-[var(--redTrans)] to-[var(--blueTrans)] m-4 p-4 rounded-2xl text-xl flex flex-col justify-center items-center">
      <Link legacyBehavior href={`/callback/${callback.id}`}>
        <a className="text-center">
          <h1 className="my-2 mx-4">{callback.title}</h1>
          <p className="mx-4 mb-4">
            {callback?.teacher?.id === me?.id
              ? ""
              : `${callback.teacher.name} -- `}{" "}
            {dateAssigned}
          </p>
          <p className="mx-4 mb-4">
            {callback?.student?.id === me?.id
              ? ""
              : `${capitalizeFirstLetter(
                getDisplayName(callback.student)
              )} -- `}{" "}
            {completed}
          </p>
          <p className="mx-4 mb-4">{callback.description}</p>
        </a>
      </Link>
      {callback.link && (
        <Link
          href={
            callback.link?.startsWith("http")
              ? callback.link
              : `http://${callback.link}`
          }
        >
          <p className="bg-white bg-opacity-20 py-0.5 px-2 rounded-lg -mt-2 mb-2 cursor-pointer">{callback.link ? "Link" : ""}</p>
        </Link>
      )}
      <CallbackCardMessages me={me} callback={callback} />
      {!callback.dateCompleted && <MarkCallbackCompleted callback={callback} />}
    </div>
  );
}
