/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/app/components/$1',
    '^@/lib/(seasons|rag)$': '<rootDir>/lib/$1',
    '^@/lib/(.*)$': '<rootDir>/app/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/app/hooks/$1',
    '^@/(.*)$': '<rootDir>/$1',
    '^@db$': '<rootDir>/db',
    '^@db/(.*)$': '<rootDir>/db/$1',
    '^next/server$': '<rootDir>/__mocks__/next-server.js'
  },
  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest'
  },
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/tests/e2e/', '<rootDir>/\\.worktree'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
};
