// Helpers for the batch student-schedule import on the super-user settings page.

export interface ImportedStudentResult {
  name?: string;
  email: string;
  existed: boolean;
}

export interface StudentRecord {
  id: string;
  name: string;
  email: string;
}

/**
 * Students that exist in the app but were absent from the import.
 *
 * Normally students who have left: a departure simply drops them from the
 * schedule export, and because updateStudentSchedules only touches emails it was
 * given, their old schedule stays attached to their former teachers.
 *
 * Matched on email rather than name. Names are not unique - the roster has four
 * Smiths and two Lamoureuxs - and the resolver reports one result per processed
 * student keyed on email.
 */
export const findUntouchedStudents = (
  results: ImportedStudentResult[] | null,
  students: StudentRecord[],
): StudentRecord[] => {
  if (!results) return [];
  const touched = new Set(
    results.map((result) => (result.email || '').toLowerCase()).filter(Boolean),
  );
  return students.filter(
    (student) => !touched.has((student.email || '').toLowerCase()),
  );
};

/** Counts for the import summary. */
export const summariseImport = (results: ImportedStudentResult[] | null) => ({
  created: results ? results.filter((r) => !r.existed).length : 0,
  updated: results ? results.filter((r) => r.existed).length : 0,
  total: results ? results.length : 0,
});
