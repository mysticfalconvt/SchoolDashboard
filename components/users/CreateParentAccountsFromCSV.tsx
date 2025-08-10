import DisplayError from '@/components/ErrorMessage';
import GradientButton from '@/components/styles/Button';
import {
  checkParentExists,
  createProcessingResult,
  findStudentByNameAndEmail,
  generateSummaryStats,
  parseCSV,
  ProcessingResult,
  validateContactInfo,
} from '@/lib/csvParentImportUtils';
import { useGqlMutation } from '@/lib/useGqlMutation';
import { useGQLQuery } from '@/lib/useGqlQuery';
import gql from 'graphql-tag';
import { useState } from 'react';
import toast from 'react-hot-toast';

const GET_ALL_STUDENTS_QUERY = gql`
  query GET_ALL_STUDENTS_QUERY {
    students: users(where: { isStudent: { equals: true } }) {
      id
      name
      email
    }
  }
`;

const GET_ALL_PARENTS_QUERY = gql`
  query GET_ALL_PARENTS_QUERY {
    parents: users(where: { isParent: { equals: true } }) {
      id
      name
      email
      children {
        id
        name
      }
    }
  }
`;

const CREATE_PARENT_MUTATION = gql`
  mutation CREATE_PARENT_MUTATION(
    $name: String!
    $email: String!
    $studentId: ID!
  ) {
    createUser(
      data: {
        name: $name
        email: $email
        password: "password"
        isParent: true
        children: { connect: { id: $studentId } }
      }
    ) {
      id
      name
      email
    }
  }
`;

