import gql from 'graphql-tag';
import { GetStaticProps, NextPage } from 'next';
import Link from 'next/link';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import AssignmentHistory from '../components/Assignments/AssignmentHistory';
import useAssignmentHistoryBlocks from '../components/Assignments/useAssignmentHistoryBlocks';
import Table from '../components/Table';
import { NUMBER_OF_BLOCKS } from '../config';
import { smartGraphqlClient } from '../lib/smartGraphqlClient';
import { useGQLQuery } from '../lib/useGqlQuery';

const ALL_TEACHERS_QUERY = gql`
  query BULLYING_DATA_QUERY {
    users(where: { hasClasses: { equals: true } }, orderBy: { name: asc }) {
      id
      name
      block1ClassName
      block1Assignment
      block1AssignmentLastUpdated
      block2ClassName
      block2Assignment
      block2AssignmentLastUpdated
      block3ClassName
      block3Assignment
      block3AssignmentLastUpdated
      block4ClassName
      block4Assignment
      block4AssignmentLastUpdated
      block5ClassName
      block5Assignment
      block5AssignmentLastUpdated
      block6ClassName
      block6Assignment
      block6AssignmentLastUpdated
      block7ClassName
      block7Assignment
      block7AssignmentLastUpdated
      block8ClassName
      block8Assignment
      block8AssignmentLastUpdated
      block9ClassName
      block9Assignment
      block9AssignmentLastUpdated
      block10ClassName
      block10Assignment
      block10AssignmentLastUpdated
    }
  }
`;

interface TeacherData {
  id: string;
  name: string;
  block1ClassName?: string;
  block1Assignment?: string;
  block1AssignmentLastUpdated?: string;
  block2ClassName?: string;
  block2Assignment?: string;
  block2AssignmentLastUpdated?: string;
  block3ClassName?: string;
  block3Assignment?: string;
  block3AssignmentLastUpdated?: string;
  block4ClassName?: string;
  block4Assignment?: string;
  block4AssignmentLastUpdated?: string;
  block5ClassName?: string;
  block5Assignment?: string;
  block5AssignmentLastUpdated?: string;
  block6ClassName?: string;
  block6Assignment?: string;
  block6AssignmentLastUpdated?: string;
  block7ClassName?: string;
  block7Assignment?: string;
  block7AssignmentLastUpdated?: string;
  block8ClassName?: string;
  block8Assignment?: string;
  block8AssignmentLastUpdated?: string;
  block9ClassName?: string;
  block9Assignment?: string;
  block9AssignmentLastUpdated?: string;
  block10ClassName?: string;
  block10Assignment?: string;
  block10AssignmentLastUpdated?: string;
}

interface DisplayClassworkProps {
  data: TeacherData;
  block: string;
  onShowHistory: (teacherId: string, block: number) => void;
  hasHistory: (teacherId: string, block: number) => boolean;
}

const DisplayClasswork: React.FC<DisplayClassworkProps> = ({
  data,
  block,
  onShowHistory,
  hasHistory,
}) => {
  if (!data) return null;

  const classname = data[
    `block${block}ClassName` as keyof TeacherData
  ] as string;
  const assignment = data[
    `block${block}Assignment` as keyof TeacherData
  ] as string;
  const lastUpdated = data[
    `block${block}AssignmentLastUpdated` as keyof TeacherData
  ] as string;

  // Simple check if data exists without date calculations
  const hasData = classname && assignment && lastUpdated;

  // Format date deterministically to avoid hydration issues
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="max-w-full">
      {hasData ? (
        <>
          <h3 className="m-0 p-0 text-xl font-semibold">
            <strong>{classname}</strong>
          </h3>
          <p className="m-0 p-0 text-lg">
            <strong>{assignment}</strong>
          </p>
          <p className="m-0 p-0 text-lg">
            <strong>Last Updated: {formatDate(lastUpdated)}</strong>
          </p>
        </>
      ) : (
        <h3 className="m-0 p-0 text-xl font-semibold">No Data</h3>
      )}
      {data.id && hasHistory(data.id, Number(block)) && (
        <button
          type="button"
          onClick={() => onShowHistory(data.id, Number(block))}
          className="mt-2 text-white bg-[var(--blueTrans)] hover:bg-[var(--blue)] border-none rounded-full px-4 py-1 text-sm"
        >
          History
        </button>
      )}
    </div>
  );
};

