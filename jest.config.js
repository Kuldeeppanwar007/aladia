const path = require('path');

module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@app/common/core(.*)$': '<rootDir>/common/core/src$1',
    '^@app/common/config(.*)$': '<rootDir>/common/config/src$1',
    '^@app/common/(.*)$': '<rootDir>/common/$1',
    '^@app/(.*)$': '<rootDir>/apps/$1',
  },
};
