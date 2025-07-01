import { useState } from "react";
import { gql, useMutation } from "@apollo/client";
import GradientButton from "../styles/Button";
import useForm from "../../lib/useForm";
import Form, { FormContainer } from "../styles/Form";
import DisplayError from "../ErrorMessage";

const UPDATE_EVENTS_MUTATION = gql`
  mutation UPDATE_EVENTS_MUTATION($eventData: String!) {
    addEvents(eventData: $eventData) {
      name
    }
  }
`;

export default function NewEvents() {
  const [showForm, setShowForm] = useState(false);
  const { inputs, handleChange, clearForm } = useForm();
  const [upateUsersFromJson, { loading, error, data }] = useMutation(
    UPDATE_EVENTS_MUTATION,
    {
      variables: { eventData: inputs.userData },
    }
  );
  const [resultOfUpdate, setResultOfUpdate] = useState(null);

  return (
    <div>
      <GradientButton
        style={{ marginTop: "10px" }}
        onClick={() => setShowForm(!showForm)}
      >
        Add New Events
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
                Bulk Add Events
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
                  // setResultOfUpdate(
                  //   JSON.parse(res.data.updateStudentSchedules.name)
                  // );
                  // clearForm();
                  setShowForm(false);
                }}
              >
                <h1 className="text-white text-lg font-semibold mb-4">Bulk Add Events</h1>
                <DisplayError error={error} />
                <fieldset disabled={loading} aria-busy={loading} className="border-0 p-0">
                  <label htmlFor="userData" className="block text-white font-semibold mb-1">
                    Import Events as JSON
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
    </div>
  );
}
