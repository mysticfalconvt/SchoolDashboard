import { useState } from "react";
import { gql, useMutation } from "@apollo/client";
import GradientButton from "../styles/Button";
import useForm from "../../lib/useForm";
import Form, { FormContainerStyles } from "../styles/Form";
import DisplayError from "../ErrorMessage";
import { useGQLQuery } from "../../lib/useGqlQuery";
import { SEARCH_ALL_USERS_QUERY } from "../Search";
import { useUser } from "../User";
import * as React from "react";

const UPDATE_USER_MUTATION = gql`
  mutation UPDATE_USER_MUTATION($studentScheduleData: JSON!) {
    updateStudentSchedules(studentScheduleData: $studentScheduleData)
  }
`;

export default function NewUpdateUsers() {
  const me = useUser();
  const [showForm, setShowForm] = useState(false);
  const { inputs, handleChange, clearForm } = useForm();
  const { data: allUsers } = useGQLQuery(
    "allUsers",
    SEARCH_ALL_USERS_QUERY,
    {},
    {
      enabled: !!me,
      staleTime: 1000 * 60 * 60, // 1 hour
    }
  );


  const [upateUsersFromJson, { loading, error, data }] = useMutation(
    UPDATE_USER_MUTATION,
    {
      variables: { studentScheduleData: inputs.userData },
    }
  );
  const [resultOfUpdate, setResultOfUpdate] = useState(null);

  const unUpdatedUsers = React.useMemo(() => {
    const updatedUsersByName = {};
    if (resultOfUpdate) {
      resultOfUpdate?.forEach((user) => {
        updatedUsersByName[user.name] = user;
      });
    }

    if (resultOfUpdate) {
      return allUsers?.users?.filter((user) => {
        return !updatedUsersByName[user.name] && user.isStudent;
      });
    }
    return [];
  }, [resultOfUpdate, allUsers]);
  return (
    <div>
      <GradientButton
        style={{ marginTop: "10px" }}
        onClick={() => setShowForm(!showForm)}
      >
        Batch Add/Update students from JSON
      </GradientButton>
      {showForm && (
        <>
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowForm(false)}
          />

          {/* Modal */}
          <div className="fixed z-50 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-xl h-auto rounded-3xl bg-gradient-to-tr from-[var(--red)] to-[var(--blue)] overflow-hidden border-2 border-[var(--blue)] shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-[var(--blue)]">
              <h4 className="text-white text-xl font-semibold">
                Batch Add/Update students from JSON
              </h4>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="w-8 h-8 text-white bg-[var(--redTrans)] hover:bg-[var(--blue)] rounded-full flex items-center justify-center text-lg font-bold transition-colors duration-200"
              >
                ×
              </button>
            </div>
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <Form
                className="w-full bg-transparent border-0 shadow-none p-0"
                onSubmit={async (e) => {
                  e.preventDefault();
                  // Submit the inputfields to the backend:
                  const res = await upateUsersFromJson();
                  setResultOfUpdate(JSON.parse(res.data.updateStudentSchedules));
                  setShowForm(false);
                }}
              >
                <h1 className="text-white text-lg font-semibold mb-4">Update all students schedules</h1>
                <DisplayError error={error} />
                <fieldset disabled={loading} aria-busy={loading} className="border-0 p-0">
                  <label htmlFor="userData" className="block text-white font-semibold mb-1">
                    Import Student Schedules as JSON
                    <textarea
                      required
                      rows="15"
                      type="text"
                      id="userData"
                      name="userData"
                      placeholder="JSON goes here"
                      value={inputs.userData || ""}
                      onChange={handleChange}
                      className="w-full p-2 rounded border mt-2"
                    />
                  </label>
                  <button type="submit" className="mt-6">Update Data</button>
                </fieldset>
              </Form>
            </div>
          </div>
        </>
      )}
      {resultOfUpdate && (
        <div className="mt-4 bg-white rounded-xl p-4 shadow text-black">
          <div>
            {resultOfUpdate.map((user) => {
              return (
                <p key={user.email}>
                  {user.email} - {user.existed ? "Existing User" : "New User"}
                </p>
              );
            })}
            <p>
              {resultOfUpdate.length} users updated. {unUpdatedUsers?.length} users not updated
              {unUpdatedUsers?.map((user) => {
                return <p key={user.name}>{user.name}</p>;
              })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
