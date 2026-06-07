// In production (Vercel), frontend & API are on the same domain → use empty string (same origin).
// In local dev, VITE_API_URL is set or we fall back to localhost:3001.
const API_BASE = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "http://localhost:3001" : "");


function getToken(): string | null {
  return localStorage.getItem("toefl_token");
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(errorBody.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// Auth API
export const authApi = {
  register: (email: string, name: string, password: string) =>
    apiFetch<{ token: string; user: { id: string; email: string; name: string } }>(
      "/api/auth/register",
      { method: "POST", body: JSON.stringify({ email, name, password }) }
    ),

  login: (email: string, password: string) =>
    apiFetch<{ token: string; user: { id: string; email: string; name: string } }>(
      "/api/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) }
    ),

  me: () =>
    apiFetch<{ user: { id: string; email: string; name: string; createdAt: string } }>(
      "/api/auth/me"
    ),

  forgotPassword: (email: string) =>
    apiFetch<{ success: boolean; mockOtp?: string; message: string }>(
      "/api/auth/forgot-password",
      { method: "POST", body: JSON.stringify({ email }) }
    ),

  resetPassword: (email: string, otp: string, passwordNew: string) =>
    apiFetch<{ success: boolean; message: string }>(
      "/api/auth/reset-password",
      { method: "POST", body: JSON.stringify({ email, otp, newPassword: passwordNew }) }
    ),

  updateProfile: (data: { name?: string; currentPassword?: string; newPassword?: string }) =>
    apiFetch<{ success: boolean; token: string; user: { id: string; email: string; name: string } }>(
      "/api/auth/profile",
      { method: "PUT", body: JSON.stringify(data) }
    ),
};

// Results API
export const resultsApi = {
  save: (data: {
    testType: "full" | "listening" | "structure" | "reading";
    score: number;
    rawCorrect: number;
    totalQs: number;
    lScore?: number;
    sScore?: number;
    rScore?: number;
  }) =>
    apiFetch<{
      result: { id: string };
      xpEarned: number;
      streakBonus: number;
      newStreak: number;
    }>("/api/results", { method: "POST", body: JSON.stringify(data) }),

  list: () =>
    apiFetch<{
      results: Array<{
        id: string;
        testType: string;
        score: number;
        rawCorrect: number;
        totalQs: number;
        xpEarned: number;
        createdAt: string;
      }>;
    }>("/api/results"),
};

// Leaderboard API
export const leaderboardApi = {
  top: () =>
    apiFetch<{
      leaderboard: Array<{
        rank: number;
        name: string;
        email: string;
        bestScore: number;
        totalXp: number;
        testsCount: number;
        currentStreak: number;
        hasFullTest: boolean;
      }>;
    }>("/api/leaderboard"),

  myRank: () =>
    apiFetch<{ rank: number | null; total: number }>("/api/leaderboard/me"),
};

// Progress API
export const progressApi = {
  get: () =>
    apiFetch<{
      progress: {
        totalXp: number;
        currentStreak: number;
        longestStreak: number;
        testsCount: number;
        bestScore: number;
        lastActiveAt: string | null;
        level: number;
        xpInCurrentLevel: number;
        xpToNextLevel: number;
      };
      recentResults: Array<{
        id: string;
        testType: string;
        score: number;
        rawCorrect: number;
        totalQs: number;
        xpEarned: number;
        createdAt: string;
      }>;
    }>("/api/progress"),
};
