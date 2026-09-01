const fs = require('fs');
const path = require('path');
const { parseCsv, nameToEmail } = require('./buildStaffList');
const { teacherEmailCorrections } = require('./emailOverrides');

// Six colour classes (ROYGBP) rotating through six time slots, on an A/B
// rotation. A student's teacher for a colour can differ between the two
// rotations, so each colour needs two block slots:
//
//   block1..block6   = Red, Orange, Yellow, Green, Blue, Purple  (A columns)
//   block7..block12  = Red, Orange, Yellow, Green, Blue, Purple  (B columns)
//
// Block numbers are keyed on colour so a number means the same class to every
// student and teacher - the assignment views read a student's block{N}Teacher
// and then that teacher's block{N}Assignment.
const COLOURS = ['Red', 'Ora', 'Yel', 'Gre', 'Blu', 'Pur'];

// Column layout of each half of the sheet: TA, Red, Ora, BR, Yel, Gre, Blu, Pur, GS
const COLUMN_LABELS = ['TA', 'Red', 'Ora', 'BR', 'Yel', 'Gre', 'Blu', 'Pur', 'GS'];
const A_START = 1;
const B_START = 10;
const LAST_COLUMN = B_START + COLUMN_LABELS.length - 1;

// BR (break duty) and GS (guided study) always hold the advisory teacher, so
// they carry nothing beyond `ta` and are dropped.
const TEACHER_NAME_REGEX = /^[A-Za-z'\-. ]+, [A-Za-z'\-. ]+$/;

// processStudents.js compares against this literal - a real JSON null would
// slip past its allBlocksAreNull() check.
const EMPTY = 'null';

function cellAt(row, index) {
    return (row[index] || '').trim();
}

function columnIndex(group, label) {
    return group + COLUMN_LABELS.indexOf(label);
}

// The A/B (or L/H) banner that repeats down the export. Detected by content
// rather than position: one export had it at columns 0 and 9 while every other
// copy of it sat at 1 and 10, so a fixed-position check missed the first one.
function isBannerRow(row) {
    const values = row.slice(0, LAST_COLUMN + 1)
        .map((cell) => (cell || '').trim())
        .filter(Boolean);
    if (values.length !== 2) return false;
    const [first, second] = values;
    return (first === 'A' && second === 'B') || (first === 'L' && second === 'H');
}

function isLabelRow(row) {
    return cellAt(row, A_START) === 'TA' && ['Red', '16'].includes(cellAt(row, 2));
}

// Everything from the leftover L/H table down is scratch. Identified by its
// blank student-name cell - one real student row carries stray L/H text in its
// TA columns and must not be mistaken for the banner.
function findScratchTableStart(rows) {
    const index = rows.findIndex(
        (row) => !cellAt(row, 0)
            && cellAt(row, A_START) === 'L'
            && cellAt(row, B_START) === 'H',
    );
    return index === -1 ? rows.length : index;
}

function teacherEmail(csvName) {
    const generated = nameToEmail(csvName);
    return teacherEmailCorrections[generated] || generated;
}

// "Agcaoili, Vyelle Alistaire Segador" -> vyelle.agcaoili@ncsuvt.org
// Per-student typo fixes live in processStudents.js, which runs after this.
function studentEmail(csvName) {
    return nameToEmail(csvName);
}

// "Agcaoili, Vyelle Alistaire Segador" -> "Vyelle Agcaoili"
//
// First given name plus surname, keeping the sheet's own capitalisation, which
// matches how staff names are stored ("Deanna Gann"). Middle names are dropped.
// This is carried in the payload because the backend would otherwise derive a
// name from the email address, which is both lowercase and lossy - hectorm.figueroa
// would become "Hectorm Figueroa".
function studentName(csvName) {
    const [last, first] = csvName.split(',');
    return `${first.trim().split(/\s+/)[0]} ${last.trim()}`;
}

function buildStudentsInput() {
    const csvPath = process.argv[2]
        || path.join(__dirname, 'student users to update - student schedule data.csv');
    const outputPath = path.join(__dirname, 'students_input.json');

    console.log(`Reading ${path.basename(csvPath)}...`);
    const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
    const scratchStart = findScratchTableStart(rows);

    const students = [];
    let bannerRows = 0;
    let namelessRows = 0;
    let rejectedCells = 0;
    const teacherCounts = new Map();

    for (let i = 0; i < scratchStart; i++) {
        const row = rows[i];
        if (isBannerRow(row) || isLabelRow(row)) {
            bannerRows++;
            continue;
        }

        const hasData = row.slice(A_START, B_START + COLUMN_LABELS.length)
            .some((cell) => (cell || '').trim());
        const name = cellAt(row, 0);

        // A pagination artefact drops the name on some rows. Skipped.
        if (!name && hasData) {
            namelessRows++;
            continue;
        }
        if (!name || !name.includes(',')) continue;

        const slot = (index) => {
            const value = cellAt(row, index);
            if (!value) return EMPTY;
            if (!TEACHER_NAME_REGEX.test(value)) {
                rejectedCells++;
                return EMPTY;
            }
            const email = teacherEmail(value);
            teacherCounts.set(email, (teacherCounts.get(email) || 0) + 1);
            return email;
        };

        // Key order matches what processStudents.js and the backend expect.
        const student = { email: studentEmail(name), name: studentName(name) };
        COLOURS.forEach((colour, n) => {
            student[`block${n + 1}`] = slot(columnIndex(A_START, colour));
        });
        student.ta = slot(columnIndex(A_START, 'TA'));
        COLOURS.forEach((colour, n) => {
            student[`block${n + 7}`] = slot(columnIndex(B_START, colour));
        });

        students.push(student);
    }

    fs.writeFileSync(outputPath, JSON.stringify(students, null, 2));

    console.log('\nProcessing complete!');
    console.log(`Rows read: ${rows.length}`);
    console.log(`  - repeated header rows skipped: ${bannerRows}`);
    console.log(`  - leftover L/H table rows skipped: ${rows.length - scratchStart}`);
    console.log(`  - rows with schedule data but no student name: ${namelessRows}`);
    console.log(`  - non-name cells rejected: ${rejectedCells}`);
    console.log(`Students written: ${students.length}`);
    console.log(`Distinct teachers referenced: ${teacherCounts.size}`);

    const duplicates = students
        .map((s) => s.email)
        .filter((email, index, all) => all.indexOf(email) !== index);
    if (duplicates.length > 0) {
        console.log(`\n\x1b[31mDuplicate student emails (${duplicates.length}):\x1b[0m`);
        [...new Set(duplicates)].forEach((email) => console.log(`\x1b[31m  - ${email}\x1b[0m`));
    }

    console.log(`\nOutput written to: ${outputPath}`);
    console.log('Next: npm run process-students');
}

if (require.main === module) {
    try {
        buildStudentsInput();
    } catch (error) {
        console.error('Error building students input:', error.message);
        process.exit(1);
    }
}

module.exports = { buildStudentsInput };
