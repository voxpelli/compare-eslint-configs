import { defineConfig, globalIgnores } from 'eslint/config';
import { voxpelli } from '@voxpelli/eslint-config';

export default defineConfig(
  voxpelli(),
  globalIgnores(['coverage']),
  {
    rules: {
      'func-style': ['warn', 'declaration', { allowArrowFunctions: true }],
    },
  },
  {
    files: ['test/**'],
    rules: {
      'no-unused-expressions': 'off',
    },
  }
);
