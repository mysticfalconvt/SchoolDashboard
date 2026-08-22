// Parsing and planning for the district's student/parent export, which is keyed
// on email rather than name:
//
//   U_Demographics.Email_Address,*contact_info,*contact_info
//   ayriel.allen@ncsuvt.org,acollinsallen@gmail.com,jasonallen0019@gmail.com
//
// Contact names are not included, so a parent's email doubles as their display
// name. Use CreateParentAccountsFromCSV instead when the export carries names.

export interface ParentEmailRow {
  /** 1-based line number in the file, for error reporting. */
  line: number;
  studentEmail: string;
  contactEmails: string[];
}

export interface ExistingUser {
  id: string;
  name: string;
  email: string;
  isParent?: boolean;
  children?: { id: string }[];
}

export interface StudentRecord {
  id: string;
  name: string;
  email: string;
}

export type PlannedAction =
  | { kind: 'create'; studentId: string; studentName: string; parentEmail: string }
  | { kind: 'link'; studentId: string; studentName: string; parentEmail: string; parentId: string }
  | { kind: 'already-linked'; studentId: string; studentName: string; parentEmail: string }
  | { kind: 'student-not-found'; studentEmail: string; line: number }
  | { kind: 'invalid-email'; studentEmail: string; parentEmail: string; line: number };

export interface ImportPlan {
  actions: PlannedAction[];
  counts: {
    rows: number;
    creates: number;
    links: number;
    alreadyLinked: number;
    studentsNotFound: number;
    invalidEmails: number;
    duplicateContactsCollapsed: number;
  };
}

const EMAIL_RE = /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/;

export const isPlausibleEmail = (value: string): boolean =>
  EMAIL_RE.test(value.trim());

/**
 * Splits the export into rows. Column order is positional - student email first,
 * then any number of contact emails - because the header labels both contact
 * columns identically. Blank cells are dropped and a contact repeated within a
 * row is collapsed, which the district's export does for 16 of 246 rows.
 */
export const parseParentEmailCSV = (csvText: string): ParentEmailRow[] => {
  const lines = csvText.replace(/\r/g, '').trim().split('\n');
  if (lines.length <= 1) return [];

  return lines
    .slice(1)
    .map((line, index) => {
      const cells = line.split(',').map((cell) => cell.trim());
      const [studentEmail, ...contacts] = cells;
      const seen = new Set<string>();
      const contactEmails: string[] = [];
      for (const contact of contacts) {
        const key = contact.toLowerCase();
        if (!contact || seen.has(key)) continue;
        seen.add(key);
        contactEmails.push(contact);
      }
      return { line: index + 2, studentEmail: studentEmail || '', contactEmails };
    })
    .filter((row) => row.studentEmail);
};

/**
 * Works out what each row implies without performing any writes, so the result
 * can be previewed.
 *
 * `created` tracks emails newly created earlier in the same plan. Siblings share
 * contacts - 10 pairs in the district's export - so without this the second
 * sibling would try to create a parent that already exists and fail on the
 * unique email constraint.
 */
export const planParentEmailImport = (
  rows: ParentEmailRow[],
  students: StudentRecord[],
  existingUsers: ExistingUser[],
): ImportPlan => {
  const studentByEmail = new Map(
    students.map((student) => [student.email.toLowerCase(), student]),
  );
  const userByEmail = new Map(
    existingUsers.map((user) => [user.email.toLowerCase(), user]),
  );

  const actions: PlannedAction[] = [];
  const willExist = new Set<string>();
  let duplicateContactsCollapsed = 0;

  for (const row of rows) {
    const student = studentByEmail.get(row.studentEmail.toLowerCase());
    if (!student) {
      actions.push({
        kind: 'student-not-found',
        studentEmail: row.studentEmail,
        line: row.line,
      });
      continue;
    }

    for (const rawEmail of row.contactEmails) {
      const parentEmail = rawEmail.toLowerCase();

      if (!isPlausibleEmail(parentEmail)) {
        actions.push({
          kind: 'invalid-email',
          studentEmail: row.studentEmail,
          parentEmail: rawEmail,
          line: row.line,
        });
        continue;
      }

      // A contact that is the student's own address is a data error, not a parent.
      if (parentEmail === student.email.toLowerCase()) {
        actions.push({
          kind: 'invalid-email',
          studentEmail: row.studentEmail,
          parentEmail: rawEmail,
          line: row.line,
        });
        continue;
      }

      const existing = userByEmail.get(parentEmail);

      if (existing) {
        const alreadyLinked = (existing.children || []).some(
          (child) => child.id === student.id,
        );
        actions.push(
          alreadyLinked
            ? {
                kind: 'already-linked',
                studentId: student.id,
                studentName: student.name,
                parentEmail,
              }
            : {
                kind: 'link',
                studentId: student.id,
                studentName: student.name,
                parentEmail,
                parentId: existing.id,
              },
        );
        continue;
      }

      if (willExist.has(parentEmail)) {
        // Created earlier in this same plan - the account will exist by the time
        // we reach this row, so this becomes a link rather than a second create.
        duplicateContactsCollapsed += 1;
        actions.push({
          kind: 'link',
          studentId: student.id,
          studentName: student.name,
          parentEmail,
          parentId: '',
        });
        continue;
      }

      willExist.add(parentEmail);
      actions.push({
        kind: 'create',
        studentId: student.id,
        studentName: student.name,
        parentEmail,
      });
    }
  }

  return {
    actions,
    counts: {
      rows: rows.length,
      creates: actions.filter((a) => a.kind === 'create').length,
      links: actions.filter((a) => a.kind === 'link').length,
      alreadyLinked: actions.filter((a) => a.kind === 'already-linked').length,
      studentsNotFound: actions.filter((a) => a.kind === 'student-not-found').length,
      invalidEmails: actions.filter((a) => a.kind === 'invalid-email').length,
      duplicateContactsCollapsed,
    },
  };
};
