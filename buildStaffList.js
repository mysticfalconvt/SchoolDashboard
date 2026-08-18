const fs = require('fs');
const path = require('path');
const { teacherEmailCorrections, nonTeachingStaff } = require('./emailOverrides');

const EMAIL_DOMAIN = '@ncsuvt.org';

// The schedule CSV is a paginated print export, so the header rows repeat every
// ~45 rows, and a second leftover table (headed L / H instead of A / B) sits at
// the bottom. Everything from that L/H header down is scratch and is ignored.
const COLUMN_LABELS = ['TA', 'Red', 'Ora', 'BR', 'Yel', 'Gre', 'Blu', 'Pur', 'GS'];
const A_TA_COLUMN = 1;
const B_TA_COLUMN = 10;
const FIRST_COLUMN = 1;
const LAST_COLUMN = 18;

// Teacher cells look like "Gann, Deanna" or "Schuyler, Jeremiah T". Anything else
// in these columns is spreadsheet debris (stray legend letters, #REF! formulas).
const TEACHER_NAME_REGEX = /^[A-Za-z'\-. ]+, [A-Za-z'\-. ]+$/;

// TA is morning meeting, BR the full-school break and GS the guided study /
// silent reading period. All three carry the student's advisory teacher.
const ADVISORY_LABELS = ['TA', 'BR', 'GS'];

// Quote-aware CSV parser. lib/csvParentImportUtils.ts splits on bare commas and
// cannot be used here - every teacher cell is a quoted "Last, First".
function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (inQuotes) {
            if (char === '"') {
                if (text[i + 1] === '"') {
                    field += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                field += char;
            }
            continue;
        }

        if (char === '"') {
            inQuotes = true;
        } else if (char === ',') {
            row.push(field);
            field = '';
        } else if (char === '\n') {
            row.push(field);
            rows.push(row);
            row = [];
            field = '';
        } else if (char !== '\r') {
            field += char;
        }
    }

    if (field !== '' || row.length > 0) {
        row.push(field);
        rows.push(row);
    }

    return rows;
}

function cellAt(row, index) {
    return (row[index] || '').trim();
}

// Columns 1-9 are the A rotation, 10-18 the B rotation, both using the same
// nine labels.
function columnLabel(col) {
    const offset = col < B_TA_COLUMN ? A_TA_COLUMN : B_TA_COLUMN;
    return COLUMN_LABELS[col - offset];
}

// Both header rows that repeat down the export: the A / B (or L / H) banner and
// the column-label row beneath it.
function isBannerRow(row) {
    if (cellAt(row, 0)) return false;
    const a = cellAt(row, A_TA_COLUMN);
    const b = cellAt(row, B_TA_COLUMN);
    return (a === 'A' && b === 'B') || (a === 'L' && b === 'H');
}

function isLabelRow(row) {
    return cellAt(row, A_TA_COLUMN) === 'TA' && ['Red', '16'].includes(cellAt(row, 2));
}

// Everything from the leftover L / H table down is scratch data. The banner is
// identified by its blank student-name cell - one real student row carries stray
// L / H text in its TA columns and must not be mistaken for the banner.
function findScratchTableStart(rows) {
    const index = rows.findIndex(
        (row) => !cellAt(row, 0)
            && cellAt(row, A_TA_COLUMN) === 'L'
            && cellAt(row, B_TA_COLUMN) === 'H',
    );
    return index === -1 ? rows.length : index;
}

// "Schuyler, Jeremiah T" -> "jeremiah.schuyler@ncsuvt.org". Only the first given
// name is used, which drops trailing middle initials.
function nameToEmail(csvName) {
    const [last, first] = csvName.split(',');
    const cleanLast = last.trim().toLowerCase().replace(/[^a-z]/g, '');
    const cleanFirst = first.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, '');
    return `${cleanFirst}.${cleanLast}${EMAIL_DOMAIN}`;
}

// Mirrors formatParentName() in lib/nameUtils.ts. That module is TypeScript and
// cannot be required from a plain node script, so the logic is duplicated here.
function formatName(csvName) {
    const parts = csvName.split(',').map((part) => part.trim());
    const [last, ...firstParts] = parts;
    return `${firstParts.join(', ')} ${last}`;
}

