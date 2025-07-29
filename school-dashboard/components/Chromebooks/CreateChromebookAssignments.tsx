import GradientButton from '@/components/styles/Button';
import { useGqlMutation } from '@/lib/useGqlMutation';
import { useGQLQuery } from '@/lib/useGqlQuery';
import gql from 'graphql-tag';
import { useState } from 'react';

const GET_TA_TEACHER_LIST_QUERY = gql`
  query GET_TA_TEACHER_LIST_QUERY {
    users(where: { hasTA: { equals: true } }) {
      id
      name
    }
  }
`;

const GET_CHROMEBOOK_ASSIGNMENTS_QUERY = gql`
  query GET_CHROMEBOOK_ASSIGNMENTS_QUERY {
    chromebookAssignments {
      id
      student {
        id
        name
      }
      teacher {
        id
        name
      }
      number
    }
  }
`;

const CREATE_CHROMEBOOK_ASSIGNMENT_MUTATION = gql`
  mutation CREATE_CHROMEBOOK_ASSIGNMENT_MUTATION(
    $teacher: ID!
    $number: String!
  ) {
    createChromebookAssignment(
      data: { teacher: { connect: { id: $teacher } }, number: $number }
    ) {
      id
    }
  }
`;

interface Teacher {
  id: string;
  name: string;
}

interface Assignment {
  id: string;
  student?: {
    id: string;
    name: string;
  };
  teacher: Teacher;
  number: string;
}

export default function CreateChromebookAssignments() {
  const [loading, setLoading] = useState(false);
  const { data: teachers } = useGQLQuery(
    'TA Teachers',
    GET_TA_TEACHER_LIST_QUERY,
  );
  const teacherIds = teachers?.users?.map((teacher: Teacher) => teacher.id);
  const { data: chromebookAssignments } = useGQLQuery(
    'Chromebook Assignments',
    GET_CHROMEBOOK_ASSIGNMENTS_QUERY,
  );
  const chromebookTeachers = chromebookAssignments?.chromebookAssignments?.map(
    (assignment: Assignment) => assignment.teacher.id,
  );
  const teachersWithoutAssignments = teacherIds?.filter(
    (teacher) => !chromebookTeachers?.includes(teacher),
  );
  const [createChromebookAssignment] = useGqlMutation(
    CREATE_CHROMEBOOK_ASSIGNMENT_MUTATION,
    {},
  );

  const handleCreateChromebookAssignment = async () => {
    setLoading(true);
    // create 15 chromebook assignments for each teacher, with number being 1-15 as a string
    for (let i = 0; i < teachersWithoutAssignments.length; i++) {
      for (let j = 1; j < 16; j++) {
        await createChromebookAssignment({
          variables: {
            teacher: teachersWithoutAssignments[i],
            number: j.toString(),
          },
        });
      }
    }
    setLoading(false);
  };

  return (
    <GradientButton
      onClick={() => handleCreateChromebookAssignment()}
      disabled={loading || teachersWithoutAssignments?.length === 0}
    >
      Create 15 chromebook assignments for each TA teacher
    </GradientButton>
  );
}
