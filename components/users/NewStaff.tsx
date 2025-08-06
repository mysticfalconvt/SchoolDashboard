import DisplayError from '@/components/ErrorMessage';
import GradientButton from '@/components/styles/Button';
import Form from '@/components/styles/Form';
import useForm from '@/lib/useForm';
import { useGqlMutation } from '@/lib/useGqlMutation';
import gql from 'graphql-tag';
import { useState } from 'react';

const UPDATE_USER_MUTATION = gql`
  mutation UPDATE_USER_MUTATION($staffData: JSON!) {
    addStaff(staffData: $staffData)
  }
`;

interface FormInputs {
  userData?: string;
}

interface UpdateResult {
  email: string;
  existed: boolean;
}

export default function NewUpdateUsers() {
  const [showForm, setShowForm] = useState(false);
  const { inputs, handleChange, clearForm } = useForm();
  const inputJson = JSON.parse(inputs?.userData || '{}');

  const [updateUsersFromJson, { loading, error, data }] =
    useGqlMutation(UPDATE_USER_MUTATION);
  const [resultOfUpdate, setResultOfUpdate] = useState<UpdateResult[] | null>(
    null,
  );

  return (
    <div>
      <GradientButton
        style={{ marginTop: '10px' }}
        onClick={() => setShowForm(!showForm)}
      >
        Batch Update Staff from JSON
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
                Batch Update Staff from JSON
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
                  const inputJson = JSON.parse(inputs?.userData || '{}');
                  if (!inputJson) return;
                  await updateUsersFromJson({
                    staffData: inputJson,
                  });
                  setResultOfUpdate(JSON.parse(data?.addStaff || '[]'));
                  clearForm();
                  setShowForm(false);
                }}
              >
                <h1 className="text-white text-lg font-semibold mb-4">
                  Update all staff
                </h1>
                <DisplayError error={error as any} />
                <fieldset
                  disabled={loading}
                  aria-busy={loading}
                  className="border-0 p-0"
                >
                  <label
                    htmlFor="userData"
                    className="block text-white font-semibold mb-1"
                  >
                    Import Staff as JSON
                    <textarea
                      required
                      rows={15}
                      id="userData"
                      name="userData"
                      placeholder="JSON goes here"
                      value={inputs.userData || ''}
                      onChange={handleChange}
                      className="w-full p-2 rounded border mt-2"
                    />
                  </label>
                  <button type="submit" className="mt-6">
                    Update Data
                  </button>
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
                  {user.email} - {user.existed ? 'Existing User' : 'New User'}
                </p>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
