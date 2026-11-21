import { defineConfig, globalIgnores } from 'eslint/config';
import next from 'eslint-config-next';

export default defineConfig([
  globalIgnores([
    '.next/**',
    '.next-*/**',
    'out/**',
    'build/**',
    'coverage/**',
    'next-env.d.ts',
  ]),
  ...next,
  {
    rules: {
      'react/no-unescaped-entities': 'off',
      '@next/next/no-page-custom-font': 'off',
      'react/prop-types': 'off',
      'react/destructuring-assignment': 'off',
      'jsx-a11y/label-has-associated-control': 'off',
      'react/jsx-props-no-spreading': 'off',
      'import/no-cycle': 'off',
      'react/jsx-no-bind': 'off',
      'no-nested-ternary': 'off',
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',

      // React Compiler rules added in eslint-plugin-react-hooks 7. We don't
      // use the compiler, and the code they flag works today, so they're
      // warnings to fix over time rather than CI failures.
      'react-hooks/static-components': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/refs': 'warn',
    },
  },
]);
