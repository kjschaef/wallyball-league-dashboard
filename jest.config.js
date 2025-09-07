/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@\/(.*)$': '<rootDir>/$1',
    '^@db$': '<rootDir>/db',
    '^@db\/(.*)$': '<rootDir>/db/$1',
    '^next/server$': '<rootDir>/__mocks__/next-server.js'
  },
  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest'
  },
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
};
