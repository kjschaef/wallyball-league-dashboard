
import type { Config } from '@jest/types';

// Separate configurations for server and client tests
const config: Config.InitialOptions = {
  projects: [
    // Server tests configuration
    {
      displayName: 'server',
      preset: 'ts-jest',
      testEnvironment: 'node',
      roots: ['<rootDir>/server'],
      moduleNameMapper: {
        '^@db(.*)$': '<rootDir>/db$1',
      },
      testMatch: ['<rootDir>/server/__tests__/**/*.test.ts'],
      setupFiles: ['<rootDir>/server/__tests__/setup.ts'],
      // Add timeout to prevent hanging tests
      testTimeout: 5000,
    },
    // Client tests configuration
    {
      displayName: 'client',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      roots: ['<rootDir>/client/src'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/client/src/$1',
      },
      testMatch: ['<rootDir>/client/src/__tests__/**/*.test.[jt]s?(x)'],
      setupFilesAfterEnv: ['<rootDir>/client/src/setupTests.ts'],
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': 'ts-jest'
      },
      moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
    }
  ]
};

export default config;
