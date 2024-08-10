import { useMutation } from "@apollo/client";
import gql from "graphql-tag";
import { useMemo, useState } from "react";
import DisplayError from "../ErrorMessage";
import GradientButton from "../styles/Button";
import { useUser } from "../User";
import { useGQLQuery } from "../../lib/useGqlQuery";
import useSendEmail from "../../lib/useSendEmail";
import { useQueryClient } from "react-query";

export const CREATE_CHROMEBOOK_CHECK_MUTATION = gql`
  mutation CREATE_CHROMEBOOK_CHECK_MUTATION(
    $chromebookCheck: ChromebookCheckCreateInput!
  ) {
    createChromebookCheck(data: $chromebookCheck) {
      id
      message
      student {
        id
        name
      }
    }
  }
`;

export const CREATE_QUICK_PBIS = gql`
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

export const GET_TA_CHROMEBOOK_ASSIGNMENTS_QUERY = gql`
  query GET_TA_CHROMEBOOK_ASSIGNMENTS_QUERY($id: ID) {
    user(where: { id: $id }) {
      id
      name
      taStudents {
        id
        name
      }
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
export const goodCheckMessages = ChromeBookCheckMessageOptions.slice(1, 3);
export const chromebookEmails = [
  "robert.boskind@ncsuvt.org",
  "Joyce.Lantagne@ncsuvt.org",
  "katlynn.cochran@ncsuvt.org",
];

function SingleChromebookCheckForm({ student }) {
  const me = useUser();
  const [customMessage, setCustomMessage] = useState("");
  const [message, setMessage] = useState("");
  const [isDisabled, setIsDisabled] = useState(false);
  const queryClient = useQueryClient();
  const [createChromebookCheck, { loading, error }] = useMutation(
    CREATE_CHROMEBOOK_CHECK_MUTATION
  );
  const [createCard] = useMutation(CREATE_QUICK_PBIS, {
    variables: { teacher: me?.id, student: student?.id },
  });
  const { sendEmail, emailLoading } = useSendEmail();
  return (
    <form
      key={`chromebook-form${student?.id}`}
      onSubmit={async (e) => {
        e.preventDefault();
        setIsDisabled(true);
        const res = await createChromebookCheck({
          variables: {
            chromebookCheck: {
              student: { connect: { id: student.id } },
              message:
                message === "Other"
                  ? customMessage
                  : `${message} - ${customMessage}`,
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
        queryClient.refetchQueries();
        if (
          res.data?.createChromebookCheck?.id &&
          me?.id &&
          !goodCheckMessages.includes(message)
        ) {
          chromebookEmails.forEach(async (email) => {
            const emailToSend = {
              toAddress: email,
              fromAddress: me.email,
              subject: `New Chromebook Check for ${res.data.createChromebookCheck?.student?.name}`,
              body: `
          <p>There is a new Chromebook check for ${res.data.createChromebookCheck?.student?.name} at NCUJHS.TECH created by ${me.name}. </p>
          <p>${res.data.createChromebookCheck.message}</p>
           `,
            };
            // console.log(emailToSend);
            const emailRes = await sendEmail({
              variables: {
                emailData: emailToSend,
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
        <h2>{student?.name}</h2>
        <label
          htmlFor="status"
          className="flex"
          key={`status-chromebook-${student.id}`}
        >
          Status:{" "}
          <select
            name="status"
            id="status"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
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

        <label htmlFor="message" key={`message-chromebook-${student.id}`}>
          Message
          <input
            className="bg-gray-50 border border-gray-500 text-stone-900 disabled:bg-gray-50 disabled:border-none "
            type="text"
            name="message"
            id="message"
            value={customMessage}
            // disabled={message !== "Other"}
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

export default function ChromebookCheck() {
  const me = useUser();
  const [showForm, setShowForm] = useState(false);
  const { data: taTeacher } = useGQLQuery(
    `TAChromebookAssignments-${me?.id}`,
    GET_TA_CHROMEBOOK_ASSIGNMENTS_QUERY,
    { id: me?.id },
    { enabled: !!me?.id }
  );

  const students = taTeacher?.user?.taStudents || [];
  return (
    <div>
      {students?.length > 0 ? (
        <GradientButton
          style={{ marginTop: "10px" }}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Hide Chromebook Checks" : "TA Chromebook Checks"}
        </GradientButton>
      ) : null}
      <div>
        {showForm &&
          students.map((student) => (
            <div key={`chromebook-check-${student.id}`}>
              <SingleChromebookCheckForm student={student} />
            </div>
          ))}
      </div>
    </div>
  );
}
