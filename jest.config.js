// Jest configuration for mujAnon client tests
/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        strict: false,
      }
    }]
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testRegex: '\\.test\\.(ts|tsx)$',
  testPathIgnorePatterns: ['node_modules'],
  collectCoverageFrom: ['lib/moderation.ts'],
  coverageReporters: ['text'],
}

module.exports = config