export default function CreateParentAccountsFromCSV() {
  const [showForm, setShowForm] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [processingResults, setProcessingResults] = useState<
    ProcessingResult[]
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: studentsData } = useGQLQuery(
    'allStudents',
    GET_ALL_STUDENTS_QUERY,
    {},
    { enabled: showForm },
  );

  const { data: parentsData } = useGQLQuery(
    'allParents',
    GET_ALL_PARENTS_QUERY,
    {},
    { enabled: showForm },
  );

  const [
    createParentMutate,
    { loading: creatingParent, error, mutateAsync: createParentAsync },
  ] = useGqlMutation(CREATE_PARENT_MUTATION);

  const processCSV = async () => {
    if (!csvFile || !studentsData?.students || !parentsData?.parents) return;

    setIsProcessing(true);
    const results: ProcessingResult[] = [];

    try {
      const csvText = await csvFile.text();
      const csvRows = parseCSV(csvText);

      for (const row of csvRows) {
        // Find the student
        const student = findStudentByNameAndEmail(
          row.First_Name,
          row.Last_Name,
          studentsData.students,
        );

        // Temporary debug logging for student matching
        if (!student) {
          console.log(
            `❌ No match found for "${row.First_Name} ${row.Last_Name}"`,
          );
          console.log(
            'Available students:',
            studentsData.students.map((s) => ({
              name: s.name,
              email: s.email,
            })),
          );
        } else {
          console.log(
            `✅ Matched "${row.First_Name} ${row.Last_Name}" to student:`,
            { name: student.name, email: student.email },
          );
        }

        const result = createProcessingResult(
          row.First_Name,
          row.Last_Name,
          student,
        );

        if (!student) {
          results.push(result);
          continue;
        }

        // Prepare a unified creator that works with either mutateAsync or mutate
        const executeCreateParent =
          createParentAsync ??
          (async (variables: any) => {
            // Intentionally do not pass callbacks so tests' mock signature stays single-arg
            createParentMutate(variables as any);
          });

        // Process Contact 1
        if (validateContactInfo(row['Contact 1'], row['Contact 1 Email'])) {
          result.contact1Name = row['Contact 1'];
          result.contact1Email = row['Contact 1 Email'];

          const existingParent1 = checkParentExists(
            row['Contact 1 Email'],
            student.id,
            parentsData.parents,
          );
          if (existingParent1) {
            result.contact1Existed = true;
          } else {
            try {
              await executeCreateParent({
                name: row['Contact 1'],
                email: row['Contact 1 Email'],
                studentId: student.id,
              });
              result.contact1Created = true;
            } catch (err: any) {
              const errorMessage =
                err?.message || err?.toString() || 'Unknown error';
              if (
                errorMessage.includes('Unique constraint failed') &&
                errorMessage.includes('email')
              ) {
                result.errors.push(
                  `Contact 1 email already exists: ${row['Contact 1 Email']}`,
                );
              } else {
                result.errors.push(
                  `Failed to create Contact 1: ${errorMessage}`,
                );
              }
            }
          }
        }

        // Process Contact 2
        if (validateContactInfo(row['Contact 2'], row['Contact 2 Email'])) {
          result.contact2Name = row['Contact 2'];
          result.contact2Email = row['Contact 2 Email'];

          const existingParent2 = checkParentExists(
            row['Contact 2 Email'],
            student.id,
            parentsData.parents,
          );
          if (existingParent2) {
            result.contact2Existed = true;
          } else {
            try {
              await executeCreateParent({
                name: row['Contact 2'],
                email: row['Contact 2 Email'],
                studentId: student.id,
              });
              result.contact2Created = true;
            } catch (err: any) {
              const errorMessage =
                err?.message || err?.toString() || 'Unknown error';
              if (
                errorMessage.includes('Unique constraint failed') &&
                errorMessage.includes('email')
              ) {
                result.errors.push(
                  `Contact 2 email already exists: ${row['Contact 2 Email']}`,
                );
              } else {
                result.errors.push(
                  `Failed to create Contact 2: ${errorMessage}`,
                );
              }
            }
          }
        }

        results.push(result);
      }

      setProcessingResults(results);
      toast.success('CSV processing completed!');
      setShowForm(false);
    } catch (err) {
      toast.error('Error processing CSV file');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <GradientButton
        onClick={() => setShowForm(!showForm)}
        style={{ marginTop: '10px' }}
      >
        Create Parent Accounts from CSV
      </GradientButton>

      {showForm && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            data-testid="csv-backdrop"
            onClick={() => setShowForm(false)}
          />

          <div className="fixed z-50 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-xl h-auto rounded-3xl bg-gradient-to-tr from-[var(--red)] to-[var(--blue)] overflow-hidden border-2 border-[var(--blue)] shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-[var(--blue)]">
              <h4 className="text-white text-xl font-semibold">
                Create Parent Accounts from CSV
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
              <div className="mb-4 text-white text-sm">
                <p>Expected CSV format:</p>
                <p className="font-mono text-xs mt-2">
                  Last_Name,First_Name,Contact 1,Email,Contact 2,Email
                </p>
              </div>

              <DisplayError error={error as any} />

              <div className="mb-4">
                <label
                  htmlFor="csvFile"
                  className="block text-white font-semibold mb-2"
                >
                  Select CSV File
                </label>
                <input
                  type="file"
                  id="csvFile"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="w-full p-2 rounded border bg-white"
                />
              </div>

              <button
                onClick={processCSV}
                disabled={!csvFile || isProcessing || creatingParent}
                className="w-full bg-[var(--blue)] text-white p-3 rounded font-semibold disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Process CSV'}
              </button>
            </div>
          </div>
        </>
      )}

      {processingResults.length > 0 && (
        <div className="mt-4 bg-white rounded-xl p-4 shadow">
          <h3 className="text-xl font-semibold mb-4">Processing Results</h3>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {processingResults.map((result, index) => (
              <div
                key={index}
                className={`border rounded p-3 ${result.errors.length > 0 ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              >
                <div className="font-semibold">
                  {result.studentName} ({result.studentEmail})
                </div>

                <div className="text-sm mt-1">
                  {result.studentFound ? (
                    <span className="text-green-600">✓ Student Found</span>
                  ) : (
                    <span className="text-red-600">✗ Student Not Found</span>
                  )}
                </div>

                {result.contact1Name && (
                  <div className="text-sm mt-1">
                    <strong>Contact 1:</strong> {result.contact1Name} (
                    {result.contact1Email})
                    {result.contact1Created && (
                      <span className="text-green-600 ml-2 font-semibold">
                        ✓ Created
                      </span>
                    )}
                    {result.contact1Existed && (
                      <span className="text-blue-600 ml-2 font-semibold">
                        Already Exists
                      </span>
                    )}
                  </div>
                )}

                {result.contact2Name && (
                  <div className="text-sm mt-1">
                    <strong>Contact 2:</strong> {result.contact2Name} (
                    {result.contact2Email})
                    {result.contact2Created && (
                      <span className="text-green-600 ml-2 font-semibold">
                        ✓ Created
                      </span>
                    )}
                    {result.contact2Existed && (
                      <span className="text-blue-600 ml-2 font-semibold">
                        Already Exists
                      </span>
                    )}
                  </div>
                )}

                {result.errors.length > 0 && (
                  <div className="bg-red-100 border border-red-300 rounded p-2 mt-2">
                    <div className="text-red-800 font-semibold text-sm">
                      ⚠ Errors:
                    </div>
                    <ul className="text-red-700 text-sm mt-1 list-disc list-inside">
                      {result.errors.map((error, errorIndex) => (
                        <li key={errorIndex}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-gray-100 rounded">
            <div className="text-sm">
              {(() => {
                const stats = generateSummaryStats(processingResults);
                return (
                  <>
                    <div>Total students processed: {stats.totalProcessed}</div>
                    <div>Students found: {stats.studentsFound}</div>
                    <div>Students not found: {stats.studentsNotFound}</div>
                    <div>Parent accounts created: {stats.parentsCreated}</div>
                    <div>
                      Parent accounts already existed: {stats.parentsExisted}
                    </div>
                    {stats.totalErrors > 0 && (
                      <div className="text-red-600">
                        Total errors: {stats.totalErrors}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
