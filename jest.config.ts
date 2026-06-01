import type { Config } from "jest";

const config: Config = {
  projects: [
    "<rootDir>/packages/shared/jest.config.ts",
    "<rootDir>/apps/auth/jest.config.ts",
    "<rootDir>/apps/pets/jest.config.ts",
    "<rootDir>/apps/marketplace/jest.config.ts",
    "<rootDir>/apps/web/jest.config.ts",
  ],
};

export default config;