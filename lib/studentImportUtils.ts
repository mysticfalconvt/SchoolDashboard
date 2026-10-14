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

/** A teacher relation as the resolver reports writing it. */
type Connection = { connect?: { id?: string } } | null | undefined;

/** A student as it stood before the import, with their current teachers. */
export interface ScheduledStudentRecord extends StudentRecord {
  taTeacher?: { id: string; name?: string } | null;
  // block1Teacher..block{NUMBER_OF_BLOCKS}Teacher
  [blockTeacher: string]: unknown;
}

export interface ScheduleChange {
  label: string;
  from: string | null;
  to: string | null;
}

/**
 * What an import changed for one student, worked out by comparing the
 * pre-import roster with the teacher ids the resolver reports writing.
 *
 * The resolver skips slots whose teacher email it could not match, so a slot
 * missing from the result was left alone rather than cleared. Teachers are
 * shown by name where known, falling back to the id.
 */
export const describeScheduleChanges = (
  result: ImportedStudentResult & Record<string, unknown>,
  before: ScheduledStudentRecord | undefined,
  teacherNameById: Map<string, string>,
  numberOfBlocks: number,
): ScheduleChange[] => {
  const nameOf = (id: string | null) =>
    id ? teacherNameById.get(id) || id : null;
  const slots = [
    { field: 'taTeacher', label: 'TA' },
    ...Array.from({ length: numberOfBlocks }, (_, i) => ({
      field: `block${i + 1}Teacher`,
      label: `Block ${i + 1}`,
    })),
  ];

  const changes: ScheduleChange[] = [];
  if (before && result.name && result.name !== before.name) {
    changes.push({ label: 'Name', from: before.name, to: result.name });
  }
  slots.forEach(({ field, label }) => {
    const newId = (result[field] as Connection)?.connect?.id;
    if (!newId) return;
    const oldId =
      (before?.[field] as { id?: string } | null | undefined)?.id || null;
    if (newId !== oldId) {
      changes.push({ label, from: nameOf(oldId), to: nameOf(newId) });
    }
  });
  return changes;
};
