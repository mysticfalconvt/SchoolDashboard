const fs = require('fs');
const path = require('path');

// Email corrections mapping - fixes common typos or name changes in student emails
// Format: "incorrect.email@domain.com": "correct.email@domain.com"
// 
// This will:
// 1. Find students with the incorrect email address
// 2. Replace it with the correct email address
// 3. Log the change for audit purposes
// 4. Only affects the student's email field, not their teacher assignments
//
// Add more corrections here as needed:
const emailCorrections = {
    "ruthie.lawson@ncsuvt.org": "ruth.lawson@ncsuvt.org",
    "dayana.bernardo@ncsuvt.org": "dayana.chunbernardo@ncsuvt.org",
    "destiny-ann.perry@ncsuvt.org": "destinyann.perry@ncsuvt.org",
    "rory.chitambar@ncsuvt.org": "gregory.chitambar@ncsuvt.org",
    "alex.cochran@ncsuvt.org": "alexander.cochran@ncsuvt.org",
    "hailey.marie@ncsuvt.org": "hailey.ste.marie@ncsuvt.org",
    "jessey-jaymes.charest@ncsuvt.org": "jesseyjaymes.charest@ncsuvt.org",
    "pip.cornelius-dreher@ncsuvt.org": "philip.dreher@ncsuvt.org",
    "joey.iii@ncsuvt.org": "joseph.valenti@ncsuvt.org",
    "hector.figueroa@ncsuvt.org": " hectorm.figueroa@ncsuvt.org",
};

// Function to validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email !== "#VALUE!";
}

// Function to check if all blocks are null
function allBlocksAreNull(student) {
    for (let i = 1; i <= 10; i++) {
        if (student[`block${i}`] !== "null") {
            return false;
        }
    }
    return true;
}

// Function to clean student data
function cleanStudent(student, emailChanges, nullBlocksRemoved, appliedCorrections) {
    // Apply email corrections
    if (emailCorrections[student.email]) {
        const oldEmail = student.email;
        student.email = emailCorrections[student.email];
        emailChanges.push(`${oldEmail} → ${student.email}`);
        appliedCorrections.add(oldEmail); // Track which corrections were actually applied
    }

    // Remove individual null blocks
    const removedBlocks = [];
    for (let i = 1; i <= 10; i++) {
        if (student[`block${i}`] === "null") {
            removedBlocks.push(`block${i}`);
            delete student[`block${i}`];
        }
    }

    // Log if any blocks were removed
    if (removedBlocks.length > 0) {
        nullBlocksRemoved.push(`${student.email}: removed ${removedBlocks.join(', ')}`);
    }

    return student;
}

// Main processing function
function processStudents() {
    try {
        // Read the input file
        const inputPath = path.join(__dirname, 'studentList.json');
        const outputPath = path.join(__dirname, 'students.json');

        console.log('Reading studentList.json...');
        const rawData = fs.readFileSync(inputPath, 'utf8');
        const students = JSON.parse(rawData);

        console.log(`Processing ${students.length} students...`);

        let processedStudents = [];
        let removedCount = 0;
        let invalidEmailCount = 0;
        let allNullBlocksCount = 0;
        let emailChanges = [];
        let nullBlocksRemoved = [];
        let appliedCorrections = new Set(); // Track which corrections were actually applied

        for (const student of students) {
            // Remove students with invalid emails
            if (!isValidEmail(student.email)) {
                invalidEmailCount++;
                removedCount++;
                continue;
            }

            // Remove students where all blocks 1-10 are null
            if (allBlocksAreNull(student)) {
                allNullBlocksCount++;
                removedCount++;
                continue;
            }

            // Clean the student data (remove individual null blocks)
            const cleanedStudent = cleanStudent({ ...student }, emailChanges, nullBlocksRemoved, appliedCorrections);
            processedStudents.push(cleanedStudent);
        }

        // Write the processed data to students.json
        fs.writeFileSync(outputPath, JSON.stringify(processedStudents, null, 2));

        console.log('\nProcessing complete!');
        console.log(`Total students processed: ${students.length}`);
        console.log(`Valid students kept: ${processedStudents.length}`);
        console.log(`Students removed: ${removedCount}`);
        console.log(`  - Invalid emails: ${invalidEmailCount}`);
        console.log(`  - All blocks null: ${allNullBlocksCount}`);

        // Log email changes if any were made
        if (emailChanges.length > 0) {
            console.log(`\nEmail corrections made (${emailChanges.length}):`);
            emailChanges.forEach(change => console.log(`  - ${change}`));
        } else {
            console.log('\nNo email corrections were needed.');
        }

        // Log unused email corrections (defined but not applied)
        const unusedCorrections = Object.keys(emailCorrections).filter(email => !appliedCorrections.has(email));
        if (unusedCorrections.length > 0) {
            console.log(`\nUnused email corrections (${unusedCorrections.length}):`);
            unusedCorrections.forEach(email => {
                console.log(`\x1b[31m  - ${email} → ${emailCorrections[email]} (not found in data)\x1b[0m`);
            });
        }

        // Log null blocks removed if any were made
        if (nullBlocksRemoved.length > 0) {
            console.log(`\nStudents with null blocks removed (${nullBlocksRemoved.length}):`);
            nullBlocksRemoved.forEach(change => console.log(`  - ${change}`));
        } else {
            console.log('\nNo null blocks were removed from students.');
        }

        console.log(`\nOutput written to: ${outputPath}`);

    } catch (error) {
        console.error('Error processing students:', error.message);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    processStudents();
}

module.exports = { processStudents, cleanStudent, isValidEmail, allBlocksAreNull };
