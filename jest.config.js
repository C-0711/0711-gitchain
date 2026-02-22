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
      displayName: "inject",
      testMatch: ["<rootDir>/packages/inject/test/**/*.test.ts"],
      transform: {
        "^.+\\.tsx?$": ["ts-jest", { useESM: true }],
      },
      extensionsToTreatAsEsm: [".ts"],
      moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
      },
    },
  ],
  collectCoverageFrom: [
    "packages/*/src/**/*.ts",
    "!**/*.d.ts",
  ],
};

module.exports = config;
