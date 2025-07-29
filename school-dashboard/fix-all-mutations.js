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

    // Add useGqlMutation import if not present and if file uses useGqlMutation
    if (content.includes('useGqlMutation') && !content.includes('useGqlMutation')) {
        // Find the first import line and add useGqlMutation after it
        const importMatch = content.match(/import.*from.*['"]/);
        if (importMatch) {
            const importIndex = content.indexOf(importMatch[0]);
            const lineEndIndex = content.indexOf('\n', importIndex);
            content = content.slice(0, lineEndIndex) + '\nimport { useGqlMutation } from \'@/lib/useGqlMutation\';' + content.slice(lineEndIndex);
        }
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

    return content;
}

// Get all TypeScript/JavaScript files recursively
function getAllFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            getAllFiles(filePath, fileList);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

console.log('Comprehensive migration fix for all files...');

const allFiles = getAllFiles('.');
let fixedCount = 0;

allFiles.forEach(file => {
    try {
        const content = fs.readFileSync(file, 'utf8');

        // Only process files that contain useGqlMutation
        if (content.includes('useGqlMutation')) {
            console.log(`Fixing ${file}...`);
            const fixedContent = fixFile(file);
            fs.writeFileSync(file, fixedContent);
            fixedCount++;
            console.log(`✓ Fixed ${file}`);
        }
    } catch (error) {
        console.log(`✗ Error processing ${file}:`, error.message);
    }
});

console.log(`\nComprehensive fix complete! Fixed ${fixedCount} files.`); 
