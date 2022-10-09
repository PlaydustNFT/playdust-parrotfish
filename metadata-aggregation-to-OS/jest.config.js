/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  moduleDirectories: [
    'node_modules',
    'src',
  ],
  //TODO optimize configuration of test coverage
  //coverageThreshold: {
  //  global: {
  //    //branches: 100,
  //    functions: 90,
  //    lines: 90,
  //    statements: 90,
  //  }
  //},
  verbose: true,
};