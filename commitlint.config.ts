import { UserConfig } from '@commitlint/types';

const Configuration: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-case': [2, 'always', 'lower-case'],
    'subject-max-length': [2, 'always', 72],
    'type-enum': [2, 'always', ['feature', 'fix', 'docs', 'chore', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'revert', 'setup']],
  },
};

export default Configuration;
