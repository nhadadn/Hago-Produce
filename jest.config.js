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
    '<rootDir>/node_modules/',
    '<rootDir>/tests/',
    '<rootDir>/src/tests/integration/',
    '<rootDir>/DocumentacionHagoProduce/',
  ],
  collectCoverageFrom: [
    // Solo la capa de servicios — rutas API y componentes UI se cubren con E2E/integration
    'src/lib/services/**/*.ts',
    '!src/lib/services/**/*.d.ts',
    '!src/lib/services/**/__tests__/**',
  ],
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
