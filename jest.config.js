const { version } = require('./package.json');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Same identifier tsup.config.js defines at build time.
  globals: { __SDK_VERSION__: version },
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
