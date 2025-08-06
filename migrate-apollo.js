const fs = require('fs');
const path = require('path');

// Function to migrate a single file
function migrateFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace Apollo imports
    content = content.replace(
        /import \{ useGqlMutation \} from '@apollo\/client';/g,
        "import { useGqlMutation } from '../../lib/useGqlMutation';"
    );

    content = content.replace(
        /import \{ gql, useGqlMutation \} from '@apollo\/client';/g,
        "import gql from 'graphql-tag';\nimport { useGqlMutation } from '../../lib/useGqlMutation';"
    );

    // Replace useGqlMutation calls with variables
    content = content.replace(
        /const \[([^,]+), \{ ([^}]+) \}\] = useGqlMutation<([^,]+), ([^>]+)>\(([^,]+),\s*\{\s*variables:\s*\{([^}]+)\}\s*\}\);/g,
        'const { mutate: $1, isLoading: loading, error } = useGqlMutation<$3, $4>($5);'
    );

    // Replace simple useGqlMutation calls
    content = content.replace(
        /const \[([^,]+), \{ ([^}]+) \}\] = useGqlMutation\(([^,]+)(?:,\s*\{[^}]*\})?\);/g,
        'const { mutate: $1, isLoading: loading, error } = useGqlMutation($3);'
    );

    // Replace mutation calls with variables
    content = content.replace(
        /await ([^(]+)\(\{\s*variables:\s*\{([^}]+)\}\s*\}\)/g,
        'await $1({ $2 })'
    );

    // Replace simple mutation calls
    content = content.replace(
        /await ([^(]+)\(\)/g,
        'await $1({})'
    );

    // Fix response access patterns
    content = content.replace(
        /res\.data\.([^.]+)/g,
        'res.$1'
    );

    return content;
}

// List of files to migrate
const filesToMigrate = [
    'components/Callback/MarkCallbackCompleted.tsx',
    'components/Callback/CallbackCardMessages.tsx',
    'components/Callback/NewCallbackButton.tsx',
    'components/Callback/CallbackEditor.tsx',
    'components/Callback/DuplicateCallback.tsx',
    'components/Callback/EmailParentsAboutCallback.tsx',
    'components/Callback/CallbackMessagesForTable.tsx',
    'components/Callback/newCallbackMultiStudent.tsx',
    'components/NewSortingHatQuestionButton.tsx',
    'components/Reset.tsx',
    'components/RequestReset.tsx',
    'components/modifySpecialGroup.tsx',
    'components/studentFocus/NewStudentFocusButton.tsx',
    'components/discipline/CellPhoneAddButton.tsx',
    'components/discipline/DisciplineButton.tsx',
    'components/discipline/BullyingButton.tsx',
    'components/discipline/AdminDisciplineData.tsx',
    'components/users/EditStudent.tsx',
    'components/users/CreateNewStudent.tsx',
    'components/users/NewStaff.tsx',
    'components/users/NewEvents.tsx',
    'components/users/NewUpdateUsers.tsx',
    'components/users/UpdateMyPassword.tsx',
    'components/users/ResetPasswordToPassword.tsx',
    'components/loginComponents/SignIn.tsx',
    'components/PBIS/QuickPbisButton.tsx',
    'components/PBIS/PbisCardFormButton.tsx',
    'components/PBIS/GiveListOfStudentsACardButton.tsx',
    'components/PBIS/CountPhysicalCards.tsx',
    'components/links/NewLink.tsx',
    'components/links/EditLink.tsx',
    'components/Birthdays/AddBirthdays.tsx',
    'components/Birthdays/DeliveredCake.tsx',
    'components/Birthdays/StudentCakeChooser.tsx',
    'components/Assignments/AssignmentUpdater.tsx',
    'components/video/newVideoButton.tsx',
    'components/calendars/NewCalendar.tsx',
    'components/calendars/EditCalendar.tsx',
    'components/Chromebooks/CreateChromebookAssignments.tsx',
    'components/Chromebooks/CreateSingleChromebookCheck.tsx',
    'components/Chromebooks/ChromebookCheck.tsx',
    'components/Chromebooks/ChromebookAssignmentsData.tsx',
    'pages/loginLink.tsx',
    'pages/parentRegistration/[id].tsx',
    'pages/getSorted.tsx'
];

console.log('Starting Apollo to React Query migration...');

filesToMigrate.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        console.log(`Migrating ${file}...`);
        try {
            const migratedContent = migrateFile(filePath);
            fs.writeFileSync(filePath, migratedContent);
            console.log(`✓ Migrated ${file}`);
        } catch (error) {
            console.log(`✗ Error migrating ${file}:`, error.message);
        }
    } else {
        console.log(`⚠ File not found: ${file}`);
    }
});

console.log('Migration complete!'); 
