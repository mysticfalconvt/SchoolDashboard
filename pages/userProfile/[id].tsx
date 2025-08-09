import gql from 'graphql-tag';
import { GetServerSideProps, NextPage } from 'next';
import { useMemo } from 'react';
import Loading from '../../components/Loading';
import { useUser } from '../../components/User';
import EditStudent from '../../components/users/EditStudent';
import ViewParentPage from '../../components/users/ViewParentPage';
import ViewStudentPage from '../../components/users/ViewStudentPage';
import ViewTeacherPage from '../../components/users/ViewTeacherPage';
import getDisplayName from '../../lib/displayName';
import isAllowed from '../../lib/isAllowed';
import { capitalizeFirstLetter } from '../../lib/nameUtils';
import { useGQLQuery } from '../../lib/useGqlQuery';

const GET_SINGLE_USER = gql`
  query GET_SINGLE_USER($id: ID!) {
    user(where: { id: $id }) {
      id
      name
      preferredName
      email
      taStudents {
        id
        name
      }
      children {
        id
        name
      }
      block1Teacher {
        name
        id
      }
      block2Teacher {
        name
        id
      }
      block3Teacher {
        name
        id
      }
      block4Teacher {
        name
        id
      }
      block5Teacher {
        name
        id
      }
      block6Teacher {
        name
        id
      }
      block7Teacher {
        name
        id
      }
      block8Teacher {
        name
        id
      }
      block9Teacher {
        name
        id
      }
      block10Teacher {
        name
        id
      }

      taTeacher {
        name
        id
      }

      isStaff
      isParent
      isStudent
    }
  }
`;

interface BlockTeacher {
  name: string;
  id: string;
}

interface TaStudent {
  id: string;
  name: string;
}

interface Child {
  id: string;
  name: string;
}

interface UserProfile {
  id: string;
  name: string;
  preferredName?: string;
  email?: string;
  taStudents?: TaStudent[];
  children?: Child[];
  block1Teacher?: BlockTeacher;
  block2Teacher?: BlockTeacher;
  block3Teacher?: BlockTeacher;
  block4Teacher?: BlockTeacher;
  block5Teacher?: BlockTeacher;
  block6Teacher?: BlockTeacher;
  block7Teacher?: BlockTeacher;
  block8Teacher?: BlockTeacher;
  block9Teacher?: BlockTeacher;
  block10Teacher?: BlockTeacher;
  taTeacher?: BlockTeacher;
  isStaff?: boolean;
  isParent?: boolean;
  isStudent?: boolean;
}

interface UserProfilePageProps {
  query: {
    id: string;
  };
}

const UserProfile: NextPage<UserProfilePageProps> = ({ query }) => {
  // console.log('query', query);
  const me = useUser();
  
  // Memoize variables to prevent infinite re-renders
  const variables = useMemo(() => ({ id: query.id }), [query.id]);
  
  const { data, isLoading, error } = useGQLQuery(
    `SingleUser-${query.id}`,
    GET_SINGLE_USER,
    variables,
  );
  if (isLoading || !me) return <Loading />;
  if (error) return <p>{error.message}</p>;
  if (!isAllowed(me, 'isStaff')) return null;
  const user = data?.user as UserProfile;
  if (!user) return <div>User not found</div>;
  const { isStudent = false } = user;
  return (
    <div>
      <h1>{capitalizeFirstLetter(getDisplayName(user as any))}</h1>
      <div className="flex justify-around">
        {isAllowed(me, 'isStaff') && me.id !== user.id && (
          <>
            {isStudent && <EditStudent student={user as any} />}
            {/* <SendParentEmailSignupButton student={user} /> */}
            {/* <ResetPasswordToPassword userID={query.id} /> */}
          </>
        )}
      </div>
      {isAllowed(user as any, 'isStaff') && (
        <ViewTeacherPage teacher={user as any} />
      )}
      {isAllowed(user as any, 'isStudent') && (
        <ViewStudentPage student={user as any} />
      )}
      {isAllowed(user as any, 'isParent') && (
        <ViewParentPage parent={user as any} />
      )}
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<
  UserProfilePageProps
> = async (context) => {
  return {
    props: {
      query: {
        id: context.params?.id as string,
      },
    },
  };
};

export default UserProfile;
