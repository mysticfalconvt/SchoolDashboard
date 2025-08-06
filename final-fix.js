const fs = require('fs');
const path = require('path');

// Function to fix a single file
function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Fix import paths for components (should be ../../lib/useGqlMutation)
    content = content.replace(
        /import \{ useGqlMutation \} from '\.\.\/lib\/useGqlMutation';/g,
        "import { useGqlMutation } from '../../lib/useGqlMutation';"
    );

    // Fix import paths for pages (should be ../lib/useGqlMutation)
    content = content.replace(
        /import \{ useGqlMutation \} from '\.\.\/\.\.\/lib\/useGqlMutation';/g,
        "import { useGqlMutation } from '../lib/useGqlMutation';"
    );

    // Replace remaining useGqlMutation calls
    content = content.replace(
        /const \[([^,]+), \{ ([^}]+) \}\] = useGqlMutation\(([^,]+)(?:,\s*\{[^}]*\})?\);/g,
        'const { mutate: $1, isLoading: loading, error } = useGqlMutation($3);'
    );

    // Replace useGqlMutation calls with generics
    content = content.replace(
        /const \[([^,]+), \{ ([^}]+) \}\] = useGqlMutation<([^,]+), ([^>]+)>\(([^,]+)(?:,\s*\{[^}]*\})?\);/g,
        'const { mutate: $1, isLoading: loading, error } = useGqlMutation<$3, $4>($5);'
    );

    // Replace simple useGqlMutation calls
    content = content.replace(
        /const \[([^,]+)\] = useGqlMutation\(([^,]+)(?:,\s*\{[^}]*\})?\);/g,
        'const { mutate: $1 } = useGqlMutation($2);'
    );

    // Fix refetch calls
    content = content.replace(
        /await refetch\?\.\(\{\}\)/g,
        'await refetch?.()'
    );

    return content;
}

// List of files to fix
const filesToFix = [
    'components/Assignments/AssignmentUpdater.tsx',
    'components/Birthdays/AddBirthdays.tsx',
    'components/Birthdays/DeliveredCake.tsx',
    'components/Birthdays/StudentCakeChooser.tsx',
    'components/calendars/EditCalendar.tsx',
    'components/calendars/NewCalendar.tsx',
    'components/Callback/CallbackCardMessages.tsx',
    'components/Callback/CallbackEditor.tsx',
    'components/Callback/CallbackMessagesForTable.tsx',
    'components/Callback/DuplicateCallback.tsx',
    'components/Callback/EmailParentsAboutCallback.tsx',
    'components/Callback/MarkCallbackCompleted.tsx',
    'components/Callback/NewCallbackButton.tsx',
    'components/Callback/newCallbackMultiStudent.tsx',
    'components/Chromebooks/ChromebookAssignmentsData.tsx',
    'components/Chromebooks/ChromebookCheck.tsx',
    'components/Chromebooks/CreateChromebookAssignments.tsx',
    'components/Chromebooks/CreateSingleChromebookCheck.tsx',
    'components/discipline/AdminDisciplineData.tsx',
    'components/discipline/BullyingButton.tsx',
    'components/discipline/CellPhoneAddButton.tsx',
    'components/discipline/DisciplineButton.tsx',
    'components/links/EditLink.tsx',
    'components/links/NewLink.tsx',
    'components/loginComponents/SignIn.tsx',
    'components/modifySpecialGroup.tsx',
    'components/NewSortingHatQuestionButton.tsx',
    'components/PBIS/CountPhysicalCards.tsx',
    'components/PBIS/PbisCardFormButton.tsx',
    'components/PBIS/QuickPbisButton.tsx',
    'components/RequestReset.tsx',
    'components/Reset.tsx',
    'components/studentFocus/NewStudentFocusButton.tsx',
    'components/users/CreateNewStudent.tsx',
    'components/users/EditStudent.tsx',
    'components/users/NewEvents.tsx',
    'components/users/NewStaff.tsx',
    'components/users/NewUpdateUsers.tsx',
    'components/users/ResetPasswordToPassword.tsx',
    'components/users/UpdateMyPassword.tsx',
    'components/video/newVideoButton.tsx',
    'pages/getSorted.tsx',
    'pages/loginLink.tsx',
    'pages/parentRegistration/[id].tsx'
];

console.log('Final migration fix...');

filesToFix.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        console.log(`Fixing ${file}...`);
        try {
            const fixedContent = fixFile(filePath);
            fs.writeFileSync(filePath, fixedContent);
            console.log(`✓ Fixed ${file}`);
        } catch (error) {
            console.log(`✗ Error fixing ${file}:`, error.message);
        }
    } else {
        console.log(`⚠ File not found: ${file}`);
    }
});

console.log('Final fix complete!'); 
