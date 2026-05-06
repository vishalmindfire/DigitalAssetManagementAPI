import type { Config } from 'jest';
const config: Config = {
  moduleNameMapper: {
    '^#(.+)\\.js$': '<rootDir>/src/$1.ts',
  },
  modulePaths: ['<rootDir>/src/'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        tsconfig: './tsconfig.test.json',
      },
    ],
  },
  transformIgnorePatterns: ['/node_modules/(?!uuid)'],
};

export default config;
