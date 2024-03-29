import { useMutation } from "@apollo/client";
import gql from "graphql-tag";
import React, { useState } from "react";
import styled from "styled-components";
import { toast } from "react-hot-toast";
import { QueryClient, useQueryClient } from "react-query";
import Form, { FormGroupStyles } from "../styles/Form";
import { SmallGradientButton } from "../styles/Button";

export const UPDATE_CALLBACK_MESSAGES_MUTATION = gql`
  mutation UPDATE_CALLBACK_MESSAGES_MUTATION(
    $id: ID!
    $messageFromTeacher: String
    $messageFromTeacherDate: String
    $messageFromStudent: String
    $messageFromStudentDate: String
  ) {
    updateCallback(
      where: { id: $id }
      data: {
        messageFromTeacher: $messageFromTeacher
        messageFromTeacherDate: $messageFromTeacherDate
        messageFromStudent: $messageFromStudent
        messageFromStudentDate: $messageFromStudentDate
      }
    ) {
      id
    }
  }
`;
const studentDeleteMessage = "Remove Message";
const studentMessageOptions = [
  "I am finished. Please check my work.",
  "I am stuck. I will come see you.",
];

const AnimatedInput = styled.p`
  position: relative;
  /* width: 100%; */
  /* height: 100%; */
  border: none;
  /* border-bottom: 1px solid #e1e1e1; */
  padding: 0;
  margin: 0;
  font-size: 14px;
  color: var(--textColor);
  text-align: center;
  transition: all 0.3s;
  input {
    width: 100%;
    height: 100%;
    border: none;
    padding: 0;
    margin: 0;
    font-size: 14px;
    color: #4d4d4d;
    text-align: center;
    transition: all 0.3s;
    border-radius: 5px;
  }
  .hasText {
    /* border-bottom: 1px solid #e1e1e1; */
    color: white;
    font-size: 1.6rem;
    /* max-width: 100px;  */
    padding: 0.5rem;
    /* overflow-wrap: break-word; */
    word-break: break-word;
    /* text-decoration: none; */
  }
  .inputUpdating {
    animation: color-change 0.5s infinite;
    @keyframes color-change {
      0% {
        color: var(--red);
      }
      50% {
        color: var(--blue);
        font-size: 16px;
      }
      100% {
        color: var(--red);
      }
    }
  }
`;

