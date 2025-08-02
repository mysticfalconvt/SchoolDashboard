import gql from 'graphql-tag';
import { useState } from 'react';
import Toggle from 'react-toggle';
import 'react-toggle/style.css';
import { useGQLQuery } from '../../lib/useGqlQuery';
import DisplayError from '../ErrorMessage';
import Loading from '../Loading';
import { FormContainer } from '../styles/Form';
import { useUser } from '../User';
import CallbackCards from './CallbackCards';
import CallbackTable from './CallbackTable';

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
  teacher: Teacher;
  student: Student;
  link?: string;
  description: string;
  title: string;
  dateAssigned: string;
  dateCompleted?: string;
  messageFromStudent?: string;
  messageFromTeacher?: string;
  messageFromStudentDate?: string;
  messageFromTeacherDate?: string;
}

interface User {
  id: string;
}

export default function StudentCallbacks() {
  const me = useUser() as User;
  const [showCompleted, setShowCompleted] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const { data, isLoading, error, refetch } = useGQLQuery(
    'myStudentCallbacks',
    MY_CALLBACK_ASSIGNMENTS,
    {
      student: me?.id,
    },
    {
      enabled: !!me,
    },
  );
  if (!me) return <p>Please Log In</p>;
  if (isLoading) return <Loading />;
  if (error) return <DisplayError error={error as any} />;
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
