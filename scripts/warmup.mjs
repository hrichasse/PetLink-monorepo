#!/usr/bin/env node
/**
 * Dev warm-up script: hits every critical API route on all local servers
 * so Next.js compiles them eagerly instead of lazily on first user request.
 *
 * Usage: node scripts/warmup.mjs
 * Or add to turbo dev pipeline as a post-start hook.
 */

const WARMUP_DELAY_MS = Number(process.env.WARMUP_DELAY_MS || 4000);

const ENDPOINTS = [
  // ── auth (3001) ──────────────────────────────────────
  "http://localhost:3001/api/v1",
  "http://localhost:3001/api/v1/users/me",

  // ── pets (3002) ──────────────────────────────────────
  "http://localhost:3002/api/v1",
  "http://localhost:3002/api/v1/pets",
  "http://localhost:3002/api/v1/announcements?isActive=true",
  "http://localhost:3002/api/v1/match",

  // ── marketplace (3003) ───────────────────────────────
  "http://localhost:3003/api/v1",
  "http://localhost:3003/api/v1/services?isActive=true",
  "http://localhost:3003/api/v1/veterinaries?isActive=true",
  "http://localhost:3003/api/v1/bookings?role=owner",
  "http://localhost:3003/api/v1/subscriptions/me",
];

async function ping(url) {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "petlink-warmup/1.0" },
    });
    const acceptableUnauthorized = res.status === 401;
    console.log(`  ${res.ok || acceptableUnauthorized ? "✓" : "⚠"} ${res.status} ${url}`);
  } catch (err) {
    console.log(`  ✗ ${url} — ${err.message}`);
  }
}

async function main() {
  console.log(`\n[warmup] Waiting ${WARMUP_DELAY_MS / 1000}s for servers to start…`);
  await new Promise((r) => setTimeout(r, WARMUP_DELAY_MS));

  console.log("[warmup] Pre-compiling API routes…\n");
  await Promise.all(ENDPOINTS.map(ping));
  console.log("\n[warmup] Done. All routes compiled and DB connection warm.\n");
}

main();
