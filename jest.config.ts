
import type { Config } from '@jest/types';

// Separate configurations for server and client tests
const config: Config.InitialOptions = {
  // Shorter timeout for faster failures
  testTimeout: 5000,
  
  // Enable parallel tests by default for speed,
  // but allow overriding with --runInBand for debugging
  maxWorkers: process.env.CI ? 2 : '50%',
  
  // Enable cache for faster repeat runs
  cache: true,
  
  // Skip unnecessary transformations
  transformIgnorePatterns: ['/node_modules/(?!(.+\\.jsx$)|(.+\\.tsx$))'],
  
  // Faster test runs by stopping after first failures
  bail: 1,
  
  // Skip coverage by default for speed
  collectCoverage: false,
  
  // Show concise output
  verbose: true,
  
  // Fast fail when tests take too long
  slowTestThreshold: 3,
  
  // Don't try to auto-detect test paths
  testPathIgnorePatterns: ['/node_modules/'],
  
  // Use passWithNoTests to handle empty test suites gracefully
  passWithNoTests: true,
  
  // Projects configuration
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
      // Speed up ts-jest transformation significantly
      globals: {
        'ts-jest': {
          isolatedModules: true,
          diagnostics: false,
          // Skip type checking for much faster tests
          tsconfig: {
            skipLibCheck: true,
            sourceMap: false
          }
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
        // Mock CSS and image imports for faster tests
        '\\.(css|less|scss|sass)$': '<rootDir>/client/src/__mocks__/styleMock.js',
        '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/client/src/__mocks__/fileMock.js'
      },
      testMatch: ['<rootDir>/client/src/__tests__/**/*.test.[jt]s?(x)'],
      setupFilesAfterEnv: ['<rootDir>/client/src/setupTests.ts'],
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': ['ts-jest', {
          isolatedModules: true,
          diagnostics: false,
          // Skip type checking for speed
          tsconfig: {
            skipLibCheck: true,
            sourceMap: false
          }
        }]
      },
      moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
    }
  ]
};

export default config;
