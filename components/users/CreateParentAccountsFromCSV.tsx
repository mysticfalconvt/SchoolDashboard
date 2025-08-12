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
  const [previewData, setPreviewData] = useState<ProcessingResult[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [currentStep, setCurrentStep] = useState<
    'upload' | 'preview' | 'processing' | 'complete'
  >('upload');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [fileStats, setFileStats] = useState({
    totalRows: 0,
    studentsFound: 0,
    studentsNotFound: 0,
    contactsToCreate: 0,
    contactsAlreadyExist: 0,
  });
  const [fileProblems, setFileProblems] = useState<{
    studentsNotFound: string[];
    invalidContacts: string[];
    duplicateEmails: string[];
  }>({
    studentsNotFound: [],
    invalidContacts: [],
    duplicateEmails: [],
  });

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

  const calculateFileStats = (
    csvRows: any[],
    students: any[],
    parents: any[],
  ) => {
    let studentsFound = 0;
    let studentsNotFound = 0;
    let contactsToCreate = 0;
    let contactsAlreadyExist = 0;

    const problems = {
      studentsNotFound: [] as string[],
      invalidContacts: [] as string[],
      duplicateEmails: [] as string[],
    };

    for (const row of csvRows) {
      const student = findStudentByNameAndEmail(
        row.First_Name,
        row.Last_Name,
        students,
      );

      if (student) {
        studentsFound++;

        // Check Contact 1
        if (validateContactInfo(row['Contact 1'], row['Contact 1 Email'])) {
          const existingParent1 = checkParentExists(
            row['Contact 1 Email'],
            student.id,
            parents,
          );
          if (existingParent1) {
            contactsAlreadyExist++;
          } else {
            contactsToCreate++;
          }
        } else if (row['Contact 1'] || row['Contact 1 Email']) {
          // Invalid contact info
          problems.invalidContacts.push(
            `${row.First_Name} ${row.Last_Name} - Contact 1: "${row['Contact 1']}" <${row['Contact 1 Email']}>`,
          );
        }

        // Check Contact 2
        if (validateContactInfo(row['Contact 2'], row['Contact 2 Email'])) {
          const existingParent2 = checkParentExists(
            row['Contact 2 Email'],
            student.id,
            parents,
          );
          if (existingParent2) {
            contactsAlreadyExist++;
          } else {
            contactsToCreate++;
          }
        } else if (row['Contact 2'] || row['Contact 2 Email']) {
          // Invalid contact info
          problems.invalidContacts.push(
            `${row.First_Name} ${row.Last_Name} - Contact 2: "${row['Contact 2']}" <${row['Contact 2 Email']}>`,
          );
        }
      } else {
        studentsNotFound++;
        problems.studentsNotFound.push(`${row.First_Name} ${row.Last_Name}`);
      }
    }

    return {
      totalRows: csvRows.length,
      studentsFound,
      studentsNotFound,
      contactsToCreate,
      contactsAlreadyExist,
      problems,
    };
  };

  const handleFileSelect = async (file: File | null) => {
    setCsvFile(file);
    if (!file || !studentsData?.students || !parentsData?.parents) {
      setPreviewData([]);
      setShowPreview(false);
      return;
    }

    try {
      const csvText = await file.text();
      const csvRows = parseCSV(csvText);
      const preview: ProcessingResult[] = [];

      // Calculate statistics for the entire file
      const stats = calculateFileStats(
        csvRows,
        studentsData.students,
        parentsData.parents,
      );
      setFileStats(stats);
      setFileProblems(stats.problems);

      // Process first 10 rows for preview
      const previewRows = csvRows.slice(0, 10);

      for (const row of previewRows) {
        const student = findStudentByNameAndEmail(
          row.First_Name,
          row.Last_Name,
          studentsData.students,
        );

        const result = createProcessingResult(
          row.First_Name,
          row.Last_Name,
          student,
        );

        // Add preview information for contacts
        if (validateContactInfo(row['Contact 1'], row['Contact 1 Email'])) {
          result.contact1Name = row['Contact 1'];
          result.contact1Email = row['Contact 1 Email'];

          const existingParent1 = checkParentExists(
            row['Contact 1 Email'],
            student?.id || '',
            parentsData.parents,
          );
          result.contact1Existed = !!existingParent1;
        }

        if (validateContactInfo(row['Contact 2'], row['Contact 2 Email'])) {
          result.contact2Name = row['Contact 2'];
          result.contact2Email = row['Contact 2 Email'];

          const existingParent2 = checkParentExists(
            row['Contact 2 Email'],
            student?.id || '',
            parentsData.parents,
          );
          result.contact2Existed = !!existingParent2;
        }

        preview.push(result);
      }

      setPreviewData(preview);
      setShowPreview(true);
      setCurrentStep('preview');
    } catch (err) {
      toast.error('Error reading CSV file');
      console.error(err);
    }
  };

  const processCSV = async () => {
    if (!csvFile || !studentsData?.students || !parentsData?.parents) return;

    setIsProcessing(true);
    setCurrentStep('processing');
    const results: ProcessingResult[] = [];

    try {
      const csvText = await csvFile.text();
      const csvRows = parseCSV(csvText);

      setProgress({ current: 0, total: csvRows.length });

      for (let i = 0; i < csvRows.length; i++) {
        const row = csvRows[i];

        // Update progress
        setProgress({ current: i + 1, total: csvRows.length });

        // Find the student
        const student = findStudentByNameAndEmail(
          row.First_Name,
          row.Last_Name,
          studentsData.students,
        );

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
      setCurrentStep('complete');
      toast.success('CSV processing completed!');
    } catch (err) {
      toast.error('Error processing CSV file');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setCsvFile(null);
    setProcessingResults([]);
    setPreviewData([]);
    setShowPreview(false);
    setCurrentStep('upload');
    setProgress({ current: 0, total: 0 });
    setFileStats({
      totalRows: 0,
      studentsFound: 0,
      studentsNotFound: 0,
      contactsToCreate: 0,
      contactsAlreadyExist: 0,
    });
    setFileProblems({
      studentsNotFound: [],
      invalidContacts: [],
      duplicateEmails: [],
    });
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

          <div className="fixed z-50 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-4xl h-auto rounded-3xl bg-gradient-to-tr from-[var(--red)] to-[var(--blue)] overflow-hidden border-2 border-[var(--blue)] shadow-2xl">
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
              {/* Step Indicator */}
              <div className="mb-6">
                <div className="flex items-center justify-center space-x-4">
                  <div
                    className={`flex items-center ${currentStep === 'upload' || currentStep === 'preview' || currentStep === 'processing' || currentStep === 'complete' ? 'text-white' : 'text-gray-400'}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'upload' ? 'bg-[var(--blue)]' : 'bg-white text-[var(--blue)]'}`}
                    >
                      1
                    </div>
                    <span className="ml-2">Upload</span>
                  </div>
                  <div
                    className={`w-8 h-1 ${currentStep === 'preview' || currentStep === 'processing' || currentStep === 'complete' ? 'bg-white' : 'bg-gray-400'}`}
                  ></div>
                  <div
                    className={`flex items-center ${currentStep === 'preview' || currentStep === 'processing' || currentStep === 'complete' ? 'text-white' : 'text-gray-400'}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'preview' ? 'bg-[var(--blue)]' : currentStep === 'processing' || currentStep === 'complete' ? 'bg-white text-[var(--blue)]' : 'bg-gray-400'}`}
                    >
                      2
                    </div>
                    <span className="ml-2">Preview</span>
                  </div>
                  <div
                    className={`w-8 h-1 ${currentStep === 'processing' || currentStep === 'complete' ? 'bg-white' : 'bg-gray-400'}`}
                  ></div>
                  <div
                    className={`flex items-center ${currentStep === 'processing' || currentStep === 'complete' ? 'text-white' : 'text-gray-400'}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'processing' ? 'bg-[var(--blue)]' : currentStep === 'complete' ? 'bg-white text-[var(--blue)]' : 'bg-gray-400'}`}
                    >
                      3
                    </div>
                    <span className="ml-2">Process</span>
                  </div>
                </div>
              </div>

              {/* Upload Step */}
              {currentStep === 'upload' && (
                <div>
                  <div className="mb-4 text-white text-sm">
                    <p>Expected CSV format:</p>
                    <p className="font-mono text-xs mt-2">
                      Last_Name,First_Name,Contact 1,Contact 1 Email,Contact
                      2,Contact 2 Email
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
                      onChange={(e) =>
                        handleFileSelect(e.target.files?.[0] || null)
                      }
                      className="w-full p-2 rounded border bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Preview Step */}
              {currentStep === 'preview' && showPreview && (
                <div>
                  <div className="mb-4 text-white">
                    <h3 className="text-lg font-semibold mb-2">
                      Preview (First 10 rows)
                    </h3>
                    <p className="text-sm">
                      Review the data before processing:
                    </p>
                  </div>

                  {/* File Statistics */}
                  <div className="bg-white rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-gray-800 mb-3">
                      File Summary
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Total Records:</div>
                        <div className="font-semibold text-gray-800">
                          {fileStats.totalRows}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Students Found:</div>
                        <div className="font-semibold text-green-600">
                          {fileStats.studentsFound}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Students Not Found:</div>
                        <div className="font-semibold text-red-600">
                          {fileStats.studentsNotFound}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">
                          Parent Accounts to Create:
                        </div>
                        <div className="font-semibold text-blue-600">
                          {fileStats.contactsToCreate}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">
                          Parent Accounts Already Exist:
                        </div>
                        <div className="font-semibold text-gray-600">
                          {fileStats.contactsAlreadyExist}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 mb-4 max-h-64 overflow-y-auto">
                    {previewData.map((result, index) => (
                      <div
                        key={index}
                        className={`border rounded p-3 mb-2 ${result.errors.length > 0 ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                      >
                        <div className="font-semibold">
                          {result.studentName} (
                          {result.studentEmail || 'No email'})
                        </div>

                        <div className="text-sm mt-1">
                          {result.studentFound ? (
                            <span className="text-green-600">
                              ✓ Student Found
                            </span>
                          ) : (
                            <span className="text-red-600">
                              ✗ Student Not Found
                            </span>
                          )}
                        </div>

                        {result.contact1Name && (
                          <div className="text-sm mt-1">
                            <strong>Contact 1:</strong> {result.contact1Name} (
                            {result.contact1Email})
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

                  {/* Problems Section */}
                  {(fileProblems.studentsNotFound.length > 0 ||
                    fileProblems.invalidContacts.length > 0 ||
                    fileProblems.duplicateEmails.length > 0) && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-red-800 mb-3">
                        ⚠ Issues Found in File
                      </h4>

                      {fileProblems.studentsNotFound.length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-medium text-red-700 mb-2">
                            Students Not Found (
                            {fileProblems.studentsNotFound.length}):
                          </h5>
                          <div className="bg-white border border-red-200 rounded p-3 max-h-32 overflow-y-auto">
                            <ul className="text-sm text-red-600 space-y-1">
                              {fileProblems.studentsNotFound.map(
                                (student, index) => (
                                  <li key={index} className="flex items-center">
                                    <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                                    {student}
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        </div>
                      )}

                      {fileProblems.invalidContacts.length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-medium text-red-700 mb-2">
                            Invalid Contact Information (
                            {fileProblems.invalidContacts.length}):
                          </h5>
                          <div className="bg-white border border-red-200 rounded p-3 max-h-32 overflow-y-auto">
                            <ul className="text-sm text-red-600 space-y-1">
                              {fileProblems.invalidContacts.map(
                                (contact, index) => (
                                  <li key={index} className="flex items-center">
                                    <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                                    {contact}
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        </div>
                      )}

                      {fileProblems.duplicateEmails.length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-medium text-red-700 mb-2">
                            Duplicate Emails (
                            {fileProblems.duplicateEmails.length}):
                          </h5>
                          <div className="bg-white border border-red-200 rounded p-3 max-h-32 overflow-y-auto">
                            <ul className="text-sm text-red-600 space-y-1">
                              {fileProblems.duplicateEmails.map(
                                (email, index) => (
                                  <li key={index} className="flex items-center">
                                    <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                                    {email}
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setCurrentStep('upload');
                        setShowPreview(false);
                      }}
                      className="flex-1 bg-gray-500 text-white p-3 rounded font-semibold"
                    >
                      Back
                    </button>
                    <button
                      onClick={processCSV}
                      disabled={!csvFile || isProcessing || creatingParent}
                      className="flex-1 bg-[var(--blue)] text-white p-3 rounded font-semibold disabled:opacity-50"
                    >
                      Process All Records
                    </button>
                  </div>
                </div>
              )}

              {/* Processing Step */}
              {currentStep === 'processing' && (
                <div className="text-center text-white">
                  <h3 className="text-lg font-semibold mb-4">
                    Processing CSV File
                  </h3>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                      <div
                        className="bg-[var(--blue)] h-4 rounded-full transition-all duration-300"
                        style={{
                          width: `${(progress.current / progress.total) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-sm">
                      Processing {progress.current} of {progress.total}{' '}
                      records...
                    </div>
                  </div>

                  <div className="text-sm">
                    Creating parent accounts and linking to students...
                  </div>
                </div>
              )}

              {/* Complete Step */}
              {currentStep === 'complete' && (
                <div>
                  <div className="text-center text-white mb-4">
                    <h3 className="text-lg font-semibold">
                      Processing Complete!
                    </h3>
                    <p className="text-sm">All records have been processed.</p>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={resetForm}
                      className="flex-1 bg-[var(--blue)] text-white p-3 rounded font-semibold"
                    >
                      Process Another File
                    </button>
                    <button
                      onClick={() => setShowForm(false)}
                      className="flex-1 bg-gray-500 text-white p-3 rounded font-semibold"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
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
