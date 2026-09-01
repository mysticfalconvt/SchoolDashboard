import DisplayError from '@/components/ErrorMessage';
import GradientButton, {
  SmallGradientButton,
} from '@/components/styles/Button';
import Form from '@/components/styles/Form';
import { useUser } from '@/components/User';
import useForm from '@/lib/useForm';
import { useGqlMutation } from '@/lib/useGqlMutation';
import { useGQLQuery } from '@/lib/useGqlQuery';
import gql from 'graphql-tag';
import * as React from 'react';
import { useState } from 'react';
import {
  findUntouchedStudents,
  summariseImport,
} from '@/lib/studentImportUtils';
import { NUMBER_OF_BLOCKS } from '../../config';

const UPDATE_USER_MUTATION = gql`
  mutation UPDATE_USER_MUTATION($studentScheduleData: JSON!) {
    updateStudentSchedules(studentScheduleData: $studentScheduleData)
  }
`;

// Students are compared to the import by email, not name - two students can
// share a name, and the resolver reports results keyed on email.
const GET_STUDENTS_AND_TEACHERS_QUERY = gql`
  query GET_STUDENTS_AND_TEACHERS_FOR_IMPORT {
    students: users(where: { isStudent: { equals: true } }) {
      id
      name
      email
    }
    teachers: users(where: { isTeacher: { equals: true } }) {
      id
      name
      email
    }
  }
`;

// Where a student's schedule goes when they leave the export. Everything lands
// on one teacher so the student keeps their account, history and parent links,
// and stops appearing on real teachers' block rosters.
const PARK_STUDENT_MUTATION = gql`
  mutation PARK_STUDENT_SCHEDULE($id: ID!, $teacherId: ID!) {
    updateUser(
      where: { id: $id }
      data: {
        taTeacher: { connect: { id: $teacherId } }
        ${Array.from(
          { length: NUMBER_OF_BLOCKS },
          (_, i) => `block${i + 1}Teacher: { connect: { id: $teacherId } }`,
        ).join('\n        ')}
      }
    ) {
      id
      email
    }
  }
`;

const PARKING_TEACHER_EMAIL = 'robert.boskind@ncsuvt.org';

const TILE_TONES: Record<string, string> = {
  green: 'bg-green-50 text-green-800 border-green-200',
  blue: 'bg-blue-50 text-blue-800 border-blue-200',
  orange: 'bg-orange-50 text-orange-800 border-orange-200',
  grey: 'bg-gray-50 text-gray-700 border-gray-200',
};

function ResultTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: keyof typeof TILE_TONES;
}) {
  return (
    <div className={`rounded-xl border px-3 py-2 ${TILE_TONES[tone]}`}>
      <div className="text-2xl font-semibold leading-tight">{value}</div>
      <div className="text-[11px] uppercase tracking-wide opacity-80">
        {label}
      </div>
    </div>
  );
}

interface FormInputs {
  userData?: string;
}

interface Person {
  id: string;
  name: string;
  email: string;
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
  const { data: rosterData, refetch: refetchRoster } = useGQLQuery(
    'studentsAndTeachersForImport',
    GET_STUDENTS_AND_TEACHERS_QUERY,
    {},
    { enabled: !!me },
  );

  const [updateUsersFromJson, { loading, error, data }] =
    useGqlMutation(UPDATE_USER_MUTATION);
  const [, { error: parkError, mutateAsync: parkStudent }] =
    useGqlMutation(PARK_STUDENT_MUTATION);

