
import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/server'],
  moduleNameMapper: {
    '^@db(.*)$': '<rootDir>/db$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
};

export default config;
