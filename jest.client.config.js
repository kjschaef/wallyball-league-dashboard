/** 
 * Custom Jest configuration for client tests
 * Using babel-jest for JSX handling
 * @type {import('jest').Config} 
 */
module.exports = {
  displayName: 'client',
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/client/src/__tests__/**/*.test.{ts,tsx}'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '\\.css$': '<rootDir>/client/src/__mocks__/styleMock.js',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/client/src/__mocks__/fileMock.js',
    '^recharts$': '<rootDir>/client/src/__mocks__/rechartsMock.js',
    'chart.js/auto': '<rootDir>/client/src/__mocks__/chartMock.js'
  },
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-typescript', { isTSX: true, allExtensions: true }],
        ['@babel/preset-react', { runtime: 'automatic' }]
      ]
    }]
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(@testing-library|recharts))/"
  ],
  setupFilesAfterEnv: ['<rootDir>/client/src/setupTests.ts']
};