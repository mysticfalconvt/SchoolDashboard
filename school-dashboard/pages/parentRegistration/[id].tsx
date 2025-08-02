import DisplayError from '@/components/../components/ErrorMessage';
import Form, { FormContainer } from '@/components/../components/styles/Form';
import useForm from '@/lib/useForm';
import { useGqlMutation } from '@/lib/useGqlMutation';
import gql from 'graphql-tag';
import { GetServerSideProps, NextPage } from 'next';

// const GET_STUDENT_FOR_PARENT = gql`
//   query GET_STUDENT_FOR_PARENT($id: ID!) {
//     User(where: { id: $id }) {
//       id
//       name
//     }
//   }
// `;

const SIGNUP_MUTATION = gql`
  mutation SIGNUP_MUTATION(
    $email: String!
    $name: String!
    $password: String!
    $children: UserRelateToManyInput!
    $isParent: Boolean!
  ) {
    createUser(
      data: {
        email: $email
        name: $name
        password: $password
        isParent: $isParent
        children: $children
      }
    ) {
      id
      name
      email
    }
  }
`;

interface ParentRegistrationInputs {
  name: string;
  email: string;
  password: string;
  children: { connect: { id: string } };
  isParent: boolean;
}

interface ParentRegistrationPageProps {
  query: {
    id: string;
    name?: string;
  };
}

const ParentRegistrationPage: NextPage<ParentRegistrationPageProps> = ({
  query,
}) => {
  const { inputs, handleChange, clearForm } = useForm({
    name: '',
    email: '',
    password: '',
    children: { connect: { id: query.id } },
    isParent: true,
  });
  // const { data, isLoading, error } = useGQLQuery(
  //   `StudentForParent-${query.id}`,
  //   GET_STUDENT_FOR_PARENT,
  //   { id: query.id }
  // );

  const [createNewUser, { loading, data: newUser, error }] = useGqlMutation(
    SIGNUP_MUTATION,
    {},
  );
  // console.log(query.id);
  // if (isLoading) return <Loading />;
  // if (error) return <p>{error.message}</p>;
  // const student = data.User;
  return (
    <div>
      <FormContainer visible={true}>
        <Form
          method="POST"
          onSubmit={async (e) => {
            e.preventDefault();
            // Submit the inputfields to the backend:
            // console.log(inputs);
            const res = await createNewUser({
              variables: {
                name: inputs.name,
                email: inputs.email,
                password: inputs.password,
                children: { connect: [{ id: query.id }] },
                isParent: true,
              },
            });

            // console.log(res);
            //   setResultOfUpdate(
            //     JSON.parse(res.updateStudentSchedules.name)
            //   );
            //   // clearForm();
            //   setShowForm(false);
          }}
        >
          <h1>Register for a parent account for {query.name}</h1>
          <DisplayError error={error as any} />
          <fieldset disabled={loading} aria-busy={loading}>
            {newUser?.createUser && (
              <p>
                Signed up with {newUser.createUser.email} - Please Go Sign in!
              </p>
            )}
            <label htmlFor="name">
              Name
              <input
                required
                // rows="25"
                type="text"
                id="name"
                name="name"
                placeholder="Name"
                value={inputs.name}
                onChange={handleChange}
              />
            </label>
            <label htmlFor="email">
              Email
              <input
                required
                // rows="25"
                type="email"
                id="email"
                name="email"
                placeholder="email"
                value={inputs.email}
                onChange={handleChange}
              />
            </label>
            <label htmlFor="password">
              Password
              <input
                type="password"
                name="password"
                placeholder="Password"
                autoComplete="password"
                value={inputs.password}
                onChange={handleChange}
              />
            </label>

            <button type="submit">Register</button>
          </fieldset>
        </Form>
      </FormContainer>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<
  ParentRegistrationPageProps
> = async (context) => {
  return {
    props: {
      query: {
        id: context.params?.id as string,
        name: context.query.name as string,
      },
    },
  };
};

export default ParentRegistrationPage;
