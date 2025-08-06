import gql from 'graphql-tag';
import { useMemo } from 'react';
import Table from '../Table';

import { useGQLQuery } from '../../lib/useGqlQuery';
import DisplayError from '../ErrorMessage';

const ALL_STUDENT_FOCUS_QUERY = gql`
  query ALL_STUDENT_FOCUS_QUERY {
    allStudentFoci(sortBy: dateCreated_DESC) {
      id
      comments
      category
      dateCreated
      student {
        name
        id
        taTeacher {
          id
          name
        }
        parent {
          id
          name
          email
        }
      }
      teacher {
        name
        id
      }
    }
  }
`;

interface Student {
  name: string;
  id: string;
  taTeacher: {
    id: string;
    name: string;
  };
  parent: {
    id: string;
    name: string;
    email: string;
  };
}

interface Teacher {
  name: string;
  id: string;
}

interface StudentFocus {
  id: string;
  comments: string;
  category: string;
  dateCreated: string;
  student: Student;
  teacher: Teacher;
}

interface StudentFocusTableProps {
  initialData?: StudentFocus[];
}

export default function StudentFocusTable({
  initialData,
}: StudentFocusTableProps) {
  const initialStudentFoci = initialData || [];
  // console.log(initialStudentFoci);
  const { data, isLoading, error } = useGQLQuery(
    'allStudentFocus',
    ALL_STUDENT_FOCUS_QUERY,
    {
      initialData: initialStudentFoci,
      staleTime: 1000 * 60 * 3,
    },
  );

  const columns = useMemo(
    () => [
      {
        Header: 'Student Focus',
        columns: [
          {
            Header: 'Name',
            accessor: 'student.name',
          },
          {
            Header: 'Teacher',
            accessor: 'teacher.name',
          },
          {
            Header: 'TA Teacher',
            accessor: 'student.taTeacher.name',
          },
          {
            Header: 'Comments',
            accessor: 'comments',
          },
          {
            Header: 'Catergory',
            accessor: 'category',
          },
          {
            Header: 'Date',
            accessor: 'dateCreated',
            Cell: ({ cell: { value } }: { cell: { value: string } }) => {
              const today = new Date().toLocaleDateString();
              const displayDate = new Date(value).toLocaleDateString();
              const isToday = today === displayDate;
              return isToday ? `📆 Today 📆` : displayDate;
            },
          },
        ],
      },
    ],
    [],
  );

  // if (isLoading) return <Loading />;
  if (error) return <DisplayError error={error} />;
  return (
    <div>
      <Table
        data={data?.allStudentFoci || []}
        columns={columns}
        searchColumn="student.name"
      />
    </div>
  );
}
