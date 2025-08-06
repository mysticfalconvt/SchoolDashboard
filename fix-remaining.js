const fs = require('fs');
const path = require('path');

// Files that need manual fixing
const filesToFix = [
    'components/TrimesterAwards/TrimesterAwardButton.tsx',
    'components/calendars/EditCalendar.tsx',
    'components/calendars/NewCalendar.tsx',
    'components/loginComponents/MagicLinkSignIn.tsx',
    'lib/useNewParentAccount.ts',
    'lib/useSendEmail.ts'
];

function fixFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');

        // Fix the malformed destructuring patterns
        content = content.replace(
            /const\s*\[\s*([^,]+),\s*\n\s*isLoading:\s*([^,]+),\s*\n\s*error,\s*\n\s*,?\s*\{\s*data,\s*loading,\s*error\s*\}\s*\]\s*=\s*useGqlMutation\(/g,
            'const [$1, { data, loading, error }] = useGqlMutation('
        );

        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed: ${filePath}`);
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
    }
}

filesToFix.forEach(fixFile);
console.log('Remaining fixes completed!'); 
