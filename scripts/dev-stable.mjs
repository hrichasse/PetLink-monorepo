#!/usr/bin/env node
import { spawn } from "node:child_process";

const dev = spawn("npm", ["run", "dev"], {
  stdio: "inherit",
  env: process.env,
});

const warmup = spawn("npm", ["run", "warmup"], {
  stdio: "inherit",
  env: { ...process.env, WARMUP_DELAY_MS: process.env.WARMUP_DELAY_MS || "8000" },
});

const shutdown = (signal) => {
  dev.kill(signal);
  warmup.kill(signal);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

dev.on("exit", (code) => {
  if (!warmup.killed) warmup.kill("SIGTERM");
  process.exit(code ?? 0);
});

warmup.on("exit", () => {
  // Keep the long-running dev process attached after warmup completes.
});