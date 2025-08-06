const fs = require('fs');
const path = require('path');

// Patterns to fix
const patterns = [
    // Pattern 1: const { mutate: name } = useGqlMutation(...)
    {
        regex: /const\s*\{\s*mutate:\s*([^}]+)\s*\}\s*=\s*useGqlMutation\(/g,
        replacement: 'const [$1, { data, loading, error }] = useGqlMutation('
    },
    // Pattern 2: const { mutate: name, isLoading: loading, error } = useGqlMutation(...)
    {
        regex: /const\s*\{\s*mutate:\s*([^,]+),\s*isLoading:\s*([^,]+),\s*error\s*\}\s*=\s*useGqlMutation\(/g,
        replacement: 'const [$1, { data, loading: $2, error }] = useGqlMutation('
    },
    // Pattern 3: const { mutate: name, error } = useGqlMutation(...)
    {
        regex: /const\s*\{\s*mutate:\s*([^,]+),\s*error\s*\}\s*=\s*useGqlMutation\(/g,
        replacement: 'const [$1, { data, loading, error }] = useGqlMutation('
    }
];

function fixFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let changed = false;

        patterns.forEach(pattern => {
            const newContent = content.replace(pattern.regex, pattern.replacement);
            if (newContent !== content) {
                content = newContent;
                changed = true;
            }
        });

        if (changed) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Fixed: ${filePath}`);
        }
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            walkDir(filePath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            fixFile(filePath);
        }
    });
}

// Start fixing from current directory
walkDir('.');
console.log('Mutation fixes completed!'); 
