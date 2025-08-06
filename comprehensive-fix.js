const fs = require('fs');
const path = require('path');

// Function to fix a single file
function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove Apollo imports
    content = content.replace(
        /import \{ useGqlMutation \} from '@apollo\/client';/g,
        ''
    );

    content = content.replace(
        /import \{ gql, useGqlMutation \} from '@apollo\/client';/g,
        ''
    );

    // Add useGqlMutation import if not present
    if (!content.includes('useGqlMutation')) {
        content = content.replace(
            /import gql from 'graphql-tag';/g,
            "import gql from 'graphql-tag';\nimport { useGqlMutation } from '@/lib/useGqlMutation';"
        );
    }

    // Replace various useGqlMutation patterns
    content = content.replace(
        /const \[([^,]+), \{ ([^}]+) \}\] = useGqlMutation<([^,]+), ([^>]+)>\(([^,]+)(?:,\s*\{[^}]*\})?\);/g,
        'const { mutate: $1, isLoading: loading, error } = useGqlMutation<$3, $4>($5);'
    );

    content = content.replace(
        /const \[([^,]+), \{ ([^}]+) \}\] = useGqlMutation\(([^,]+)(?:,\s*\{[^}]*\})?\);/g,
        'const { mutate: $1, isLoading: loading, error } = useGqlMutation($3);'
    );

    content = content.replace(
        /const \[([^,]+)\] = useGqlMutation\(([^,]+)(?:,\s*\{[^}]*\})?\);/g,
        'const { mutate: $1 } = useGqlMutation($2);'
    );

    // Fix mutation calls with variables
    content = content.replace(
        /await ([^(]+)\(\{\s*variables:\s*\{([^}]+)\}\s*\}\)/g,
        'await $1({ $2 })'
    );

    // Fix simple mutation calls
    content = content.replace(
        /await ([^(]+)\(\)/g,
        'await $1({})'
    );

    // Fix response access patterns
    content = content.replace(
        /res\.data\.([^.]+)/g,
        'res.$1'
    );

    // Fix refetch calls
    content = content.replace(
        /await refetch\?\.\(\{\}\)/g,
        'await refetch?.()'
    );

    content = content.replace(
        /await revalidateIndexPage\(\{\}\)/g,
        'await revalidateIndexPage({})'
    );

    content = content.replace(
        /await revalidateCalendarPage\(\{\}\)/g,
        'await revalidateCalendarPage({})'
    );

    content = content.replace(
        /await revalidateLinkPage\(\{\}\)/g,
        'await revalidateLinkPage({})'
    );

    return content;
}

// List of files to fix
const filesToFix = [
    'components/NewSortingHatQuestionButton.tsx',
    'components/modifySpecialGroup.tsx',
    'components/discipline/CellPhoneAddButton.tsx',
    'components/discipline/AdminDisciplineData.tsx',
    'components/discipline/DisciplineButton.tsx',
    'components/discipline/BullyingButton.tsx',
    'components/loginComponents/SignIn.tsx',
    'components/Chromebooks/CreateChromebookAssignments.tsx',
    'components/Callback/MarkCallbackCompleted.tsx',
    'components/Chromebooks/ChromebookAssignmentsData.tsx',
    'components/studentFocus/NewStudentFocusButton.tsx',
    'components/Chromebooks/ChromebookCheck.tsx',
    'components/Callback/CallbackCardMessages.tsx',
    'components/Callback/CallbackMessagesForTable.tsx',
    'components/Callback/CallbackEditor.tsx',
    'components/Callback/NewCallbackButton.tsx',
    'components/Callback/newCallbackMultiStudent.tsx',
    'components/Callback/DuplicateCallback.tsx',
    'components/links/NewLink.tsx',
    'components/users/ResetPasswordToPassword.tsx',
    'components/users/EditStudent.tsx',
    'components/users/NewStaff.tsx',
    'components/users/UpdateMyPassword.tsx',
    'components/users/NewEvents.tsx',
    'components/users/CreateNewStudent.tsx',
    'components/PBIS/PbisCardFormButton.tsx',
    'components/users/NewUpdateUsers.tsx',
    'components/PBIS/QuickPbisButton.tsx',
    'components/links/EditLink.tsx',
    'components/RequestReset.tsx',
    'components/Birthdays/AddBirthdays.tsx',
    'components/Birthdays/DeliveredCake.tsx',
    'components/Birthdays/StudentCakeChooser.tsx',
    'components/Reset.tsx',
    'components/video/newVideoButton.tsx',
    'components/calendars/EditCalendar.tsx',
    'components/calendars/NewCalendar.tsx'
];

console.log('Comprehensive migration fix...');

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

console.log('Comprehensive fix complete!'); 
