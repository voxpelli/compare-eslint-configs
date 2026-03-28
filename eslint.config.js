import { defineConfig } from 'eslint/config';
import { voxpelli } from '@voxpelli/eslint-config';

export default defineConfig([
  voxpelli({ ignores: ['coverage/**'], noMocha: true }),

  {
    name: 'project/custom-rules',
    rules: {
      'func-style': ['warn', 'declaration', { allowArrowFunctions: true }],
    },
  },

  {
    name: 'project/test',
    files: ['test/**'],
    rules: {
      'no-unused-expressions': 'off',
    },
  },
]);
