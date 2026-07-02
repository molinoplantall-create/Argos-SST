export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'chore', 'docs', 'refactor', 'perf', 'style', 'test']
    ],
    'scope-enum': [
      0, // Let any scope be used, but optionally enforce if needed: 
         // [2, 'always', ['epp', 'inspections', 'auth']] 
    ]
  }
};
