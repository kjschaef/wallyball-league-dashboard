
import type { Config } from '@jest/types';

// Separate configurations for server and client tests
const config: Config.InitialOptions = {
  // Default timeout increased to 10s
  testTimeout: 10000,
  // Enable maxWorkers to improve speed
  maxWorkers: '50%',
  // Use cache to speed up execution
  cache: true,
  // Skip babel transforming node_modules
  transformIgnorePatterns: ['/node_modules/(?!(.+\\.jsx$)|(.+\\.tsx$))'],
  // Run tests in faster mode
  bail: 10,
  // Enable default coverage collection
  collectCoverage: false,
  // Show each test as it runs
  verbose: true,
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
      // Speed up ts-jest transformation
      globals: {
        'ts-jest': {
          isolatedModules: true,
          diagnostics: false
        }
      }
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
        '^.+\\.(js|jsx|ts|tsx)$': ['ts-jest', {
          isolatedModules: true,
          diagnostics: false
        }]
      },
      moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
    }
  ]
};

export default config;
