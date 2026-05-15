import { ApiError } from "../lib/api";

describe("ApiError", () => {
  it("creates an instance with status and message", () => {
    const error = new ApiError("Not found", 404, "RESOURCE_NOT_FOUND");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe("Not found");
    expect(error.status).toBe(404);
    expect(error.code).toBe("RESOURCE_NOT_FOUND");
    expect(error.name).toBe("ApiError");
  });

  it("works without optional code and details", () => {
    const error = new ApiError("Server error", 500);

    expect(error.status).toBe(500);
    expect(error.code).toBeUndefined();
    expect(error.details).toBeUndefined();
  });

  it("stores details when provided", () => {
    const details = { field: "email" };
    const error = new ApiError("Validation error", 422, "VALIDATION_ERROR", details);

    expect(error.details).toEqual(details);
  });

  it("is catchable as a base Error", () => {
    expect(() => {
      throw new ApiError("Thrown", 400);
    }).toThrow("Thrown");
  });

  it("is distinguishable from a generic Error in a catch block", () => {
    let caught: unknown;
    try {
      throw new ApiError("Unauthorized", 401, "UNAUTHORIZED");
    } catch (e) {
      caught = e;
    }

    expect(caught instanceof ApiError).toBe(true);
    expect((caught as ApiError).status).toBe(401);
  });
});