function csvEscape(value) {
    const str = String(value);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

// Walks the teacher columns and records where each name was seen. A name in a TA
// column means advisory duty; a name in any colour column means classes.
function collectTeachers(rows, scratchStart) {
    const teachers = new Map();
    let bannerRows = 0;
    let rejectedCells = 0;

    for (let i = 0; i < scratchStart; i++) {
        const row = rows[i];

        if (isBannerRow(row) || isLabelRow(row)) {
            bannerRows++;
            continue;
        }

        for (let col = FIRST_COLUMN; col <= LAST_COLUMN; col++) {
            const value = cellAt(row, col);
            if (!value) continue;

            if (!TEACHER_NAME_REGEX.test(value)) {
                rejectedCells++;
                continue;
            }

            if (!teachers.has(value)) {
                teachers.set(value, { csvName: value, hasTA: false, hasClasses: false });
            }

            const teacher = teachers.get(value);
            const label = columnLabel(col);

            // TA, BR (break duty) and GS (guided study) all hold the advisory
            // teacher. Only the six colour columns are real classes.
            if (ADVISORY_LABELS.includes(label)) {
                teacher.hasTA = true;
            } else {
                teacher.hasClasses = true;
            }
        }
    }

    return { teachers, bannerRows, rejectedCells };
}

function buildStaffList() {
    const csvPath = process.argv[2]
        || path.join(__dirname, 'student users to update - student schedule data.csv');
    const staffJsonPath = path.join(__dirname, 'staff_input.json');
    const teachersCsvPath = path.join(__dirname, 'teachers.csv');

    console.log(`Reading ${path.basename(csvPath)}...`);
    const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
    const scratchStart = findScratchTableStart(rows);

    const { teachers, bannerRows, rejectedCells } = collectTeachers(rows, scratchStart);

    const appliedCorrections = new Set();
    const correctionsMade = [];
    const noTaDuty = [];

    const staff = [...teachers.values()]
        .sort((a, b) => a.csvName.localeCompare(b.csvName))
        .map((teacher) => {
            const generated = nameToEmail(teacher.csvName);
            let email = generated;

            if (teacherEmailCorrections[generated]) {
                email = teacherEmailCorrections[generated];
                appliedCorrections.add(generated);
                correctionsMade.push(`${generated} -> ${email}`);
            }

            // Appears in teacher columns but does not teach - see emailOverrides.js
            if (nonTeachingStaff.has(email)) {
                teacher.hasTA = false;
                teacher.hasClasses = false;
                teacher.notTeaching = true;
            }

            if (!teacher.notTeaching && !teacher.hasTA) noTaDuty.push(teacher.csvName);

            return { ...teacher, email, name: formatName(teacher.csvName) };
        });

    // Key names are lowercase on purpose. The backend resolver (AddStaff.ts in
    // school-keystone-v2) reads staffMember.hasta / .hasclasses / .isteacher -
    // camelCase keys read as undefined and every flag would land false.
    // It ignores `name` entirely and derives one from the email, but it is kept
    // here so the file is usable for a direct GraphQL create too.
    const staffJson = staff
        .filter((teacher) => !teacher.notTeaching)
        .map(({ name, email }) => ({
            name,
            email,
            hasta: true,
            hasclasses: true,
            isteacher: true,
        }));

    fs.writeFileSync(staffJsonPath, JSON.stringify(staffJson, null, 2));

    const csvLines = ['csvName,name,email,hasTA,hasClasses,notTeaching'];
    for (const teacher of staff) {
        csvLines.push([
            teacher.csvName,
            teacher.name,
            teacher.email,
            teacher.hasTA,
            teacher.hasClasses,
            !!teacher.notTeaching,
        ].map(csvEscape).join(','));
    }
    fs.writeFileSync(teachersCsvPath, `${csvLines.join('\n')}\n`);

    console.log('\nProcessing complete!');
    console.log(`Rows read: ${rows.length}`);
    console.log(`  - repeated header rows skipped: ${bannerRows}`);
    console.log(`  - leftover L/H table rows skipped: ${rows.length - scratchStart}`);
    console.log(`  - non-name cells rejected: ${rejectedCells}`);
    console.log(`Teachers found: ${staff.length}`);

    if (correctionsMade.length > 0) {
        console.log(`\nEmail corrections made (${correctionsMade.length}):`);
        correctionsMade.forEach((change) => console.log(`  - ${change}`));
    } else {
        console.log('\nNo email corrections were needed.');
    }

    const unusedCorrections = Object.keys(teacherEmailCorrections)
        .filter((email) => !appliedCorrections.has(email));
    if (unusedCorrections.length > 0) {
        console.log(`\nUnused email corrections (${unusedCorrections.length}):`);
        unusedCorrections.forEach((email) => {
            console.log(`\x1b[31m  - ${email} -> ${teacherEmailCorrections[email]} (not found in data)\x1b[0m`);
        });
    }

    if (noTaDuty.length > 0) {
        console.log(`\nNo TA duty found in the CSV, but written with hasTA: true (${noTaDuty.length}):`);
        noTaDuty.forEach((name) => console.log(`  - ${name}`));
    }

    console.log(`\nOutput written to: ${staffJsonPath}`);
    console.log(`Output written to: ${teachersCsvPath}`);
}

if (require.main === module) {
    try {
        buildStaffList();
    } catch (error) {
        console.error('Error building staff list:', error.message);
        process.exit(1);
    }
}

module.exports = { buildStaffList, parseCsv, nameToEmail, formatName };
