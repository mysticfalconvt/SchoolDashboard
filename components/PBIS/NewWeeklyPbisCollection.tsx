import { useRouter } from 'next/dist/client/router';
import React, { useEffect } from 'react';
import useForm from '../../lib/useForm';
import useRevalidatePage from '../../lib/useRevalidatePage';
import GradientButton from '../styles/Button';
import Form from '../styles/Form';
import { useUser } from '../User';
import useV3PbisCollection from './useV3PbisCollection';

interface FormInputs {
  confirmation: string;
}

export default function NewWeeklyPbisCollection() {
  const sendRevalidationRequest = useRevalidatePage('/pbis');
  const [showForm, setShowForm] = React.useState(false);
  const { inputs, handleChange, clearForm, resetForm } = useForm();
  const [running, setRunning] = React.useState(false);
  const router = useRouter();
  const user = useUser();
  const { runCardCollection, data, setGetData, getData, loading } =
    useV3PbisCollection();

  useEffect(() => {
    console.log('running', running);
    if (!running) {
      setShowForm(false);
    }
  }, [running]);
  // console.log(data);

  // Check if user is authenticated and has PBIS permissions
  if (!user) {
    return (
      <div className="text-center p-4">
        <p className="text-red-600 font-semibold mb-2">
          You must be logged in to run PBIS collections.
        </p>
        <p className="text-gray-600">Please log in to access this feature.</p>
      </div>
    );
  }

  if (!user.canManagePbis && !user.isSuperAdmin) {
    return (
      <div className="text-center p-4">
        <p className="text-red-600 font-semibold mb-2">
          You don't have permission to run PBIS collections.
        </p>
        <p className="text-gray-600">
          Required permission: canManagePbis or isSuperAdmin. Contact an
          administrator for access.
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Current permissions: canManagePbis={user.canManagePbis}, isStaff=
          {user.isStaff}, isSuperAdmin={user.isSuperAdmin}
        </p>
      </div>
    );
  }

  return (
    <div>
      <GradientButton
        style={{ marginTop: '10px' }}
        onClick={() => {
          setShowForm(!showForm);
          setGetData(!getData);
        }}
      >
        Run Weekly Pbis Collection
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
                Run Weekly PBIS Card Collection
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
                  if (inputs.confirmation === 'yes') {
                    setRunning(true);
                    const res = await runCardCollection();
                    resetForm();
                    if (res) {
                      const revalidateRes = await sendRevalidationRequest();
                      // wait for the revalidation to finish for a couple seconds
                      await new Promise((resolve) => setTimeout(resolve, 2000));

                      setRunning(false);
                      router.push({
                        pathname: `/pbis`,
                      });
                    }
                  }
                }}
              >
                <h1 className="text-white text-lg font-semibold mb-4">
                  Run the weekly PBIS Card Collection
                </h1>
                <fieldset
                  disabled={running || !data}
                  aria-busy={running || !data}
                  className="border-0 p-0"
                >
                  <label
                    htmlFor="confirmation"
                    className="block text-white font-semibold mb-1"
                  >
                    Do You Really Want To Do this?
                    <input
                      required
                      type="text"
                      id="confirmation"
                      name="confirmation"
                      placeholder="Type 'yes' to confirm"
                      value={inputs.confirmation || ''}
                      onChange={handleChange}
                      className="w-full p-2 rounded border mt-2"
                    />
                  </label>
                  <button type="submit" className="mt-6">
                    Run Card Collection
                  </button>
                </fieldset>
              </Form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
