// Teacher name corrections - fixes nicknames used in the schedule CSV
// Format: "generated.email@domain.com": "correct.email@domain.com"
//
// The CSV lists teachers as "Last, First" using whatever name the office types,
// which is often a nickname. The generated first.last address is therefore wrong
// for those people. Each correction below is verified against a teacher email
// already present in students_input.json.
//
// Add more corrections here as new staff show up with nicknames in the sheet.
// Any entry that never fires is reported in red when a script runs, so a stale
// correction announces itself instead of silently rotting.
const teacherEmailCorrections = {
  'josh.fortin@ncsuvt.org': 'joshua.fortin@ncsuvt.org', // Fortin, Josh
  'mic.hallinan@ncsuvt.org': 'michael.hallinan@ncsuvt.org', // Hallinan, Mic
  'becca.larose@ncsuvt.org': 'rebecca.larose@ncsuvt.org', // LaRose, Becca
};

// People who appear in teacher columns of the schedule CSV but do not actually
// teach. Their cells are paste artifacts from how the sheet is assembled - every
// row carrying them has a blank student name, so no student references them.
// Listed here so they are not written out as teachers.
const nonTeachingStaff = new Set([
  'lynn.crew@ncsuvt.org', // Assistant Principal
  'lona.stuart@ncsuvt.org', // 504/EST Coordinator
  'katrina.mcfarlane@ncsuvt.org', // School Counselor
  'cody.lanou@ncsuvt.org', // no longer teaches
]);

module.exports = { teacherEmailCorrections, nonTeachingStaff };
