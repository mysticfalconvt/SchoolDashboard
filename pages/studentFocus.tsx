import gql from 'graphql-tag';
import type { GetStaticProps, NextPage } from 'next';
import { useMemo } from 'react';
import NewStudentFocusButton from '../components/studentFocus/NewStudentFocusButton';
import Table from '../components/Table';
import { useUser } from '../components/User';
import { backendEndpoint } from '../config';
import getDisplayName from '../lib/displayName';
import { GraphQLClient } from '../lib/graphqlClient';
import { useGQLQuery } from '../lib/useGqlQuery';

const ALL_STUDENT_FOCUS_QUERY = gql`
  query ALL_STUDENT_FOCUS_QUERY {
    studentFoci(orderBy: { dateCreated: desc }) {
      id
      comments
      category
      dateCreated
      student {
        name
        preferredName
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

interface StudentFocus {
  id: string;
  comments: string;
  category: string;
  dateCreated: string;
  student: {
    name: string;
    preferredName: string;
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
  };
  teacher: {
    name: string;
    id: string;
  };
}

interface StudentFocusPageProps {
  initialStudentFoci?: {
    studentFoci: StudentFocus[];
  };
}

const StudentFocus: NextPage<StudentFocusPageProps> = (props) => {
  // console.log(props.initialData);
  const me = useUser();
  const cachedStudentFoci = props?.initialStudentFoci;
  // console.log('cachedStudentFoci', cachedStudentFoci);
  const { data, isLoading, error } = useGQLQuery(
    'allStudentFocus',
    ALL_STUDENT_FOCUS_QUERY,
    {},
    {
      initialData: cachedStudentFoci,
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
            Cell: ({ cell: { value } }: any) => {
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

  const studentFocusMemo = useMemo(() => {
    if (data?.studentFoci) {
      const studentFocus = data.studentFoci.map(
        (studentFocus: StudentFocus) => {
          const studentName = getDisplayName(studentFocus.student as any);
          const student = {
            ...studentFocus.student,
            name: studentName,
          };

          return {
            ...studentFocus,
            student,
          };
        },
      );
      return studentFocus;
    }
    return [];
  }, [data]);

  return (
    <div>
      <h1>Student Focus</h1>
      {!!me && <NewStudentFocusButton refetch={() => {}} />}

      <Table
        data={studentFocusMemo || []}
        columns={columns}
        searchColumn="student.name"
      />
    </div>
  );
};

export const getStaticProps: GetStaticProps<StudentFocusPageProps> = async (
  context,
) => {
  // console.log(context);
  // fetch PBIS Page data from the server
  const graphQLClient = new GraphQLClient(
    backendEndpoint,
    {
      headers: {
        authorization: `test auth for keystone`,
      },
    },
  );
  const fetchStudentFoci = async (): Promise<{ studentFoci: StudentFocus[] }> =>
    graphQLClient.request(ALL_STUDENT_FOCUS_QUERY);

  const initialStudentFoci = await fetchStudentFoci();

  return {
    props: {
      initialStudentFoci,
    }, // will be passed to the page component as props
    revalidate: 30 * 60, // 30 minutes (in seconds)
  };
};

export default StudentFocus;
