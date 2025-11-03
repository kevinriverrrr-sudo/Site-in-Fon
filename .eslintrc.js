/* eslint-env node */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import', 'tailwindcss'],
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'plugin:tailwindcss/recommended',
    'prettier'
  ],
  env: {
    browser: true,
    node: true,
    es2023: true
  },
  settings: {
    tailwindcss: {
      callees: ['classnames', 'clsx', 'ctl'],
      classRegex: '^(class(Name)?|tw)$'
    }
  },
  rules: {
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          ['parent', 'sibling', 'index'],
          'object',
          'type'
        ],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true }
      }
    ],
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }
    ],
    'tailwindcss/classnames-order': 'warn'
  },
  ignorePatterns: ['node_modules', '.next', 'dist', 'build', 'coverage']
};
