import { voxpelli } from '@voxpelli/eslint-config';

export default [
  ...voxpelli(),
  {
    rules: {
      'func-style': ['warn', 'declaration', { allowArrowFunctions: true }],
    },
  },
  {
    ignores: ['coverage/**'],
  },
  {
    files: ['test/**'],
    rules: {
      'no-unused-expressions': 'off',
    },
  },
];
