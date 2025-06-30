import gql from "graphql-tag";
import Toggle from "react-toggle";
import { useState } from "react";
import { useUser } from "../User";
import DisplayError from "../ErrorMessage";
import CallbackTable from "./CallbackTable";
import "react-toggle/style.css";
import CallbackCards from "./CallbackCards";
import { FormContainer } from "../styles/Form";
import { useGQLQuery } from "../../lib/useGqlQuery";
import Loading from "../Loading";
import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import { useQueryClient } from "react-query";
import GradientButton from "../styles/Button";

const MY_CALLBACK_ASSIGNMENTS = gql`
  query MY_CALLBACK_ASSIGNMENTS($student: ID) {
    callbacks(
      orderBy: { dateAssigned: asc }
      where: { student: { id: { equals: $student } } }
    ) {
      id
      teacher {
        id
        name
      }
      student {
        name
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

export default function StudentCallbacks() {
  const me = useUser();
  const [showCompleted, setShowCompleted] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const { data, isLoading, error, refetch } = useGQLQuery(
    "myStudentCallbacks",
    MY_CALLBACK_ASSIGNMENTS,
    {
      student: me?.id,
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
      <FormContainer visible={true}>
        <label>
          <span>Show Completed </span>
          <Toggle
            checked={showCompleted}
            onChange={() => setShowCompleted(!showCompleted)}
          />
        </label>
        <label>
          <span> Show Callbacks As Table</span>
          <Toggle
            checked={showTable}
            onChange={() => setShowTable(!showTable)}
          />
        </label>
      </FormContainer>
      {showTable && <CallbackTable callbacks={callbacks} />}

      {!showTable && <CallbackCards callbacks={callbacks} />}
    </div>
  );
}
