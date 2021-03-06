import { gql } from 'graphql-request';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import DisplayError from '../components/ErrorMessage';
import GradientButton from '../components/styles/Button';
import Table from '../components/Table';
import { useGQLQuery } from '../lib/useGqlQuery';
import Loading from '../components/Loading';
import NewUpdateUsers from '../components/users/NewUpdateUsers';
import isAllowed from '../lib/isAllowed';
import { useUser } from '../components/User';
import NewStaff from '../components/users/NewStaff';

const GET_ALL_USERS = gql`
  query GET_ALL_USERS {
    teachers: allUsers(where: { isStaff: true }) {
      id
      name

      callbackCount
      PbisCardCount
      YearPbisCount
      averageTimeToCompleteCallback
    }
    students: allUsers(where: { isStudent: true }) {
      id
      name

      taTeacher {
        name
        id
      }
      callbackCount
      PbisCardCount
      YearPbisCount
      averageTimeToCompleteCallback
    }
  }
`;

const ButtonStyles = styled.div`
  button {
    border: 2px solid white;
    position: absolute;
    transition: all 1s ease-in-out;
    :hover {
      border: 2px solid var(--red);
    }
  }
  .hide {
    opacity: 0;
    visibility: hidden;
  }
  .show {
    opacity: 1;
  }
  padding-bottom: 3.5rem;
`;

const ArrayValues = ({ values }) => (
  <>
    {values.map((arrayValue, idx) => (
      <span key={idx} className="badge">
        {arrayValue.name}
      </span>
    ))}
  </>
);

export default function Users() {
  const [userSortType, setUserSortType] = useState('student');
  const { data, isLoading, error, refetch } = useGQLQuery(
    'users',
    GET_ALL_USERS,
    {
      searchTerm: userSortType,
    }
  );
  const studentColumns = useMemo(
    () => [
      {
        Header: 'Students',
        columns: [
          {
            Header: 'Name',
            accessor: 'name',
            Cell: ({ row }) => (
              <Link href={`/userProfile/${row.original.id}`}>
                {row.original.name}
              </Link>
            ),
          },
          // {
          //   Header: 'Type',
          //   accessor: 'role',
          //   Cell: ({ cell: { value } }) => <ArrayValues values={value || []} />,
          // },
          {
            Header: 'TA Teacher',
            accessor: 'taTeacher.name',
            Cell: ({ row }) => {
              const showLink = !!row.original?.taTeacher?.id;
              //   console.log(showLink);
              if (showLink)
                return (
                  <Link href={`/userProfile/${row.original?.taTeacher?.id}`}>
                    {row.original?.taTeacher?.name}
                  </Link>
                );
              return null;
            },
          },

          {
            Header: 'Callback',
            accessor: 'callbackCount',
          },
          {
            Header: 'Weekly PBIS',
            accessor: 'PbisCardCount',
          },
          {
            Header: 'Yearly PBIS',
            accessor: 'YearPbisCount',
          },
          {
            Header: 'Average days on callback',
            accessor: 'averageTimeToCompleteCallback',
          },
        ],
      },
    ],
    []
  );

  const teacherColumns = useMemo(
    () => [
      {
        Header: 'Teachers',
        columns: [
          {
            Header: 'Name',
            accessor: 'name',
            Cell: ({ row }) => (
              <Link href={`/userProfile/${row.original.id}`}>
                {row.original.name}
              </Link>
            ),
          },

          {
            Header: 'Callback',
            accessor: 'callbackCount',
          },
          {
            Header: 'Weekly PBIS',
            accessor: 'PbisCardCount',
          },
          {
            Header: 'Yearly PBIS',
            accessor: 'YearPbisCount',
          },
        ],
      },
    ],
    []
  );

  useEffect(() => refetch(), [userSortType]);
  const me = useUser();
  if (isLoading) return <Loading />;
  if (error) return <DisplayError>{error.mesage}</DisplayError>;
  return (
    <div>
      <ButtonStyles>
        <GradientButton
          onClick={() => {
            setUserSortType('staff');
          }}
          className={userSortType === 'staff' ? 'hide' : 'show'}
        >
          Show Teachers
        </GradientButton>
        <GradientButton
          onClick={() => {
            setUserSortType('student');
          }}
          className={userSortType === 'student' ? 'hide' : 'show'}
        >
          Show Students
        </GradientButton>
      </ButtonStyles>
      {/* {isAllowed(me, 'isSuperAdmin') && <NewUpdateUsers />}
      {isAllowed(me, 'isSuperAdmin') && <NewStaff />} */}
      {userSortType === 'staff' && (
        <Table
          data={data?.teachers || []}
          columns={teacherColumns}
          searchColumn="name"
        />
      )}
      {userSortType === 'student' && (
        <Table
          data={data?.students || []}
          columns={studentColumns}
          searchColumn="name"
        />
      )}
    </div>
  );
}
