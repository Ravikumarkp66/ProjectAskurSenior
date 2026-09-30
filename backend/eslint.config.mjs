import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: [
      'node_modules/**',
      'coverage/**',
      '.c8_output/**',
      'uploads/**',
      'logs/**',
      'scratch/**',
      'tmp/**',
      'dist/**',
      'build/**'
    ]
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.es2021
      }
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-undef': 'error',
      'no-empty': ['error', { allowEmptyCatch: true }]
    }
  },
  {
    files: ['tests/**/*.js', 'services/__tests__/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
        test: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        before: 'readonly',
        after: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly'
      }
    },
    rules: {
      'no-loss-of-precision': 'off'
    }
  }
];
