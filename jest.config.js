const nextJest = require('next/jest');
const createJestConfig = nextJest({ dir: './' });

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/src/tests/jest.setup.ts'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
<<<<<<< HEAD
    '<rootDir>/DocumentacionHagoProduce/',
    '<rootDir>/src/tests/integration/', // Integration tests (run via npm run test:integration)
    '<rootDir>/tests/', // Playwright tests
  ],
  testMatch: [
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/src/**/*.test.tsx',
    '<rootDir>/src/**/*.spec.ts',
    '<rootDir>/src/**/*.spec.tsx',
  ],
  coveragePathIgnorePatterns: [
=======
>>>>>>> 19bb6b3c4a4f09e4ae422ff31bc4c91da60b50ab
    '<rootDir>/node_modules/',
    '<rootDir>/tests/',
    '<rootDir>/src/tests/integration/',
    '<rootDir>/DocumentacionHagoProduce/',
<<<<<<< HEAD
    '<rootDir>/src/app/',           // Pages y API routes (integration tests)
    '<rootDir>/src/tests/',         // Los tests mismos
    '<rootDir>/src/scripts/',       // Scripts CLI
    '<rootDir>/src/lib/validation/', // Schemas de validación (Zod/Yup)
    '<rootDir>/src/types/',         // Solo tipos TypeScript
    '<rootDir>/src/middleware.ts',  // Middleware de Next.js
=======
>>>>>>> 19bb6b3c4a4f09e4ae422ff31bc4c91da60b50ab
  ],
  collectCoverageFrom: [
    // Solo la capa de servicios — rutas API y componentes UI se cubren con E2E/integration
    'src/lib/services/**/*.ts',
    '!src/lib/services/**/*.d.ts',
    '!src/lib/services/**/__tests__/**',
  ],
  coverageReporters: ['text', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
