/* eslint-disable @typescript-eslint/no-require-imports */
const { fixupConfigRules } = require('@eslint/compat')

const js = require('@eslint/js')

const { FlatCompat } = require('@eslint/eslintrc')

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

module.exports = [
  ...fixupConfigRules(
    compat.extends(
      'airbnb',
      'next/core-web-vitals',
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:lodash/recommended',
      'plugin:prettier/recommended',
      'plugin:react-hooks/recommended',
      'prettier'
    )
  ),
  {
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.ts', '.tsx', '.d.ts'],
          moduleDirectory: ['src', 'node_modules'],
        },
      },
    },

    rules: {
      'prettier/prettier': 'error',

      'react/no-multi-comp': [
        'error',
        {
          ignoreStateless: true,
        },
      ],

      'react/require-default-props': 'off',
      '@typescript-eslint/no-unused-vars': 'error',

      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',

      'react/function-component-definition': [
        'error',
        {
          namedComponents: 'arrow-function',
          unnamedComponents: 'arrow-function',
        },
      ],

      'react/jsx-filename-extension': [
        'error',
        {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      ],

      'import/extensions': [
        'error',
        'ignorePackages',
        {
          js: 'never',
          jsx: 'never',
          ts: 'never',
          tsx: 'never',
        },
      ],

      'no-restricted-imports': [
        'error',
        {
          patterns: ['.*'],
        },
      ],

      'lodash/matches-shorthand': 'off',
      'lodash/matches-prop-shorthand': 'off',
      'lodash/prop-shorthand': 'off',
    },
  },
]