interface AllTeacherCurrentWorkProps {
  initialWorkData?: {
    users: TeacherData[];
  };
}

const AllTeacherCurrentWork: NextPage<AllTeacherCurrentWorkProps> = (props) => {
  // Temporarily remove useUser to test hydration
  // const me = useUser();

  const { data } = useGQLQuery(
    'allTeachers',
    ALL_TEACHERS_QUERY,
    {},
    {
      staleTime: 1000 * 60 * 3,
      initialData: props?.initialWorkData,
    },
  );

  const [showHistory, setShowHistory] = useState(false);
  const [historyBlock, setHistoryBlock] = useState<number>();
  const [historyTeacherId, setHistoryTeacherId] = useState<string>();

  const teacherIds = (data?.users || []).map((u) => u.id);
  const hasHistory = useAssignmentHistoryBlocks(teacherIds);
  // Keep the checker in a ref so the memoized columns don't rebuild on every
  // render while still calling the latest version.
  const hasHistoryRef = useRef(hasHistory);
  hasHistoryRef.current = hasHistory;

  const handleShowHistory = useCallback((teacherId: string, block: number) => {
    setHistoryTeacherId(teacherId);
    setHistoryBlock(block);
    setShowHistory(true);
  }, []);
  const checkHasHistory = useCallback(
    (teacherId: string, block: number) =>
      hasHistoryRef.current(teacherId, block),
    [],
  );

  const columns = useMemo(() => {
    const blockColumns = [...Array(NUMBER_OF_BLOCKS)].map((e, i) => {
      const num = i + 1;
      return {
        Header: `Block ${num}`,
        accessor: `block${num}Assignment`,
        Cell: ({ row }: any) => (
          <DisplayClasswork
            data={row.original}
            block={String(num)}
            onShowHistory={handleShowHistory}
            hasHistory={checkHasHistory}
          />
        ),
      };
    });

    return [
      {
        Header: 'Teacher',
        columns: [
          {
            Header: 'Name',
            accessor: 'name',
            Cell: ({ cell }: any) => (
              <Link href={`/userProfile/${cell?.row?.original?.id || ''}`}>
                {cell.value}
              </Link>
            ),
          },
          ...blockColumns,
        ],
      },
    ];
  }, [handleShowHistory, checkHasHistory]);

  return (
    <div className="flex flex-col flex-wrap justify-around w-full">
      <h1 className="text-center text-2xl font-bold mb-6">
        All Teacher Current Work
      </h1>
      {showHistory && historyBlock && historyTeacherId && (
        <AssignmentHistory
          teacherId={historyTeacherId}
          block={historyBlock}
          hide={setShowHistory}
        />
      )}
      <Table data={data?.users || []} columns={columns} searchColumn="name" />
    </div>
  );
};

export const getStaticProps: GetStaticProps<
  AllTeacherCurrentWorkProps
> = async (context) => {
  // console.log(context);
  // fetch PBIS Page data from the server
  const fetchTeacherWork = async (): Promise<{ users: TeacherData[] }> =>
    smartGraphqlClient.request(ALL_TEACHERS_QUERY);

  const initialWorkData = await fetchTeacherWork();
  // console.log(initialWorkData.users);
  return {
    props: {
      initialWorkData,
    }, // will be passed to the page component as props
    revalidate: 1200, // In seconds
  };
};

export default AllTeacherCurrentWork;
