module.exports = {
  projects: [
    {
      displayName: 'api',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/__tests__/api/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
      },
      transform: {
        '^.+\\.(ts|tsx)$': 'babel-jest',
      },
    },
    {
      displayName: 'components',
      testEnvironment: 'jsdom',
      testMatch: [
        '<rootDir>/__tests__/**/*.test.tsx',
        '<rootDir>/__tests__/**/*.test.ts',
      ],
      testPathIgnorePatterns: ['/__tests__/api/'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
      },
      transform: {
        '^.+\\.(ts|tsx)$': 'babel-jest',
      },
    },
  ],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    '!app/**/_*.{js,jsx,ts,tsx}',
    '!app/**/layout.{js,jsx,ts,tsx}',
    '!app/**/page.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
};
