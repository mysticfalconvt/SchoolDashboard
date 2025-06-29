import { useMutation } from "@apollo/client";
import { useState } from "react";
import { useGQLQuery } from "../lib/useGqlQuery";
import { SPECIAL_GROUP_QUERY } from "../pages/specialGroup";
import SearchForUserName from "./SearchForUserName";
import { useUser } from "./User";
import gql from "graphql-tag";
import Loading from "./Loading";
import { SmallGradientButton } from "./styles/Button";

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

export default function ModifySpecialGroup() {
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
    }
  );

  const [searchValue, setSearchValue] = useState("");
  const [thinking, setThinking] = useState(false);
  const [addStudent] = useMutation(ADD_STUDENT_TO_GROUP_MUTATION, {
    variables: {
      id: me?.id,
      studentID: searchValue?.userId,
    },
  });
  const [removeStudent] = useMutation(REMOVE_STUDENT_FROM_GROUP_MUTATION);

  const studentList = data.teacher.specialGroupStudents;
  return (
    <div className="flex flex-col items-start justify-center">
      <h4>Student Group</h4>
      {thinking ? <Loading /> : null}
      <SearchForUserName
        name="studentName"
        userType="isStudent"
        // value={inputs.studentName}
        updateUser={setSearchValue}
      />
      <SmallGradientButton
        type="button"
        className="p-4 m-2 bg-stone-500 border border-slate-400 rounded text-[var(--textColor)]"
        onClick={async () => {
          setThinking(true);
          await addStudent();
          await refetch();
          setSearchValue("");
          setThinking(false);
        }}
        disabled={searchValue === ""}
      >
        add {searchValue.userName}
      </SmallGradientButton>
      <div className="flex flex-row items-baseline justify-center flex-wrap gap-5 mt-2">
        {studentList.map((student) => (
          <div key={student.id}>
            <span>{student.name}</span>
            <button
              type="button"
              className="border-none bg-transparent ml-2"
              onClick={async () => {
                setThinking(true);
                await removeStudent({
                  variables: {
                    id: me?.id,
                    studentID: student?.id,
                  },
                });
                await refetch();
                setSearchValue("");
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
}
