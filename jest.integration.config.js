const nextJest = require('next/jest');
const createJestConfig = nextJest({ dir: './' });

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/src/tests/jest.setup.ts'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/DocumentacionHagoProduce/',
    '<rootDir>/tests/', // Playwright tests
  ],
  testMatch: [
    '<rootDir>/src/tests/integration/**/*.test.ts',
    '<rootDir>/src/tests/integration/**/*.integration.test.ts',
  ],
};

module.exports = createJestConfig(customJestConfig);
