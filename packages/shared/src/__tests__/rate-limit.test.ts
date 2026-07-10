import type { NextRequest } from "next/server";

import { consumeRateLimit, getClientIp } from "../middleware/rate-limit";

// Each test uses a unique bucket so the module-level in-memory store does not
// leak state between cases.
let bucketCounter = 0;
const uniqueBucket = () => `test:bucket:${bucketCounter++}`;

const requestWithHeaders = (headers: Record<string, string>): NextRequest =>
  ({ headers: new Headers(headers) } as unknown as NextRequest);

describe("consumeRateLimit", () => {
  it("allows requests up to the limit and blocks the rest", () => {
    const options = { bucket: uniqueBucket(), limit: 3, windowMs: 60_000 };

    const first = consumeRateLimit("ip-1", options);
    const second = consumeRateLimit("ip-1", options);
    const third = consumeRateLimit("ip-1", options);
    const fourth = consumeRateLimit("ip-1", options);

    expect(first).toMatchObject({ allowed: true, remaining: 2 });
    expect(second).toMatchObject({ allowed: true, remaining: 1 });
    expect(third).toMatchObject({ allowed: true, remaining: 0 });
    expect(fourth.allowed).toBe(false);
    expect(fourth.remaining).toBe(0);
    expect(fourth.retryAfterMs).toBeGreaterThan(0);
  });

  it("tracks identifiers independently", () => {
    const options = { bucket: uniqueBucket(), limit: 1, windowMs: 60_000 };

    expect(consumeRateLimit("ip-a", options).allowed).toBe(true);
    expect(consumeRateLimit("ip-a", options).allowed).toBe(false);
    // A different identifier is unaffected by ip-a hitting its limit.
    expect(consumeRateLimit("ip-b", options).allowed).toBe(true);
  });

  it("resets the window after windowMs elapses", () => {
    jest.useFakeTimers();
    try {
      const options = { bucket: uniqueBucket(), limit: 1, windowMs: 1_000 };

      expect(consumeRateLimit("ip-1", options).allowed).toBe(true);
      expect(consumeRateLimit("ip-1", options).allowed).toBe(false);

      jest.advanceTimersByTime(1_001);

      expect(consumeRateLimit("ip-1", options).allowed).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe("getClientIp", () => {
  it("uses the first entry of x-forwarded-for", () => {
    const request = requestWithHeaders({ "x-forwarded-for": "203.0.113.5, 70.41.3.18" });
    expect(getClientIp(request)).toBe("203.0.113.5");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const request = requestWithHeaders({ "x-real-ip": "198.51.100.7" });
    expect(getClientIp(request)).toBe("198.51.100.7");
  });

  it("returns 'unknown' when no ip headers are present", () => {
    expect(getClientIp(requestWithHeaders({}))).toBe("unknown");
  });
});
