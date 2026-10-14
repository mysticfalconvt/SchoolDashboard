import {
  describeScheduleChanges,
  findUntouchedStudents,
  summariseImport,
} from '../studentImportUtils';

const students = [
  { id: 's1', name: 'Mark Smith', email: 'markd.smith@ncsuvt.org' },
  { id: 's2', name: 'Blake Smith', email: 'blake.smith@ncsuvt.org' },
  { id: 's3', name: 'Alana Volpone', email: 'alana.volpone@ncsuvt.org' },
];

describe('findUntouchedStudents', () => {
  it('returns students absent from the import', () => {
    const untouched = findUntouchedStudents(
      [
        { email: 'markd.smith@ncsuvt.org', existed: true },
        { email: 'blake.smith@ncsuvt.org', existed: true },
      ],
      students,
    );
    expect(untouched.map((s) => s.email)).toEqual([
      'alana.volpone@ncsuvt.org',
    ]);
  });

  it('matches on email, not name - two students sharing a surname', () => {
    // Both Smiths were imported; neither should be reported untouched even
    // though a name-based comparison could confuse them.
    const untouched = findUntouchedStudents(
      [
        { name: 'Mark Smith', email: 'markd.smith@ncsuvt.org', existed: true },
        { name: 'Blake Smith', email: 'blake.smith@ncsuvt.org', existed: true },
      ],
      students,
    );
    expect(untouched.map((s) => s.name)).toEqual(['Alana Volpone']);
  });

  it('is not fooled by a result whose name is missing', () => {
    // Newly created students used to come back with an undefined name.
    const untouched = findUntouchedStudents(
      [{ email: 'alana.volpone@ncsuvt.org', existed: false }],
      students,
    );
    expect(untouched.map((s) => s.email)).toEqual([
      'markd.smith@ncsuvt.org',
      'blake.smith@ncsuvt.org',
    ]);
  });

  it('ignores case differences in email', () => {
    const untouched = findUntouchedStudents(
      [{ email: 'MarkD.Smith@ncsuvt.org', existed: true }],
      students,
    );
    expect(untouched.map((s) => s.id)).toEqual(['s2', 's3']);
  });

  it('returns nothing before an import has run', () => {
    expect(findUntouchedStudents(null, students)).toEqual([]);
  });

  it('reports every student when the import processed none', () => {
    expect(findUntouchedStudents([], students)).toHaveLength(3);
  });
});

describe('summariseImport', () => {
  it('splits created from updated', () => {
    expect(
      summariseImport([
        { email: 'a@x.org', existed: true },
        { email: 'b@x.org', existed: false },
        { email: 'c@x.org', existed: false },
      ]),
    ).toEqual({ created: 2, updated: 1, total: 3 });
  });

  it('zeroes out before an import has run', () => {
    expect(summariseImport(null)).toEqual({ created: 0, updated: 0, total: 0 });
  });
});

describe('describeScheduleChanges', () => {
  const teacherNames = new Map([
    ['t1', 'Deanna Gann'],
    ['t2', 'Dawn Hall'],
  ]);
  const before = {
    id: 's1',
    name: 'Vyelle Agcaoili',
    email: 'vyelle.agcaoili@ncsuvt.org',
    taTeacher: { id: 't1', name: 'Deanna Gann' },
    block1Teacher: { id: 't1' },
    block2Teacher: { id: 't1' },
  };

  it('reports nothing when every written slot already matched', () => {
    const changes = describeScheduleChanges(
      {
        email: before.email,
        name: 'Vyelle Agcaoili',
        existed: true,
        taTeacher: { connect: { id: 't1' } },
        block1Teacher: { connect: { id: 't1' } },
      },
      before,
      teacherNames,
      2,
    );
    expect(changes).toEqual([]);
  });

  it('lists each changed slot with teacher names', () => {
    const changes = describeScheduleChanges(
      {
        email: before.email,
        name: 'Vyelle Agcaoili',
        existed: true,
        taTeacher: { connect: { id: 't2' } },
        block1Teacher: { connect: { id: 't1' } },
        block2Teacher: { connect: { id: 't2' } },
      },
      before,
      teacherNames,
      2,
    );
    expect(changes).toEqual([
      { label: 'TA', from: 'Deanna Gann', to: 'Dawn Hall' },
      { label: 'Block 2', from: 'Deanna Gann', to: 'Dawn Hall' },
    ]);
  });

  it('treats a slot the resolver did not write as unchanged', () => {
    // An unmatched teacher email is skipped by the resolver, not cleared.
    const changes = describeScheduleChanges(
      { email: before.email, name: 'Vyelle Agcaoili', existed: true },
      before,
      teacherNames,
      2,
    );
    expect(changes).toEqual([]);
  });

  it('reports a filled empty slot and a name correction', () => {
    const changes = describeScheduleChanges(
      {
        email: before.email,
        name: 'Vyelle A',
        existed: true,
        block2Teacher: { connect: { id: 't2' } },
      },
      { ...before, block2Teacher: null },
      teacherNames,
      2,
    );
    expect(changes).toEqual([
      { label: 'Name', from: 'Vyelle Agcaoili', to: 'Vyelle A' },
      { label: 'Block 2', from: null, to: 'Dawn Hall' },
    ]);
  });
});
