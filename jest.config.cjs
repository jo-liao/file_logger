/* eslint-disable @typescript-eslint/no-var-requires */
const { defaults } = require('ts-jest/presets');

module.exports = {
    ...defaults,
    coverageDirectory: 'coverage',
    testEnvironment: 'node',
    moduleFileExtensions: ['ts', 'tsx', 'js'],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },
    testMatch: ['**/src/**/*.test.(ts|tsx)'],
};
