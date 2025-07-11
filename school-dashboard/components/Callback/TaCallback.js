import gql from 'graphql-tag';
import Toggle from 'react-toggle';
import { useState } from 'react';
import { useUser } from '../User';
import DisplayError from '../ErrorMessage';
import CallbackTable from './CallbackTable';
import 'react-toggle/style.css';
import CallbackCards from './CallbackCards';
import { FormContainer } from '../styles/Form';
import { useGQLQuery } from '../../lib/useGqlQuery';
import Loading from '../Loading';

const MY_CALLBACK_ASSIGNMENTS = gql`
  query MY_CALLBACK_ASSIGNMENTS($taTeacher: ID!) {
    callbacks(
      orderBy: {dateAssigned: asc}
      where: {
        OR: [
          { student: { taTeacher: { id: {equals: $taTeacher} } } }
          {
            AND: [
              { teacher: { id: {equals: $taTeacher} } }
              { messageFromStudent: {notIn: [""]} }
            ]
          }
        ]
      }
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

export default function TaCallbacks() {
  const me = useUser();
  const [showCompleted, setShowCompleted] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const { data, isLoading, error } = useGQLQuery(
    'myTaCallbacks',
    MY_CALLBACK_ASSIGNMENTS,
    {
      taTeacher: me?.id,
    },
    {
      enabled: !!me,
    }
  );

  if (!me) return <p>Please Log In</p>;
  if (isLoading) return <Loading />;
  if (error) return <DisplayError>{error.message}</DisplayError>;
  const callbacks = data?.callbacks?.filter((callback) => {
    if (showCompleted) return true;
    return !callback.dateCompleted;
  });
  // if (!showTable && callbacks.length > 1) {
  //   setShowTable(true);
  // } else {
  //   setShowTable(showTable);
  // }
  if (callbacks.length === 0) return <p>You have no callback items</p>;
  return (
    <div style={{ width: "100vw" }}>
      <FormContainer visible={true}>
        <label>
          <span> Show Callbacks As Table</span>
          <Toggle
            checked={showTable}
            onChange={() => setShowTable(!showTable)}
          />
        </label>
      </FormContainer>
      {showTable && <CallbackTable callbackFormContainer />}
      {!showTable && <CallbackCards maxColumns={3} callbacks={callbacks} />}
    </div>
  );
}
