/** @type {import('jest').Config} */
const config = {
  displayName: 'client',
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/client/src/__tests__/**/*.test.{ts,tsx}'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '\\.(css|less|scss)$': '<rootDir>/client/src/__mocks__/styleMock.js',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/client/src/__mocks__/fileMock.js'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      isolatedModules: true,
      jsx: 'react-jsx'
    }]
  },
  transformIgnorePatterns: [
    "/node_modules/(?!@testing-library)/"
  ],
  setupFilesAfterEnv: ['<rootDir>/client/src/setupTests.ts'],
  globals: {
    'process.env.NODE_ENV': 'test'
  }
};

export default config;