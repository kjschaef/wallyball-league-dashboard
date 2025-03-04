/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    // Add path aliases to match your tsconfig
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '^@db/(.*)$': '<rootDir>/db/$1',
  },
  // Separate test environments
  projects: [
    {
      displayName: 'backend',
      testMatch: ['<rootDir>/server/**/*.test.ts', '<rootDir>/db/**/*.test.ts'],
      testEnvironment: 'node',
      transform: {
        '^.+\\.tsx?$': ['ts-jest'],
      },
    },
    {
      displayName: 'frontend',
      testMatch: ['<rootDir>/client/src/**/*.test.tsx', '<rootDir>/client/src/**/*.test.ts'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
      transform: {
        '^.+\\.tsx?$': ['ts-jest'],
      },
    },
  ],
  // Coverage configuration
  collectCoverageFrom: [
    'server/**/*.ts',
    'db/**/*.ts',
    'client/src/**/*.{ts,tsx}',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageDirectory: 'coverage',
  transform: {
    '^.+\\.tsx?$': ['ts-jest'],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(drizzle-orm|drizzle-kit|drizzle-zod)/)',
  ]
};