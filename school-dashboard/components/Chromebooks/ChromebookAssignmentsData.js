import gql from "graphql-tag";
import React, { useMemo, useState } from "react";
import { useGQLQuery } from "../../lib/useGqlQuery";
import { useMutation } from "@apollo/client";
import { SmallGradientButton } from "../styles/Button";
import { useQueryClient } from "react-query";

const GET_ALL_TEACHERS_QUERY = gql`
  query GET_ALL_TEACHERS_QUERY {
    users(where: { hasTA: { equals: true } }) {
      id
      name
    }
  }
`;

const GET_ALL_STUDENTS_QUERY = gql`
  query GET_ALL_STUDENTS_QUERY {
    users(where: { isStudent: { equals: true } }) {
      id
      name
    }
  }
`;

const UPDATE_CHROMEBOOK_STUDENT_ASSIGNMENT_MUTATION = gql`
  mutation UPDATE_CHROMEBOOK_ASSIGNMENT_MUTATION($id: ID!, $studentId: ID) {
    updateChromebookAssignment(
      where: { id: $id }
      data: { student: { connect: { id: $studentId } } }
    ) {
      id
      student {
        id
        name
      }
    }
  }
`;

const REMOVE_CHROMEBOOK_STUDENT_ASSIGNMENT_MUTATION = gql`
  mutation REMOVE_CHROMEBOOK_ASSIGNMENT_MUTATION($id: ID!) {
    updateChromebookAssignment(
      where: { id: $id }
      data: { student: { disconnect: true } }
    ) {
      id
      student {
        id
        name
      }
    }
  }
`;

const EditStudentRow = ({
  assignment,
  studentList,
  updateChromebookAssignment,
}) => {
  const [editable, setEditable] = useState(false);
  const queryClient = useQueryClient();
  const [studentName, setStudentName] = useState(assignment.student?.name);
  const [removeChromebookAssignment] = useMutation(
    REMOVE_CHROMEBOOK_STUDENT_ASSIGNMENT_MUTATION
  );

  return (
    <div
      key={assignment.id}
      style={{
        display: "flex",
        gap: "1rem",
      }}
    >
      <SmallGradientButton onClick={() => setEditable(!editable)}>
        Edit
      </SmallGradientButton>
      <div className=" text-3xl">{assignment.number}</div>
      {editable ? (
        <select
          className="border-2 border-gray-400 rounded-md"
          value={assignment.student?.id}
          onChange={async (e) => {
            if (e.target.value === "REMOVE") {
              const res = await removeChromebookAssignment({
                variables: {
                  id: assignment.id,
                },
              });

              if (res?.data?.updateChromebookAssignment) {
                // queryClient.refetchQueries("Chromebook Assignments");
                setStudentName(
                  res.data.updateChromebookAssignment.student?.name
                );
                setEditable(false);
              }
              return;
            }
            const res = await updateChromebookAssignment({
              variables: {
                id: assignment.id,
                studentId: e.target.value,
              },
            });
            if (res?.data?.updateChromebookAssignment) {
              //   queryClient.refetchQueries("Chromebook Assignments");
              setStudentName(res.data.updateChromebookAssignment.student?.name);
              setEditable(false);
            }
          }}
        >
          <option value={null}></option>
          <option value="REMOVE">Remove Assignment</option>
          {studentList.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name}
            </option>
          ))}
        </select>
      ) : (
        <div>{studentName}</div>
      )}
    </div>
  );
};

export default function ChromebookAssignmentsData({ assignments }) {
  const studentsWithAssignments = useMemo(() => {
    if (!assignments) return [];
    return assignments
      .filter((assignment) => assignment.student)
      .map((assignment) => assignment.student.id);
  }, [assignments]);

  const { data: teachersData, isLoading: teachersLoading } = useGQLQuery(
    "Teachers",
    GET_ALL_TEACHERS_QUERY,
    {
      staleTime: 10000,
    }
  );

  const teacherList = useMemo(() => {
    if (!teachersData) return [];
    return teachersData.users.sort((a, b) => a.name.localeCompare(b.name));
  }, [teachersData]);

  const { data: studentsData, isLoading: studentsLoading } = useGQLQuery(
    "Students",
    GET_ALL_STUDENTS_QUERY,
    {
      staleTime: 10000,
    }
  );

  const studentList = useMemo(() => {
    if (!studentsData) return [];
    return studentsData.users
      .filter((student) => !studentsWithAssignments.includes(student.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [studentsData, studentsWithAssignments]);

  const [updateChromebookAssignment, { loading: updateLoading }] = useMutation(
    UPDATE_CHROMEBOOK_STUDENT_ASSIGNMENT_MUTATION
  );

  return (
    <div>
      <h2 className="text-2xl font-bold">Chromebook Assignments</h2>
      <div className="flex flex-col">
        {teacherList.map((teacher) => {
          const teacherAssignments = assignments.filter(
            (assignment) => assignment.teacher.id === teacher.id
          );

          return (
            <div
              key={teacher.id}
              className="border-2 border-solid border-slate-400"
            >
              <h3 className="text-3xl font-bold">{teacher.name}</h3>
              <div className="flex flex-col">
                {teacherAssignments
                  .sort((a, b) => a.number - b.number)
                  .map((assignment) => {
                    return (
                      <EditStudentRow
                        key={assignment.id}
                        assignment={assignment}
                        studentList={studentList}
                        updateChromebookAssignment={updateChromebookAssignment}
                      />
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
