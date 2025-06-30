import gql from "graphql-tag";
import Toggle from "react-toggle";
import { useState } from "react";
import { useGQLQuery } from "../lib/useGqlQuery";
import { useUser } from "../components/User";
import DisplayError from "../components/ErrorMessage";
import CallbackTable from "../components/Callback/CallbackTable";
import "react-toggle/style.css";
import CallbackCards from "../components/Callback/CallbackCards";
import NewCallback from "../components/Callback/NewCallbackButton";
import { FormContainer } from "../components/styles/Form";
import Loading from "../components/Loading";
import NewCallbackMultiStudent from "../components/Callback/newCallbackMultiStudent";

const MY_CALLBACK_ASSIGNMENTS = gql`
  query MY_CALLBACK_ASSIGNMENTS($teacher: ID) {
    callbacks(
      orderBy: { dateAssigned: asc }
      where: {
        student: {
          OR: [
            { block1Teacher: { id: { equals: $teacher } } }
            { block2Teacher: { id: { equals: $teacher } } }
            { block3Teacher: { id: { equals: $teacher } } }
            { block4Teacher: { id: { equals: $teacher } } }
            { block5Teacher: { id: { equals: $teacher } } }
            { block6Teacher: { id: { equals: $teacher } } }
            { block7Teacher: { id: { equals: $teacher } } }
            { block8Teacher: { id: { equals: $teacher } } }
            { block9Teacher: { id: { equals: $teacher } } }
            { block10Teacher: { id: { equals: $teacher } } }
          ]
        }
      }
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

export default function Callback() {
  const me = useUser();
  const [showCompleted, setShowCompleted] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const { data, isLoading, error, refetch } = useGQLQuery(
    "myStudentsCallbacks",
    MY_CALLBACK_ASSIGNMENTS,
    {
      teacher: me?.id,
    },
    {
      enabled: !!me,
    }
  );

  if (!me) return <p>Please Log In</p>;
  if (isLoading) return <Loading />;
  if (error) return <DisplayError>{error.message}</DisplayError>;
  const callbacks = data.callbacks.filter((callback) => {
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
      <div className="mb-4 font-bold text-white text-lg">Callback for students in B1-B8 classes</div>
      {/* Controls Section: Buttons in one row, toggles left-aligned below */}
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-4 py-6">
        <div className="flex flex-row flex-nowrap items-center gap-4 justify-center overflow-x-auto">
          <NewCallback refetch={refetch} />
          <NewCallbackMultiStudent refetch={refetch} />
        </div>
        <div className="flex flex-row flex-wrap items-center gap-6 justify-start w-full">
          <label className="flex items-center gap-2 font-bold text-white">
            Show Completed
            <Toggle
              checked={showCompleted}
              onChange={() => setShowCompleted(!showCompleted)}
            />
          </label>
          <label className="flex items-center gap-2 font-bold text-white">
            Show As Table
            <Toggle
              checked={showTable}
              onChange={() => setShowTable(!showTable)}
            />
          </label>
        </div>
      </div>
      {showTable && <CallbackTable callbacks={callbacks} />}
      {!showTable && <CallbackCards callbacks={callbacks} />}
    </div>
  );
}
