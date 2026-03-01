/** @type {import("jest").Config} */
const config = {
  projects: [
    {
      displayName: "core",
      testMatch: ["<rootDir>/packages/core/test/**/*.test.ts"],
      transform: {
        "^.+\\.tsx?$": ["ts-jest", { useESM: true }],
      },
      extensionsToTreatAsEsm: [".ts"],
      moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
      },
    },
    {
      displayName: "chain",
      testMatch: ["<rootDir>/packages/chain/test/**/*.test.ts"],
      transform: {
        "^.+\\.tsx?$": ["ts-jest", { useESM: true }],
      },
      extensionsToTreatAsEsm: [".ts"],
      moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
      },
    },
    {
      displayName: "sdk",
      testMatch: ["<rootDir>/packages/sdk/test/**/*.test.ts"],
      transform: {
        "^.+\\.tsx?$": ["ts-jest", { useESM: true }],
      },
      extensionsToTreatAsEsm: [".ts"],
      moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
        "^@0711/core$": "<rootDir>/packages/core/src/index.ts",
      },
    },
    {
      displayName: "inject",
      testMatch: ["<rootDir>/packages/inject/test/**/*.test.ts"],
      transform: {
        "^.+\\.tsx?$": "ts-jest",
      },
      moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
        "^@0711/core$": "<rootDir>/packages/core/src/index.ts",
      },
    },
    {
      displayName: "git",
      testMatch: ["<rootDir>/packages/git/test/**/*.test.ts"],
      transform: {
        "^.+\\.tsx?$": ["ts-jest", { useESM: true }],
      },
      extensionsToTreatAsEsm: [".ts"],
      moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
      },
    },
    {
      displayName: "c2pa",
      testMatch: ["<rootDir>/packages/c2pa/test/**/*.test.ts"],
      transform: {
        "^.+\\.tsx?$": ["ts-jest", { useESM: true }],
      },
      extensionsToTreatAsEsm: [".ts"],
      moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
        "^@0711/core$": "<rootDir>/packages/core/src/index.ts",
      },
    },
    {
      displayName: "dpp",
      testMatch: ["<rootDir>/packages/dpp/test/**/*.test.ts"],
      transform: {
        "^.+\\.tsx?$": ["ts-jest", { useESM: true }],
      },
      extensionsToTreatAsEsm: [".ts"],
      moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
        "^@0711/core$": "<rootDir>/packages/core/src/index.ts",
      },
    },
  ],
  collectCoverageFrom: ["packages/*/src/**/*.ts", "!**/*.d.ts"],
};

module.exports = config;