export default function CallbackCardMessages({ me, callback }) {
  const isTeacher = me?.id === callback.teacher.id;
  const isStudent = me?.id === callback?.student?.id;
  // console.log(callback)
  const [teacherMessage, setTeacherMessage] = useState(
    callback.messageFromTeacher || ""
  );
  const [teacherMessageDate, setTeacherMessageDate] = useState(
    callback.messageFromTeacherDate || ""
  );
  const studentMessage = callback.messageFromStudent;

  const [studentMessageDate, setStudentMessageDate] = useState(
    callback.messageFromStudentDate || ""
  );
  // console.log(studentMessageDate)
  const queryClient = useQueryClient();
  const [updateCallback, { loading, error, data }] = useMutation(
    UPDATE_CALLBACK_MESSAGES_MUTATION,
    {
      variables: {
        id: callback.id,
        messageFromTeacher: teacherMessage,
        messageFromTeacherDate: teacherMessageDate,
        messageFromStudent: studentMessage,
        messageFromStudentDate: studentMessageDate,
      },
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await updateCallback();
    if (res) {
      toast.success(`Updated Callback Message for ${callback.student.name}`);
    }
  };

  const submitOnEnter = (e) => {
    if (e.key === "Enter" && e.shiftKey === false) {
      handleSubmit(e);
    }
  };
  const handleSelectStudentMessage = async (e) => {
    const studentMessage =
      e.target.value === studentDeleteMessage ? "" : e.target.value;
    const todaysDate = new Date().toLocaleDateString();
    const res = await updateCallback({
      variables: {
        id: callback.id,
        messageFromTeacher: teacherMessage,
        messageFromStudent: studentMessage,
        messageFromStudentDate: todaysDate,
      },
    });
    await queryClient.refetchQueries("myStudentCallbacks");
    if (res) {
      toast.success(`Updated Callback Message for ${callback.student.name}`);
    }
  };
  const getStudentMessageOptionsArray = () => {
    const options = studentMessageOptions.map((option) => ({
      key: option,
      value: option,
    }));
    if (!studentMessage) {
      options.unshift({
        key: "default",
        value: "No Current Message to Teacher",
      });
    } else {
      options.unshift({
        key: "delete",
        value: studentDeleteMessage,
      });
    }
    if (studentMessage && !studentMessageOptions.includes(studentMessage)) {
      options.push({
        key: studentMessage,
        value: studentMessage,
        selected: true,
      });
    }
    return options;
  };
  const studentMessageOptionsArray = getStudentMessageOptionsArray();

  return (
    <Form
      //   className={showForm ? 'visible' : 'hidden'}
      // hidden={!showForm}
      onSubmit={handleSubmit}
    >
      <FormGroupStyles>
        <fieldset disabled={loading} aria-busy={loading}>
          {!isStudent && (
            <AnimatedInput>
              Student:
              <span className={callback?.messageFromStudent ? "hasText" : ""}>
                {callback.messageFromStudent || "----"}
              </span>
              <span>{callback.messageFromStudentDate || ""}</span>
            </AnimatedInput>
          )}
          {!isTeacher && (
            <AnimatedInput>
              Teacher:
              <span className={callback?.messageFromTeacher ? "hasText" : ""}>
                {callback.messageFromTeacher || "----"}
              </span>
              <span>{callback.messageFromTeacherDate || "----"}</span>
            </AnimatedInput>
          )}
          {isStudent && (
            <>
              <AnimatedInput>
                Student Message:
                {/* <textarea
                  id={`student - ${callback.id}`}
                  placeholder="Message from Student"
                  value={studentMessage}
                  className={loading ? "inputUpdating" : ""}
                  onKeyDown={submitOnEnter}
                  onChange={(e) => {
                    //   console.log(e.target.value);
                    setStudentMessage(e.target.value);
                    const todaysDate = new Date().toLocaleDateString();
                    setStudentMessageDate(todaysDate);
                  }}
                /> */}
                {/* a select box for student messages */}
                <select
                  id={`student - ${callback.id}`}
                  value={studentMessage}
                  selected={studentMessage}
                  className={loading ? "inputUpdating" : ""}
                  onChange={handleSelectStudentMessage}
                >
                  {studentMessageOptionsArray.map((option) => (
                    <option
                      key={option.key}
                      value={option.value}
                      selected={option.selected}
                    >
                      {option.value}
                    </option>
                  ))}
                </select>
                <span>{studentMessageDate || "-"}</span>
              </AnimatedInput>
            </>
          )}

          {isTeacher && (
            <>
              {studentMessage && (
                <SmallGradientButton
                  type="button"
                  style={{
                    fontSize: "1rem",
                    paddingBlock: "0.5rem",
                    textAlign: "center",
                  }}
                  onClick={async () => {
                    const todaysDate = new Date().toLocaleDateString();
                    const res = await updateCallback({
                      variables: {
                        id: callback.id,
                        messageFromTeacher: teacherMessage,
                        messageFromStudent: "",
                        messageFromStudentDate: todaysDate,
                      },
                    });
                    await queryClient.refetchQueries();
                    if (res) {
                      toast.success(
                        `Updated Callback Message for ${callback.student.name}`
                      );
                    }
                  }}
                >
                  Delete Student Message
                </SmallGradientButton>
              )}
              <AnimatedInput>
                Teacher:
                <textarea
                  id={`teacher-${callback.id}`}
                  placeholder="Message from Teacher"
                  value={teacherMessage}
                  className={loading ? "inputUpdating" : ""}
                  onKeyDown={submitOnEnter}
                  onChange={(e) => {
                    //   console.log(e.target.value);
                    const todaysDate = new Date().toLocaleDateString();
                    setTeacherMessage(e.target.value);
                    setTeacherMessageDate(todaysDate);
                  }}
                  title="Enter to submit change, Shift-Enter for new line"
                />
                <span>{teacherMessageDate || "-"}</span>
              </AnimatedInput>
            </>
          )}
        </fieldset>
      </FormGroupStyles>
    </Form>
  );
}
