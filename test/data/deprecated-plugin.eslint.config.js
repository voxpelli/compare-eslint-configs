/** @type {import('eslint').ESLint.Plugin} */
const fakePlugin = {
  meta: { name: 'eslint-plugin-fake' },
  rules: {
    'old-rule': {
      meta: {
        deprecated: {
          message: 'Use new-rule instead',
          replacedBy: [{ rule: { name: 'new-rule' }, message: 'Use new-rule instead' }],
          deprecatedSince: 'v1.0.0',
        },
        docs: { url: 'https://example.com/old-rule' },
      },
      create () { return {}; },
    },
    'ok-rule': {
      meta: { docs: {} },
      create () { return {}; },
    },
  },
};

export default [
  {
    plugins: { fake: fakePlugin },
    rules: { 'fake/old-rule': 'warn' },
  },
];
