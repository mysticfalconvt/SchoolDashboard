import { useRouter } from 'next/dist/client/router';
import React, { useEffect, useState } from 'react';
import useForm from '../../lib/useForm';
import useRevalidatePage from '../../lib/useRevalidatePage';
import GradientButton from '../styles/Button';
import Form from '../styles/Form';
import { useUser } from '../User';
import useV3PbisCollection from './useV3PbisCollection';
import { usePbisCalculations } from './usePbisCalculations';

interface FormInputs {
  confirmation: string;
}

export default function NewWeeklyPbisCollection() {
  const sendRevalidationRequest = useRevalidatePage('/pbis');
  const [showForm, setShowForm] = React.useState(false);
  const { inputs, handleChange, clearForm, resetForm } = useForm();
  const [running, setRunning] = React.useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const router = useRouter();
  const user = useUser();
  const { runCardCollection, data, setGetData, getData, loading } =
    useV3PbisCollection();
  const calculatedResults = usePbisCalculations(data);

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
          setShowPreview(false);
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
              {/* Warning for recent collection */}
              {calculatedResults.hasRecentCollection && (
                <div className="mb-6 p-4 bg-yellow-600 bg-opacity-30 border border-yellow-400 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-yellow-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-200">
                        ⚠️ Warning: Recent collection detected
                      </h3>
                      <div className="mt-2 text-sm text-yellow-100">
                        <p>
                          A PBIS collection was run {calculatedResults.daysSinceLastCollection} day{calculatedResults.daysSinceLastCollection !== 1 ? 's' : ''} ago. 
                          PBIS collections are typically run weekly. Are you sure you want to proceed?
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview Results Button */}
              {data && !showPreview && (
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => setShowPreview(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Preview Collection Results
                  </button>
                </div>
              )}

              {/* Preview Results Section */}
              {showPreview && (
                <div className="mb-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-white text-lg font-semibold">
                      Collection Preview
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowPreview(false)}
                      className="text-white hover:text-gray-300"
                    >
                      Hide Preview
                    </button>
                  </div>

                  {/* Total Cards */}
                  <div className="bg-white bg-opacity-10 p-3 rounded">
                    <h4 className="text-white font-semibold mb-2">📊 Collection Summary</h4>
                    <p className="text-white text-sm">
                      Total cards to be collected: <strong>{calculatedResults.totalCards}</strong>
                    </p>
                  </div>

                  {/* TA Team Level Changes */}
                  {calculatedResults.taTeachersWithChanges.length > 0 && (
                    <div className="bg-green-600 bg-opacity-20 p-3 rounded">
                      <h4 className="text-white font-semibold mb-2">🎉 TA Teams Leveling Up ({calculatedResults.taTeachersWithChanges.length})</h4>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {calculatedResults.taTeachersWithChanges.map((teacher) => (
                          <div key={teacher.id} className="text-white text-sm">
                            <strong>{teacher.name}</strong> - Level {teacher.taTeamPbisLevel} → {teacher.taTeamPbisLevel + teacher.taTeamPbisLevelChange} 
                            ({Math.round(teacher.newCardsPerStudent)} avg cards/student)
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Students Leveling Up */}
                  {calculatedResults.studentsLevelingUp.length > 0 && (
                    <div className="bg-purple-600 bg-opacity-20 p-3 rounded">
                      <h4 className="text-white font-semibold mb-2">⭐ Students Leveling Up ({calculatedResults.studentsLevelingUp.length})</h4>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {calculatedResults.studentsLevelingUp.map((student) => (
                          <div key={student.id} className="text-white text-sm">
                            <strong>{student.name}</strong> - Level {student.individualPbisLevel} → {student.newLevel} 
                            ({student.totalPBISCards} total cards)
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Random Drawing Winners */}
                  {calculatedResults.randomDrawingWinners.length > 0 && (
                    <div className="bg-yellow-600 bg-opacity-20 p-3 rounded">
                      <h4 className="text-white font-semibold mb-2">🎲 Random Drawing Winners ({calculatedResults.randomDrawingWinners.length})</h4>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {calculatedResults.randomDrawingWinners.map((winner, index) => (
                          <div key={`${winner.id}-${index}`} className="text-white text-sm">
                            <strong>{winner.name}</strong> - {winner.ticketCount} ticket{winner.ticketCount !== 1 ? 's' : ''}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Changes Message */}
                  {calculatedResults.taTeachersWithChanges.length === 0 && 
                   calculatedResults.studentsLevelingUp.length === 0 && 
                   calculatedResults.randomDrawingWinners.length === 0 && (
                    <div className="bg-gray-600 bg-opacity-20 p-3 rounded">
                      <p className="text-white text-sm">No level changes or winners will be generated from this collection.</p>
                    </div>
                  )}
                </div>
              )}

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
