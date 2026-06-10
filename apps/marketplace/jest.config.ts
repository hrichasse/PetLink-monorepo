import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  setupFiles: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@petlink/shared/(.*)$": "<rootDir>/../../packages/shared/src/$1",
    "^@petlink/shared$": "<rootDir>/../../packages/shared/src/index.ts",
    "^@petlink/database$": "<rootDir>/../../packages/database/src/index.ts",
  },
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.test.json" }],
  },
};

export default config;
