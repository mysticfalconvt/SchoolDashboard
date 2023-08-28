import { useMutation } from "@apollo/client";
import gql from "graphql-tag";
import { useMemo, useState } from "react";
import DisplayError from "../ErrorMessage";
import GradientButton from "../styles/Button";
import { useUser } from "../User";
import { useGQLQuery } from "../../lib/useGqlQuery";
import useSendEmail from "../../lib/useSendEmail";

const CREATE_CHROMEBOOK_CHECK_MUTATION = gql`
  mutation CREATE_CHROMEBOOK_CHECK_MUTATION(
    $chromebookCheck: ChromebookCheckCreateInput!
  ) {
    createChromebookCheck(data: $chromebookCheck) {
      id
      message
      assignment {
        student {
          name
        }
      }
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

const GET_TA_CHROMEBOOK_ASSIGNMENTS_QUERY = gql`
  query GET_TA_CHROMEBOOK_ASSIGNMENTS_QUERY($id: ID) {
    chromebookAssignments(where: { teacher: { id: { equals: $id } } }) {
      id
      student {
        id
        name
      }
      number
    }
  }
`;

export const ChromeBookCheckMessageOptions = [
  "",
  "As Issued",
  "Same as previous week",
  "Missing Keys",
  "Broken Frame (Bezel)",
  "Broken Screen",
  "Broken Camera",
  "Other",
];
const goodCheckMessages = ChromeBookCheckMessageOptions.slice(1, 3);
const chromebookEmails = [
  "robert.boskind@ncsuvt.org",
  "Joyce.Lantagne@ncsuvt.org",
];

function SingleChromebookCheckForm({ assignment, refetch }) {
  const me = useUser();
  const [customMessage, setCustomMessage] = useState("");
  const [message, setMessage] = useState("");
  const [isDisabled, setIsDisabled] = useState(false);

  const [createChromebookCheck, { loading, error }] = useMutation(
    CREATE_CHROMEBOOK_CHECK_MUTATION
  );
  const student = assignment?.student;
  const [createCard] = useMutation(CREATE_QUICK_PBIS, {
    variables: { teacher: me?.id, student: student?.id },
  });
  const { sendEmail, emailLoading } = useSendEmail();
  return (
    <form
      key={`chromebook-form${assignment?.id}`}
      onSubmit={async (e) => {
        e.preventDefault();
        setIsDisabled(true);
        const res = await createChromebookCheck({
          variables: {
            chromebookCheck: {
              assignment: { connect: { id: assignment.id } },
              message: message === "Other" ? customMessage : message,
            },
          },
        });
        if (error) {
          console.log(error);
          setIsDisabled(false);
        }
        if (
          res.data.createChromebookCheck.id &&
          goodCheckMessages.includes(message) &&
          student?.id
        ) {
          await createCard();
          await createCard();
          await createCard();
        }

        if (
          res.data?.createChromebookCheck?.id &&
          me?.id &&
          !goodCheckMessages.includes(message)
        ) {
          chromebookEmails.forEach(async (email) => {
            const emailToSend = {
              toAddress: email,
              fromAddress: me.email,
              subject: `New Chromebook Check for ${res.data.createChromebookCheck.assignment?.student?.name}`,
              body: `
          <p>There is a new Chromebook check for ${res.data.createChromebookCheck.assignment?.student?.name} at NCUJHS.TECH created by ${me.name}. </p>
          <p>${res.data.createChromebookCheck.message}</p>
           `,
            };
            // console.log(emailToSend);
            const emailRes = await sendEmail({
              variables: {
                emailData: JSON.stringify(emailToSend),
              },
            });
          });
        }
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
        <h2>
          {assignment?.number}{" "}
          {assignment.student ? `- ${assignment.student.name}` : null}
        </h2>
        <label htmlFor="status" key={`status-chromebook-${assignment.id}`}>
          Status:{" "}
          <select
            name="status"
            id="status"
            onChange={(e) => {
              setMessage(e.target.value);
              if (e.target.value === "As Issued") {
                setCustomMessage("");
              }
            }}
          >
            {ChromeBookCheckMessageOptions.map((option) => (
              <option key={`option-${option}`} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label htmlFor="message" key={`message-chromebook-${assignment.id}`}>
          Message
          <input
            type="text"
            name="message"
            id="message"
            value={customMessage}
            disabled={message !== "Other"}
            onChange={(e) => setCustomMessage(e.target.value)}
          />
        </label>

        <GradientButton
          type="submit"
          disabled={
            loading ||
            isDisabled ||
            !message ||
            (message === "Other" && !customMessage)
          }
        >
          Submit
        </GradientButton>
      </fieldset>
    </form>
  );
}

export default function ChromebookCheck({ taId }) {
  const me = useUser();
  const [showForm, setShowForm] = useState(false);

  const { data: taAssignments } = useGQLQuery(
    `TAChromebookAssignments-${taId}`,
    GET_TA_CHROMEBOOK_ASSIGNMENTS_QUERY,
    { id: taId }
  );
  const assignments = taAssignments?.chromebookAssignments || [];
  return (
    <div>
      {assignments?.length > 0 ? (
        <GradientButton
          style={{ marginTop: "10px" }}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Hide Chromebook Checks" : "TA Chromebook Checks"}
        </GradientButton>
      ) : null}
      <div>
        {showForm &&
          assignments
            ?.sort((a, b) => a.number - b.number)
            .map((assignment) => (
              <div key={`chromebook-check-${assignment.id}`}>
                <SingleChromebookCheckForm assignment={assignment} />
              </div>
            ))}
      </div>
    </div>
  );
}
