
import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/server', '<rootDir>/client/src'],
  moduleNameMapper: {
    '^@db(.*)$': '<rootDir>/db$1',
    '^@/(.*)$': '<rootDir>/client/src/$1',
  },
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  setupFiles: ['<rootDir>/server/__tests__/setup.ts'],
};

export default config;
