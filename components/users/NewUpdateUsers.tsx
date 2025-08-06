import DisplayError from '@/components/ErrorMessage';
import { SEARCH_ALL_USERS_QUERY } from '@/components/Search';
import GradientButton from '@/components/styles/Button';
import Form from '@/components/styles/Form';
import { useUser } from '@/components/User';
import useForm from '@/lib/useForm';
import { useGqlMutation } from '@/lib/useGqlMutation';
import { useGQLQuery } from '@/lib/useGqlQuery';
import gql from 'graphql-tag';
import * as React from 'react';
import { useState } from 'react';

const UPDATE_USER_MUTATION = gql`
  mutation UPDATE_USER_MUTATION($studentScheduleData: JSON!) {
    updateStudentSchedules(studentScheduleData: $studentScheduleData)
  }
`;

interface FormInputs {
  userData?: string;
}

interface User {
  name: string;
  isStudent: boolean;
}

interface UpdateResult {
  name: string;
  email: string;
  existed: boolean;
}

export default function NewUpdateUsers() {
  const me = useUser();
  const [showForm, setShowForm] = useState(false);
  const { inputs, handleChange, clearForm } = useForm();
  const { data: allUsers } = useGQLQuery(
    'allUsers',
    SEARCH_ALL_USERS_QUERY,
    {},
    {
      enabled: !!me,
      staleTime: 1000 * 60 * 60, // 1 hour
    },
  );

  const [updateUsersFromJson, { loading, error, data }] =
    useGqlMutation(UPDATE_USER_MUTATION);
  const [resultOfUpdate, setResultOfUpdate] = useState<UpdateResult[] | null>(
    null,
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const unUpdatedUsers = React.useMemo(() => {
    const updatedUsersByName: Record<string, UpdateResult> = {};
    if (resultOfUpdate) {
      resultOfUpdate?.forEach((user) => {
        updatedUsersByName[user.name] = user;
      });
    }

    if (resultOfUpdate) {
      return allUsers?.users?.filter((user: User) => {
        return !updatedUsersByName[user.name] && user.isStudent;
      });
    }
    return [];
  }, [resultOfUpdate, allUsers]);
  return (
    <div>
      <GradientButton
        style={{ marginTop: '10px' }}
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
            data-testid="backdrop"
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
                  setIsProcessing(true);

                  try {
                    const parsedData = JSON.parse(inputs.userData || '[]');

                    if (parsedData.length > 1) {
                      // Split into 2 chunks
                      const midPoint = Math.ceil(parsedData.length / 2);
                      const chunk1 = parsedData.slice(0, midPoint);
                      const chunk2 = parsedData.slice(midPoint);

                      // Process chunks sequentially

                      // Process first chunk
                      const result1 = await new Promise<UpdateResult[]>(
                        (resolve) => {
                          updateUsersFromJson(
                            {
                              studentScheduleData: JSON.stringify(chunk1),
                            },
                            {
                              onSuccess: (data) => {
                                resolve(
                                  JSON.parse(
                                    data.updateStudentSchedules || '[]',
                                  ),
                                );
                              },
                            },
                          );
                        },
                      );

                      // Process second chunk
                      const result2 = await new Promise<UpdateResult[]>(
                        (resolve) => {
                          updateUsersFromJson(
                            {
                              studentScheduleData: JSON.stringify(chunk2),
                            },
                            {
                              onSuccess: (data) => {
                                resolve(
                                  JSON.parse(
                                    data.updateStudentSchedules || '[]',
                                  ),
                                );
                              },
                            },
                          );
                        },
                      );

                      // Combine results
                      const combinedResults = [...result1, ...result2];
                      setResultOfUpdate(combinedResults);
                    } else {
                      // Single item or empty, process normally
                      const result = await new Promise<UpdateResult[]>(
                        (resolve) => {
                          updateUsersFromJson(
                            {
                              studentScheduleData: inputs.userData,
                            },
                            {
                              onSuccess: (data) => {
                                resolve(
                                  JSON.parse(
                                    data.updateStudentSchedules || '[]',
                                  ),
                                );
                              },
                            },
                          );
                        },
                      );

                      setResultOfUpdate(result);
                    }

                    setShowForm(false);
                  } catch (err) {
                    console.error('Error processing update:', err);
                  } finally {
                    setIsProcessing(false);
                  }
                }}
              >
                <h1 className="text-white text-lg font-semibold mb-4">
                  Update all students schedules
                </h1>
                <DisplayError error={error as any} />
                <fieldset
                  disabled={loading || isProcessing}
                  aria-busy={loading || isProcessing}
                  className="border-0 p-0"
                >
                  <label
                    htmlFor="userData"
                    className="block text-white font-semibold mb-1"
                  >
                    Import Student Schedules as JSON
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
            <p>
              {resultOfUpdate.length} users updated. {unUpdatedUsers?.length}{' '}
              users not updated
              {unUpdatedUsers?.map((user: User) => {
                return <p key={user.name}>{user.name}</p>;
              })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
