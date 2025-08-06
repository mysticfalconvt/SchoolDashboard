const fs = require('fs');
const path = require('path');

// Function to update imports in a single file
function updateImports(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Update useGqlMutation imports
    content = content.replace(
        /import \{ useGqlMutation \} from '\.\.\/\.\.\/lib\/useGqlMutation';/g,
        "import { useGqlMutation } from '@/lib/useGqlMutation';"
    );

    content = content.replace(
        /import \{ useGqlMutation \} from '\.\.\/lib\/useGqlMutation';/g,
        "import { useGqlMutation } from '@/lib/useGqlMutation';"
    );

    content = content.replace(
        /import \{ useGqlMutation \} from '\.\.\/\.\.\/\.\.\/lib\/useGqlMutation';/g,
        "import { useGqlMutation } from '@/lib/useGqlMutation';"
    );

    // Update other common imports
    content = content.replace(
        /import useForm from '\.\.\/\.\.\/lib\/useForm';/g,
        "import useForm from '@/lib/useForm';"
    );

    content = content.replace(
        /import useForm from '\.\.\/lib\/useForm';/g,
        "import useForm from '@/lib/useForm';"
    );

    content = content.replace(
        /import \{ useGQLQuery \} from '\.\.\/\.\.\/lib\/useGqlQuery';/g,
        "import { useGQLQuery } from '@/lib/useGqlQuery';"
    );

    content = content.replace(
        /import \{ useGQLQuery \} from '\.\.\/lib\/useGqlQuery';/g,
        "import { useGQLQuery } from '@/lib/useGqlQuery';"
    );

    // Update component imports
    content = content.replace(
        /import ([^']+) from '\.\.\/([^']+)';/g,
        "import $1 from '@/components/$2';"
    );

    content = content.replace(
        /import \{ ([^}]+) \} from '\.\.\/([^']+)';/g,
        "import { $1 } from '@/components/$2';"
    );

    // Update config imports
    content = content.replace(
        /import ([^']+) from '\.\.\/\.\.\/config';/g,
        "import $1 from '@/config';"
    );

    content = content.replace(
        /import ([^']+) from '\.\.\/config';/g,
        "import $1 from '@/config';"
    );

    return content;
}

// List of files to update
const filesToUpdate = [
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
    'components/loginComponents/SignOut.tsx',
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

console.log('Updating imports to use absolute paths...');

filesToUpdate.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        console.log(`Updating ${file}...`);
        try {
            const updatedContent = updateImports(filePath);
            fs.writeFileSync(filePath, updatedContent);
            console.log(`✓ Updated ${file}`);
        } catch (error) {
            console.log(`✗ Error updating ${file}:`, error.message);
        }
    } else {
        console.log(`⚠ File not found: ${file}`);
    }
});

console.log('Import updates complete!'); 
