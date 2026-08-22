import {
  parseParentEmailCSV,
  planParentEmailImport,
} from '../csvParentEmailImportUtils';

const HEADER = 'U_Demographics.Email_Address,*contact_info,*contact_info';

const students = [
  { id: 's1', name: 'Ayriel Allen', email: 'ayriel.allen@ncsuvt.org' },
  { id: 's2', name: 'Silas Avona', email: 'silas.avona@ncsuvt.org' },
  { id: 's3', name: 'Addyson Avona', email: 'addyson.avona@ncsuvt.org' },
];

describe('parseParentEmailCSV', () => {
  it('skips the header and reads columns by position', () => {
    const rows = parseParentEmailCSV(
      `${HEADER}\nayriel.allen@ncsuvt.org,a@gmail.com,b@gmail.com`,
    );
    expect(rows).toEqual([
      {
        line: 2,
        studentEmail: 'ayriel.allen@ncsuvt.org',
        contactEmails: ['a@gmail.com', 'b@gmail.com'],
      },
    ]);
  });

  it('collapses a contact repeated within the same row', () => {
    const rows = parseParentEmailCSV(
      `${HEADER}\nayriel.allen@ncsuvt.org,dup@x.com,dup@x.com`,
    );
    expect(rows[0].contactEmails).toEqual(['dup@x.com']);
  });

  it('tolerates CRLF line endings and blank contact cells', () => {
    const rows = parseParentEmailCSV(
      `${HEADER}\r\nayriel.allen@ncsuvt.org,only@x.com,\r\n`,
    );
    expect(rows[0].contactEmails).toEqual(['only@x.com']);
  });

  it('returns nothing for an empty or header-only file', () => {
    expect(parseParentEmailCSV('')).toEqual([]);
    expect(parseParentEmailCSV(HEADER)).toEqual([]);
  });
});

describe('planParentEmailImport', () => {
  it('creates a parent once and links the sibling to it', () => {
    const rows = parseParentEmailCSV(
      `${HEADER}\nsilas.avona@ncsuvt.org,shared@x.com\naddyson.avona@ncsuvt.org,shared@x.com`,
    );
    const plan = planParentEmailImport(rows, students, []);
    expect(plan.counts.creates).toBe(1);
    expect(plan.counts.links).toBe(1);
    expect(plan.counts.duplicateContactsCollapsed).toBe(1);
  });

  it('links to an existing user rather than creating a duplicate', () => {
    const rows = parseParentEmailCSV(
      `${HEADER}\nayriel.allen@ncsuvt.org,staff@ncsuvt.org`,
    );
    const plan = planParentEmailImport(rows, students, [
      { id: 'u9', name: 'Staff Person', email: 'staff@ncsuvt.org', children: [] },
    ]);
    expect(plan.counts.creates).toBe(0);
    expect(plan.actions[0]).toMatchObject({ kind: 'link', parentId: 'u9' });
  });

  it('reports an already-linked parent as a no-op', () => {
    const rows = parseParentEmailCSV(
      `${HEADER}\nayriel.allen@ncsuvt.org,mum@x.com`,
    );
    const plan = planParentEmailImport(rows, students, [
      { id: 'u1', name: 'mum@x.com', email: 'mum@x.com', children: [{ id: 's1' }] },
    ]);
    expect(plan.counts.alreadyLinked).toBe(1);
    expect(plan.counts.creates).toBe(0);
  });

  it('flags rows whose student email matches nobody', () => {
    const rows = parseParentEmailCSV(`${HEADER}\nghost@ncsuvt.org,a@x.com`);
    const plan = planParentEmailImport(rows, students, []);
    expect(plan.counts.studentsNotFound).toBe(1);
    expect(plan.counts.creates).toBe(0);
  });

  it('rejects malformed contacts and a contact equal to the student', () => {
    const rows = parseParentEmailCSV(
      `${HEADER}\nayriel.allen@ncsuvt.org,notanemail,ayriel.allen@ncsuvt.org`,
    );
    const plan = planParentEmailImport(rows, students, []);
    expect(plan.counts.invalidEmails).toBe(2);
    expect(plan.counts.creates).toBe(0);
  });
});
