module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/src/**/*.test.(ts|tsx|js)'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
};