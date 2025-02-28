/** @type {import('jest').Config} */
const config = {
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
};

export default config;