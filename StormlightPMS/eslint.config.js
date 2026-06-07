import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  // Reference material and build output must never be linted. design-handoff/
  // is a design prototype that relies on ambient globals and JSX-without-imports.
  { ignores: ['design-handoff/**', 'dist/**', 'node_modules/**'] },
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // console is banned by default; deliberate diagnostic calls opt back in
      // with an inline `eslint-disable-next-line no-console`.
      'no-console': 'warn',
    },
  },
)
