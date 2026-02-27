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
    '<rootDir>/src/tests/integration/', // Integration tests (run via npm run test:integration)
    '<rootDir>/tests/', // Playwright tests
  ],
  testMatch: [
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/src/**/*.spec.ts',
  ],
  coveragePathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/DocumentacionHagoProduce/',
    '<rootDir>/src/app/',           // Pages y API routes (integration tests)
    '<rootDir>/src/components/',    // UI components (UI tests separados)
    '<rootDir>/src/tests/',         // Los tests mismos
    '<rootDir>/src/scripts/',       // Scripts CLI
    '<rootDir>/src/lib/validation/', // Schemas de validación (Zod/Yup)
    '<rootDir>/src/types/',         // Solo tipos TypeScript
    '<rootDir>/src/middleware.ts',  // Middleware de Next.js
  ],
  collectCoverageFrom: [
    '<rootDir>/src/lib/services/**/*.ts',
    '<rootDir>/src/lib/infrastructure/**/*.ts',
    '<rootDir>/src/lib/constants/**/*.ts',
    '!<rootDir>/src/lib/**/*.test.ts',
    '!<rootDir>/src/lib/**/*.spec.ts',
  ],
  coverageReporters: ['text', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