  const [resultOfUpdate, setResultOfUpdate] = useState<UpdateResult[] | null>(
    null,
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [parkingTeacherId, setParkingTeacherId] = useState('');
  const [parkProgress, setParkProgress] = useState({ current: 0, total: 0 });
  const [parkedIds, setParkedIds] = useState<Set<string>>(new Set());
  const [parkingId, setParkingId] = useState<string | null>(null);
  const [parkFailures, setParkFailures] = useState<string[]>([]);

  const teachers: Person[] = React.useMemo(
    () =>
      [...(rosterData?.teachers || [])].sort((a: Person, b: Person) =>
        a.name.localeCompare(b.name),
      ),
    [rosterData],
  );

  // Students that exist in the app but were absent from the import - normally
  // students who have left, since a departure simply drops them from the export.
  // Matched on email: the resolver reports one per processed student, and names
  // are not unique.
  const unUpdatedUsers: Person[] = React.useMemo(
    () => findUntouchedStudents(resultOfUpdate, rosterData?.students || []),
    [resultOfUpdate, rosterData],
  );

  const summary = React.useMemo(
    () => summariseImport(resultOfUpdate),
    [resultOfUpdate],
  );

  const pendingCount = unUpdatedUsers.filter((s) => !parkedIds.has(s.id)).length;

  React.useEffect(() => {
    if (parkingTeacherId || teachers.length === 0) return;
    const preferred = teachers.find(
      (t) => t.email.toLowerCase() === PARKING_TEACHER_EMAIL,
    );
    setParkingTeacherId(preferred?.id || '');
  }, [teachers, parkingTeacherId]);

  const parkOne = async (student: Person): Promise<boolean> => {
    try {
      await parkStudent({ id: student.id, teacherId: parkingTeacherId });
      setParkedIds((prev) => new Set(prev).add(student.id));
      return true;
    } catch (err: any) {
      setParkFailures((prev) => [
        ...prev,
        `${student.name}: ${err?.message || 'Unknown error'}`,
      ]);
      return false;
    }
  };

  const parkSingleStudent = async (student: Person) => {
    if (!parkingTeacherId) return;
    setParkingId(student.id);
    await parkOne(student);
    setParkingId(null);
    await refetchRoster();
  };

  const parkAllRemaining = async () => {
    const pending = unUpdatedUsers.filter((s) => !parkedIds.has(s.id));
    if (!parkingTeacherId || pending.length === 0) return;
    setParkProgress({ current: 0, total: pending.length });

    // Sequential so a long list cannot flood the API.
    for (let i = 0; i < pending.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      await parkOne(pending[i]);
      setParkProgress({ current: i + 1, total: pending.length });
    }

    setParkProgress({ current: 0, total: 0 });
    await refetchRoster();
  };
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
        <div className="mt-4 bg-white rounded-2xl p-5 shadow-lg text-black">
          <h3 className="font-semibold text-xl mb-4">Import results</h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <ResultTile
              label="Created"
              value={summary.created}
              tone="green"
            />
            <ResultTile
              label="Updated"
              value={summary.updated}
              tone="blue"
            />
            <ResultTile
              label="Total processed"
              value={summary.total}
              tone="grey"
            />
            <ResultTile
              label="Not in import"
              value={unUpdatedUsers.length}
              tone={unUpdatedUsers.length ? 'orange' : 'grey'}
            />
          </div>

          <DisplayError error={parkError as any} />

          {unUpdatedUsers.length > 0 && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
              <h4 className="font-semibold mb-1">
                {unUpdatedUsers.length} student
                {unUpdatedUsers.length === 1 ? '' : 's'} not in this import
              </h4>
              <p className="text-sm text-gray-700 mb-3">
                Usually students who have left, since a departure just drops them
                from the export. Their schedules are untouched, so they still
                appear on their old teachers&apos; block rosters. Moving every
                block and their TA onto one teacher clears those rosters while
                keeping the account, its history and any parent links - so a
                returning student picks up where they left off.
              </p>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                <label
                  htmlFor="parkingTeacher"
                  className="text-sm font-medium"
                >
                  Move all blocks and TA to
                </label>
                <select
                  id="parkingTeacher"
                  value={parkingTeacherId}
                  onChange={(e) => setParkingTeacherId(e.target.value)}
                  className="rounded-lg border border-gray-300 px-2 py-1 text-sm bg-white"
                  disabled={parkProgress.total > 0 || parkingId !== null}
                >
                  <option value="">Select a teacher…</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} ({teacher.email})
                    </option>
                  ))}
                </select>
              </div>

              {parkProgress.total > 0 ? (
                <div className="mb-3">
                  <div className="h-2 w-full rounded-full bg-orange-200 overflow-hidden">
                    <div
                      className="h-full bg-orange-500 transition-all duration-300"
                      style={{
                        width: `${(parkProgress.current / parkProgress.total) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-sm mt-2">
                    Moving {parkProgress.current} of {parkProgress.total}…
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <SmallGradientButton
                    type="button"
                    onClick={parkAllRemaining}
                    disabled={!parkingTeacherId || pendingCount === 0}
                  >
                    {pendingCount === 0
                      ? 'All moved'
                      : `Move all ${pendingCount} remaining`}
                  </SmallGradientButton>
                  {parkedIds.size > 0 && (
                    <span className="text-sm font-medium text-green-800">
                      {parkedIds.size} moved
                    </span>
                  )}
                </div>
              )}

              {parkFailures.length > 0 && (
                <div className="mb-3 max-h-32 overflow-y-auto text-xs font-mono text-red-700">
                  {parkFailures.map((f, i) => (
                    <div key={`park-failed-${i}`}>{f}</div>
                  ))}
                </div>
              )}

              <div className="rounded-lg bg-white border border-orange-200 divide-y divide-orange-100 max-h-64 overflow-y-auto">
                {unUpdatedUsers.map((student) => {
                  const isParked = parkedIds.has(student.id);
                  return (
                    <div
                      key={student.id}
                      className="flex items-center justify-between gap-3 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {student.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {student.email}
                        </div>
                      </div>
                      {isParked ? (
                        <span className="text-xs font-semibold text-green-700 whitespace-nowrap">
                          Moved
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => parkSingleStudent(student)}
                          disabled={
                            !parkingTeacherId ||
                            parkingId === student.id ||
                            parkProgress.total > 0
                          }
                          className="text-xs font-semibold uppercase tracking-wide rounded-lg border border-orange-300 bg-orange-100 hover:bg-orange-200 disabled:opacity-40 px-3 py-1 whitespace-nowrap"
                        >
                          {parkingId === student.id ? 'Moving…' : 'Move'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <details className="mt-4">
            <summary className="text-sm font-medium cursor-pointer">
              Per-student detail ({resultOfUpdate.length})
            </summary>
            <div className="max-h-64 overflow-y-auto mt-2 text-sm">
              {resultOfUpdate.map((user) => (
                <p key={user.email}>
                  {user.email} -{' '}
                  <span
                    className={
                      user.existed ? 'text-blue-700' : 'text-green-700'
                    }
                  >
                    {user.existed ? 'Updated' : 'Created'}
                  </span>
                </p>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
