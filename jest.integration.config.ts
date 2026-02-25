const nextJest = require('next/jest');
const createJestConfig = nextJest({ dir: './' });

const customJestConfig = {
  setupFiles: ['<rootDir>/src/tests/integration/env-setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/integration/setup.ts'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/*.integration.test.ts'],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  // No collectCoverage here unless explicitly asked, to avoid mixing with unit coverage
};

module.exports = createJestConfig(customJestConfig);
