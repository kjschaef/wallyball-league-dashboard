
/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  // Basic configuration
  testTimeout: 10000,
  verbose: true,
  collectCoverage: false,
  passWithNoTests: true,
  
  // Projects to run
  projects: [
    // Server tests
    {
      displayName: 'server',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/server/__tests__/**/*.test.ts'],
      moduleNameMapper: {
        '^@db$': '<rootDir>/db',
        '^@db/(.*)$': '<rootDir>/db/$1'
      },
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          isolatedModules: true
        }]
      },
      globals: {
        'process.env.NODE_ENV': 'test'
      }
    },
    
    // Client tests
    {
      displayName: 'client',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/client/src/__tests__/**/*.test.{ts,tsx}'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/client/src/$1',
        '\\.(css|less|scss)$': '<rootDir>/client/src/__mocks__/styleMock.js',
        '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/client/src/__mocks__/fileMock.js'
      },
      transform: {
        '^.+\\.[tj]sx?$': ['ts-jest', {
          isolatedModules: true,
          tsconfig: 'tsconfig.json'
        }]
      },
      // Setup files to run before tests
      setupFilesAfterEnv: ['<rootDir>/client/src/setupTests.ts'],
      globals: {
        'process.env.NODE_ENV': 'test'
      }
    }
  ]
};
