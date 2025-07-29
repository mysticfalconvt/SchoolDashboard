import { useGqlMutation } from '@/lib/useGqlMutation';
import { useGQLQuery } from '@/lib/useGqlQuery';
import gql from 'graphql-tag';
import React, { useState } from 'react';
import { SPECIAL_GROUP_QUERY } from '../pages/specialGroup';
import Loading from './Loading';
import SearchForUserName from './SearchForUserName';
import { SmallGradientButton } from './styles/Button';
import { useUser } from './User';

const ADD_STUDENT_TO_GROUP_MUTATION = gql`
  mutation ADD_STUDENT_TO_GROUP_MUTATION($id: ID, $studentID: ID) {
    updateUser(
      where: { id: $id }
      data: { specialGroupStudents: { connect: { id: $studentID } } }
    ) {
      id
    }
  }
`;
const REMOVE_STUDENT_FROM_GROUP_MUTATION = gql`
  mutation REMOVE_STUDENT_FROM_GROUP_MUTATION($id: ID, $studentID: ID) {
    updateUser(
      where: { id: $id }
      data: { specialGroupStudents: { disconnect: { id: $studentID } } }
    ) {
      id
    }
  }
`;

interface SearchValue {
  userId: string;
  userName: string;
}

interface Student {
  id: string;
  name: string;
}

const ModifySpecialGroup: React.FC = () => {
  const me = useUser();
  const { data, isLoading, error, refetch } = useGQLQuery(
    `specialGroup-${me?.id}-${me?.name}-query`,
    SPECIAL_GROUP_QUERY,
    {
      id: me?.id,
    },
    {
      enabled: !!me,
      staleTime: 0,
    },
  );

  const [searchValue, setSearchValue] = useState<SearchValue | null>(null);
  const [thinking, setThinking] = useState(false);
  const [addStudent] = useGqlMutation(ADD_STUDENT_TO_GROUP_MUTATION);
  const [
    removeStudent,
    { data: removeData, loading: removeLoading, error: removeError },
  ] = useGqlMutation(REMOVE_STUDENT_FROM_GROUP_MUTATION);

  const studentList = data?.teacher?.specialGroupStudents || [];
  return (
    <div className="flex flex-col items-start justify-center">
      <h4>Student Group</h4>
      {thinking ? <Loading /> : null}
      <SearchForUserName
        name="studentName"
        userType="isStudent"
        value={searchValue?.userName || ''}
        updateUser={setSearchValue}
      />
      <SmallGradientButton
        type="button"
        className="p-4 m-2 bg-stone-500 border border-slate-400 rounded text-[var(--textColor)]"
        onClick={async () => {
          setThinking(true);
          await addStudent({
            id: me?.id,
            studentID: searchValue?.userId,
          });
          await refetch({});
          setSearchValue(null);
          setThinking(false);
        }}
        disabled={!searchValue}
      >
        add {searchValue?.userName}
      </SmallGradientButton>
      <div className="flex flex-row items-baseline justify-center flex-wrap gap-5 mt-2">
        {studentList.map((student: Student) => (
          <div key={student.id}>
            <span>{student.name}</span>
            <button
              type="button"
              className="border-none bg-transparent ml-2"
              onClick={async () => {
                setThinking(true);
                await removeStudent({
                  id: me?.id,
                  studentID: student?.id,
                });
                await refetch({});
                setSearchValue(null);
                setThinking(false);
              }}
            >
              ❌
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModifySpecialGroup;
