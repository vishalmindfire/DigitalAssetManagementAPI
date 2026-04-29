import type { Config } from 'jest';
const config: Config = {
  moduleNameMapper: {
    '^#index(\\.js)?$': '<rootDir>/src/index.ts',
  },
  modulePaths: ['<rootDir>/src/'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: './tsconfig.test.json',
      },
    ],
  },
};

export default config;
