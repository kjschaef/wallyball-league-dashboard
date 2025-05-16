
module.exports = {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '^@db/(.*)$': '<rootDir>/db/$1',
    '^@db$': '<rootDir>/db/index.ts'
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'babel-jest'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleDirectories: ['node_modules', '<rootDir>'],
  transformIgnorePatterns: [
    'node_modules/(?!(@tanstack|wouter)/)'
  ],
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ]
};
