import { useMutation } from "@apollo/client";
import gql from "graphql-tag";
import { useMemo, useState } from "react";
import useForm from "../../lib/useForm";
import DisplayError from "../ErrorMessage";
import GradientButton from "../styles/Button";
import Form, { FormContainerStyles } from "../styles/Form";
import { useUser } from "../User";
import useRecalculatePBIS from "./useRecalculatePbis";
import { useGQLQuery } from "../../lib/useGqlQuery";

const CREATE_CHROMEBOOK_CHECK_MUTATION = gql`
  mutation CREATE_CARD_MUTATION($chromebookCheck: ChromebookCheckCreateInput!) {
    createChromebookCheck(data: $chromebookCheck) {
      id
    }
  }
`;

const GET_TA_CHROMEBOOK_CHECKS_QUERY = gql`
  query GET_TA_CHROMEBOOK_CHECKS($id: ID) {
    users(where: { taTeacher: { id: { equals: $id } } }) {
      id
      name

      chromebookCheck {
        id
        time
        message
        student {
          id
          name
        }
      }
    }
  }
`;

function SingleChromebookCheckForm({ student, refetch }) {
  const me = useUser();
  const [message, setMessage] = useState("");
  const [passed, setPassed] = useState(true);
  const [isDisabled, setIsDisabled] = useState(false);
  const [createChromebookCheck, { loading, error }] = useMutation(
    CREATE_CHROMEBOOK_CHECK_MUTATION
  );

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setIsDisabled(true);
        const res = await createChromebookCheck({
          variables: {
            chromebookCheck: {
              student: { connect: { id: student.id } },
              teacher: { connect: { id: me.id } },
              message: passed ? "Passed" : message,
            },
          },
        });
        if (error) {
          console.log(error);
          setIsDisabled(false);
        }
        refetch();
      }}
    >
      <DisplayError error={error} />
      <fieldset
        disabled={loading || isDisabled}
        aria-busy={loading}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h2>{student.name}</h2>
        <label htmlFor="passed">
          <input
            type="checkbox"
            name="passed"
            id="passed"
            checked={passed}
            onChange={(e) => setPassed(e.target.checked)}
          />
          Passed
        </label>
        {!passed ? (
          <>
            <label htmlFor="message">
              Message
              <input
                type="text"
                name="message"
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </label>
          </>
        ) : (
          <div />
        )}
        <GradientButton type="submit" disabled={loading || isDisabled}>
          Submit
        </GradientButton>
      </fieldset>
    </form>
  );
}

export default function ChromebookCheck() {
  const me = useUser();
  const [showForm, setShowForm] = useState(false);
  const {
    data: existingChecks,
    isLoading,
    refetch,
  } = useGQLQuery(
    `TAChromebookChecks-${me?.id}`,
    GET_TA_CHROMEBOOK_CHECKS_QUERY,
    { id: me?.id },
    {
      enabled: !!me?.id,
    }
  );

  const studentsAbleToCheck = useMemo(() => {
    return (
      existingChecks?.users
        ?.filter((user) => {
          const hasNoChecks = user.chromebookCheck.length === 0;
          const newestCheck = user.chromebookCheck.sort(
            (a, b) => b.time - a.time
          )[0];
          if (hasNoChecks) {
            return true;
          }
          // if newest check is more than 6 days old, return true
          if (newestCheck.time + 518400000 < Date.now()) {
          }
          return false;
        })
        .map((user) => {
          return {
            id: user.id,
            name: user.name,
            getsCards: false,
            message: "",
          };
        }) || []
    );
  }, [existingChecks]);

  return (
    <div>
      <GradientButton
        style={{ marginTop: "10px" }}
        onClick={() => setShowForm(!showForm)}
      >
        TA Chromebook Checks
      </GradientButton>
      <div>
        {showForm &&
          studentsAbleToCheck.map((student) => (
            <SingleChromebookCheckForm
              student={student}
              key={student.id}
              refetch={refetch}
            />
          ))}
      </div>
    </div>
  );
}
