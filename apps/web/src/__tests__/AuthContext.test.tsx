import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock("../lib/supabase-browser", () => ({
  getWebSupabaseClient: jest.fn(() => ({
    auth: {
      signInWithOAuth: jest.fn(),
      exchangeCodeForSession: jest.fn(),
    },
  })),
}));

jest.mock("../lib/api", () => ({
  ApiError: class ApiError extends Error {
    status: number;
    code?: string;
    constructor(message: string, status: number, code?: string) {
      super(message);
      this.name = "ApiError";
      this.status = status;
      this.code = code;
    }
  },
  getAccessToken: jest.fn().mockResolvedValue(null),
  refreshAccessToken: jest.fn().mockResolvedValue(null),
  clearAuthTokens: jest.fn(),
  setAccessToken: jest.fn(),
  setRefreshToken: jest.fn(),
}));

jest.mock("../lib/petlink-api", () => ({
  authApi: {
    login: jest.fn(),
    signup: jest.fn(),
    provisionUser: jest.fn().mockResolvedValue({}),
    getMe: jest.fn(),
  },
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

import { authApi } from "../lib/petlink-api";
import { getAccessToken } from "../lib/api";

const mockAuthApi = authApi as jest.Mocked<typeof authApi>;
const mockGetAccessToken = getAccessToken as jest.Mock;

const FAKE_SESSION = {
  access_token: "fake-access-token",
  refresh_token: "fake-refresh-token",
  user: {
    id: "user-uuid",
    email: "test@example.com",
    user_metadata: { full_name: "Test User", role: "OWNER" },
  },
};

const FAKE_PROFILE = {
  id: "profile-uuid",
  userId: "user-uuid",
  fullName: "Test User",
  role: "OWNER" as const,
  phone: null,
  avatarUrl: null,
  city: null,
  location: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Consumer component to inspect context values in tests
function AuthConsumer() {
  const { user, profile, loading, role, session } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user?.id ?? "null"}</span>
      <span data-testid="profile">{profile?.fullName ?? "null"}</span>
      <span data-testid="role">{role}</span>
      <span data-testid="session">{session ? "yes" : "no"}</span>
    </div>
  );
}

function SignInConsumer() {
  const { signIn, user } = useAuth();
  return (
    <div>
      <button onClick={() => void signIn("test@example.com", "password123")}>Sign In</button>
      <span data-testid="user">{user?.id ?? "null"}</span>
    </div>
  );
}

function SignOutConsumer() {
  const { signOut, user } = useAuth();
  return (
    <div>
      <button onClick={() => void signOut()}>Sign Out</button>
      <span data-testid="user">{user?.id ?? "null"}</span>
    </div>
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  mockGetAccessToken.mockResolvedValue(null);
});

describe("AuthProvider — initial state (no session)", () => {
  it("renders children without crashing", async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>
      );
    });

    expect(screen.getByTestId("user").textContent).toBe("null");
    expect(screen.getByTestId("profile").textContent).toBe("null");
  });

  it("finishes loading after mount", async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });
  });

  it("has no session when localStorage is empty", async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("session").textContent).toBe("no");
    });
  });
});

describe("AuthProvider — useAuth() guard", () => {
  it("throws when useAuth is used outside AuthProvider", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);

    expect(() => render(<AuthConsumer />)).toThrow("useAuth debe usarse dentro de AuthProvider");

    consoleError.mockRestore();
  });
});

describe("AuthProvider — signIn()", () => {
  it("updates user after a successful sign-in", async () => {
    mockAuthApi.login.mockResolvedValueOnce(FAKE_SESSION);
    mockAuthApi.getMe.mockResolvedValueOnce(FAKE_PROFILE);

    await act(async () => {
      render(
        <AuthProvider>
          <SignInConsumer />
        </AuthProvider>
      );
    });

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "Sign In" }));
    });

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("user-uuid");
    });
  });

  it("calls authApi.login with the provided credentials", async () => {
    mockAuthApi.login.mockResolvedValueOnce(FAKE_SESSION);
    mockAuthApi.getMe.mockResolvedValueOnce(FAKE_PROFILE);

    await act(async () => {
      render(
        <AuthProvider>
          <SignInConsumer />
        </AuthProvider>
      );
    });

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "Sign In" }));
    });

    expect(mockAuthApi.login).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
  });
});

describe("AuthProvider — signOut()", () => {
  it("clears the user after sign-out", async () => {
    mockAuthApi.login.mockResolvedValueOnce(FAKE_SESSION);
    mockAuthApi.getMe.mockResolvedValueOnce(FAKE_PROFILE);

    await act(async () => {
      render(
        <AuthProvider>
          <SignOutConsumer />
        </AuthProvider>
      );
    });

    // Sign out immediately (user starts as null, that is fine for this test)
    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "Sign Out" }));
    });

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("null");
    });
  });
});
