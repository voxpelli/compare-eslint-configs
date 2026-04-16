import { voxpelli } from '@voxpelli/eslint-config';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  voxpelli({ noMocha: true }),

  {
    name: 'project/custom-rules',
    rules: {
      'func-style': ['warn', 'declaration', { allowArrowFunctions: true }],
    },
  },

  {
    name: 'project/test',
    files: ['test/**', 'packages/*/test/**'],
    rules: {
      'no-unused-expressions': 'off',
    },
  },
]);
