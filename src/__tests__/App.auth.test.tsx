import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { ComponentType } from "react";

const {
  mockDispatch,
  mockSignInWithCustomToken,
  mockOnAuthStateChanged,
  mockGetAccessTokenSilently,
  mockGetIdTokenClaims,
  mockLoginWithRedirect,
  mockSetUser,
  mockUpdateAbility,
  mockSentrySetUser,
  mockAuth,
} = vi.hoisted(() => ({
  mockDispatch: vi.fn(),
  mockSignInWithCustomToken: vi.fn(),
  mockOnAuthStateChanged: vi.fn(),
  mockGetAccessTokenSilently: vi.fn(),
  mockGetIdTokenClaims: vi.fn(),
  mockLoginWithRedirect: vi.fn(),
  mockSetUser: vi.fn(),
  mockUpdateAbility: vi.fn(),
  mockSentrySetUser: vi.fn(),
  mockAuth: { currentUser: null as null | { uid: string } },
}));
let auth0State: any;
let App: ComponentType;

vi.mock("@auth0/auth0-react", () => ({
  useAuth0: vi.fn(() => auth0State),
}));

vi.mock("config/firebase/firebase", () => ({
  auth: mockAuth,
  db: {},
}));

vi.mock("firebase/auth", () => ({
  signInWithCustomToken: (...args: any[]) => mockSignInWithCustomToken(...args),
  onAuthStateChanged: (...args: any[]) => mockOnAuthStateChanged(...args),
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(() => ({})),
  onSnapshot: vi.fn(() => vi.fn()),
}));

vi.mock("react-redux", () => ({
  useDispatch: vi.fn(() => mockDispatch),
}));

vi.mock("config/redux/user/user", () => ({
  setUser: (...args: any[]) => mockSetUser(...args),
}));

vi.mock("config/firebase/collections", () => ({
  usersCollection: "users",
}));

vi.mock("components/navigation/NavigationMenu", () => ({
  default: () => <div data-testid="nav-menu" />,
}));

vi.mock("util/UserPermission", () => ({
  updateAbility: (...args: any[]) => mockUpdateAbility(...args),
}));

vi.mock("config/casl/ability", () => ({
  ability: {},
}));

vi.mock("@sentry/react", () => ({
  setUser: (...args: any[]) => mockSentrySetUser(...args),
}));

vi.mock("react-i18next", () => ({
  useTranslation: vi.fn(() => ({ i18n: { language: "en" } })),
}));

vi.mock("config/i18n/i18n", () => ({
  default: { t: vi.fn((key: string) => key) },
}));

describe("App auth bootstrap", () => {
  const claim = "https://mat.cevi.tools/firebase_token";

  beforeAll(async () => {
    ({ default: App } = await import("App"));
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.currentUser = null;
    mockOnAuthStateChanged.mockImplementation(() => vi.fn());
    mockSetUser.mockReturnValue({ type: "set-user" });
    mockGetAccessTokenSilently.mockResolvedValue("token");
    mockGetIdTokenClaims.mockResolvedValue({});
    mockLoginWithRedirect.mockResolvedValue(undefined);

    auth0State = {
      user: { [claim]: "token-1" },
      isAuthenticated: true,
      isLoading: false,
      getAccessTokenSilently: mockGetAccessTokenSilently,
      getIdTokenClaims: mockGetIdTokenClaims,
      loginWithRedirect: mockLoginWithRedirect,
    };
  });

  it("signs in once with a valid token and does not repeat for same token on rerender", async () => {
    mockSignInWithCustomToken.mockResolvedValueOnce({ user: { uid: "u1" } });

    const { rerender } = render(<App />);

    await waitFor(() => {
      expect(mockSignInWithCustomToken).toHaveBeenCalledTimes(1);
    });
    expect(mockSignInWithCustomToken).toHaveBeenCalledWith(mockAuth, "token-1");

    rerender(<App />);

    await waitFor(() => {
      expect(mockSignInWithCustomToken).toHaveBeenCalledTimes(1);
    });
  });

  it("refreshes Auth0 claims and retries once when token is invalid", async () => {
    mockSignInWithCustomToken
      .mockRejectedValueOnce({ code: "auth/invalid-custom-token" })
      .mockResolvedValueOnce({ user: { uid: "u1" } });
    mockGetIdTokenClaims.mockResolvedValueOnce({ [claim]: "token-2" });

    render(<App />);

    await waitFor(() => {
      expect(mockSignInWithCustomToken).toHaveBeenCalledTimes(2);
    });
    expect(mockGetAccessTokenSilently).toHaveBeenCalledWith({
      cacheMode: "off",
    });
    expect(mockSignInWithCustomToken).toHaveBeenNthCalledWith(
      1,
      mockAuth,
      "token-1"
    );
    expect(mockSignInWithCustomToken).toHaveBeenNthCalledWith(
      2,
      mockAuth,
      "token-2"
    );
    expect(mockLoginWithRedirect).not.toHaveBeenCalled();
  });

  it("redirects to login when refreshed claim has no firebase token", async () => {
    window.history.pushState({}, "", "/abteilungen/test?foo=bar#section");
    mockSignInWithCustomToken.mockRejectedValueOnce({
      code: "auth/invalid-custom-token",
    });
    mockGetIdTokenClaims.mockResolvedValueOnce({});

    render(<App />);

    await waitFor(() => {
      expect(mockLoginWithRedirect).toHaveBeenCalledTimes(1);
    });
    expect(mockLoginWithRedirect).toHaveBeenCalledWith({
      appState: { returnTo: "/abteilungen/test?foo=bar#section" },
    });
  });

  it("redirects to login when retry also fails", async () => {
    mockSignInWithCustomToken
      .mockRejectedValueOnce({ code: "auth/invalid-custom-token" })
      .mockRejectedValueOnce({ code: "auth/invalid-custom-token" });
    mockGetIdTokenClaims.mockResolvedValueOnce({ [claim]: "token-2" });

    render(<App />);

    await waitFor(() => {
      expect(mockLoginWithRedirect).toHaveBeenCalledTimes(1);
    });
  });
});
