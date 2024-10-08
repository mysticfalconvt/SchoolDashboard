import React, { useState } from "react";
import GradientButton, { SmallGradientButton } from "../styles/Button";
import {
  CREATE_CHROMEBOOK_CHECK_MUTATION,
  CREATE_QUICK_PBIS,
  ChromeBookCheckMessageOptions,
  chromebookEmails,
  goodCheckMessages,
} from "./ChromebookCheck";
import gql from "graphql-tag";
import { useGQLQuery } from "../../lib/useGqlQuery";
import { useMutation } from "@apollo/client";
import { useUser } from "../User";
import useSendEmail from "../../lib/useSendEmail";
import SearchForUserName from "../SearchForUserName";

export default function CreateSingleChromebookCheck() {
  const me = useUser();
  const [createChromebookCheck] = useMutation(CREATE_CHROMEBOOK_CHECK_MUTATION);
  const [message, setMessage] = useState("");
  const [studentFor, setStudentCheckIsFor] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [status, setStatus] = useState("idle");
  const { sendEmail, emailLoading } = useSendEmail();

  const [createCard] = useMutation(CREATE_QUICK_PBIS, {
    variables: {
      teacher: me?.id,
      student: studentFor.userId,
    },
  });
  return (
    <>
      <GradientButton onClick={() => setShowForm(!showForm)}>
        {showForm ? "Cancel CB Check" : "Chromebook Check"}
      </GradientButton>
      {showForm && (
        <div className="absolute top-1/3  w-3/4 p-4 flex text-white flex-col rounded-xl gap-2 items-center bg-slate-600 z-50 ">
          <SmallGradientButton
            className="self-end m-2"
            onClick={() => setShowForm(!showForm)}
          >
            Cancel
          </SmallGradientButton>
          <h2 className="text-center text-2xl">Create Chromebook Check</h2>
          <div className="flex flex-col gap-2 w-3/4 items-stretch m-auto">
            <label htmlFor="assignmentId">Chromebook</label>
            <SearchForUserName
              name="studentName"
              value={studentFor}
              updateUser={setStudentCheckIsFor}
              userType="isStudent"
            />
            <label htmlFor="status" key={`status-chromebook-single`}>
              Status:{" "}
              <select
                name="status"
                id="status"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                onChange={(e) => {
                  setStatus(e.target.value);
                  // if (e.target.value !== "Other") {
                  //   setMessage("");
                  // }
                }}
              >
                {ChromeBookCheckMessageOptions.map((option) => (
                  <option key={`option-${option}`} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor="message">Message</label>
            <input
              id="message"
              name="message"
              // disabled={status !== "Other"}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="border-2 border-gray-400 rounded-md text-gray-800"
            />
          </div>
          <GradientButton
            disabled={
              !studentFor?.userId || !status || (status === "Other" && !message)
            }
            onClick={async () => {
              // message gets status if status is not other.  Otherwise, message is message
              // if the teacher is the teacher of the assignment, then the message is just the message
              // if the teacher is not the teacher of the assignment, then the message is the message + teacher name

              let messageToSend = message;
              if (status !== "Other") {
                messageToSend = `${status} - ${message} - ${me.name}`;
              }

              const res = await createChromebookCheck({
                variables: {
                  chromebookCheck: {
                    student: { connect: { id: studentFor.userId } },
                    message: messageToSend,
                  },
                },
              });

              // check if messageToSend starts with something in goodCheckMessages
              const isGoodCheck = goodCheckMessages.some((goodMessage) =>
                messageToSend.startsWith(goodMessage)
              );
              if (
                res.data.createChromebookCheck.id &&
                goodCheckMessages.includes(messageToSend) &&
                isGoodCheck
              ) {
                await createCard();
                await createCard();
                await createCard();
              }

              if (
                res.data?.createChromebookCheck?.id &&
                me?.id &&
                !isGoodCheck
              ) {
                chromebookEmails.forEach(async (email) => {
                  const emailToSend = {
                    toAddress: email,
                    fromAddress: me?.email,
                    subject: `New Chromebook Check for ${res.data.createChromebookCheck?.student?.name}`,
                    body: `
                <p>There is a new Chromebook check for ${res.data.createChromebookCheck.student?.name} at NCUJHS.TECH created by ${me.name}. </p>
                <p>${res.data.createChromebookCheck.message}</p>
                 `,
                  };
                  const emailRes = await sendEmail({
                    variables: {
                      emailData: emailToSend,
                    },
                  });
                });
              }
              if (res?.data?.createChromebookCheck) {
                setMessage("");
                setShowForm(false);
              }
            }}
          >
            Create Chromebook Check
          </GradientButton>
        </div>
      )}
    </>
  );
}
