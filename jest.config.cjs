
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
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
      preset: 'ts-jest/presets/js-with-ts-esm',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/server/__tests__/**/*.test.ts'],
      moduleNameMapper: {
        '^@db$': '<rootDir>/db',
        '^@db/(.*)$': '<rootDir>/db/$1'
      },
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          isolatedModules: true,
          useESM: true
        }]
      },
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
      extensionsToTreatAsEsm: ['.ts', '.tsx']
    },
    
    // Client tests
    {
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
        '^.+\\.[tj]sx?$': ['babel-jest']
      },
      transformIgnorePatterns: [
        "/node_modules/(?!(@testing-library|recharts))/"
      ],
      setupFilesAfterEnv: ['<rootDir>/client/src/setupTests.ts']
    }
  ]
};
