module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { isolatedModules: true }],
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  transformIgnorePatterns: [
    'node_modules/(?!(otplib|@otplib|@scure)/)',
  ],
  moduleNameMapper: {
    '^@krypton/database(.*)$': '<rootDir>/../../../packages/database/src$1',
    '^@krypton/types(.*)$': '<rootDir>/../../../packages/types/src$1',
    '^@krypton/utils(.*)$': '<rootDir>/../../../packages/utils/src$1',
  },
};
