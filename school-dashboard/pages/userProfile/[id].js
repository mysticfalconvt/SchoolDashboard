import gql from "graphql-tag";
import { useGQLQuery } from "../../lib/useGqlQuery";
import Loading from "../../components/Loading";
import { useUser } from "../../components/User";
import isAllowed from "../../lib/isAllowed";
import ViewTeacherPage from "../../components/users/ViewTeacherPage";
import ViewStudentPage from "../../components/users/ViewStudentPage";
import ViewParentPage from "../../components/users/ViewParentPage";
import ResetPasswordToPassword from "../../components/users/ResetPasswordToPassword";
import SendParentEmailSignupButton from "../../components/users/SendParentEmailSignup";
import EditStudent from "../../components/users/EditStudent";
import { capitalizeFirstLetter } from "../../lib/nameUtils";
import getDisplayName from "../../lib/displayName";

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

export default function UserProfile({ query }) {
  // console.log('query', query);
  const me = useUser();
  const { data, isLoading, error } = useGQLQuery(
    `SingleUser-${query.id}`,
    GET_SINGLE_USER,
    { id: query.id }
  );
  if (isLoading || !me) return <Loading />;
  if (error) return <p>{error.message}</p>;
  if (!isAllowed(me, "isStaff")) return null;
  const user = data?.user || {};
  const { isStudent = false } = user;
  return (
    <div>
      <h1>{capitalizeFirstLetter(getDisplayName(user))}</h1>
      <div className="flex justify-around">
        {isAllowed(me, "isStaff") && me.id !== user.id && (
          <>
            {isStudent && <EditStudent student={user} />}
            {/* <SendParentEmailSignupButton student={user} /> */}
            {/* <ResetPasswordToPassword userID={query.id} /> */}
          </>
        )}
      </div>
      {isAllowed(user, "isStaff") && <ViewTeacherPage teacher={user} />}
      {isAllowed(user, "isStudent") && <ViewStudentPage student={user} />}
      {isAllowed(user, "isParent") && <ViewParentPage parent={user} />}
    </div>
  );
}
