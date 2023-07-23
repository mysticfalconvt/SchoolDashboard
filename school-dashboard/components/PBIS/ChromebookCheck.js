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

const CREATE_QUICK_PBIS = gql`
  mutation CREATE_QUICK_PBIS($teacher: ID!, $student: ID!) {
    createPbisCard(
      data: {
        teacher: { connect: { id: $teacher } }
        student: { connect: { id: $student } }
        category: "Chromebook Check"
      }
    ) {
      id
      student {
        name
      }
      teacher {
        name
      }
    }
  }
`;

export const GET_TA_CHROMEBOOK_CHECKS_QUERY = gql`
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
  const [createCard] = useMutation(CREATE_QUICK_PBIS, {
    variables: { teacher: me.id, student: student.id },
  });
  return (
    <form
      key={student.id}
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
        if (res.data.createChromebookCheck.id && passed) {
          await createCard();
          await createCard();
          await createCard();
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
        <label htmlFor={`passed${student.id}`} key={student.id}>
          <input
            type="checkbox"
            name={`passed${student.id}`}
            id={`passed${student.id}`}
            checked={passed}
            onChange={(e) => setPassed(e.target.checked)}
          />
          Passed
        </label>

        <label htmlFor="message" key={student.id}>
          Message
          <input
            type="text"
            name="message"
            id="message"
            disabled={passed}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </label>

        <GradientButton type="submit" disabled={loading || isDisabled}>
          Submit
        </GradientButton>
      </fieldset>
    </form>
  );
}

export default function ChromebookCheck({ taId }) {
  const me = useUser();
  const [showForm, setShowForm] = useState(false);
  const {
    data: existingChecks,
    isLoading,
    refetch,
  } = useGQLQuery(
    `TAChromebookChecks-${taId}`,
    GET_TA_CHROMEBOOK_CHECKS_QUERY,
    { id: taId },
    {}
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
      {studentsAbleToCheck.length > 0 ? (
        <GradientButton
          style={{ marginTop: "10px" }}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Hide Chromebook Checks" : "TA Chromebook Checks"}
        </GradientButton>
      ) : null}
      <div>
        {showForm &&
          studentsAbleToCheck.map((student) => (
            <div key={student.id}>
              <SingleChromebookCheckForm student={student} refetch={refetch} />
            </div>
          ))}
      </div>
    </div>
  );
}
