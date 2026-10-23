const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const getAuthToken = () => localStorage.getItem("token");

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem("token", token);
  } else {
    localStorage.removeItem("token");
  }
};

export const getStoredUser = () => {
  const user = localStorage.getItem("user");
  try {
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
  } else {
    localStorage.removeItem("user");
  }
};

export async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage =
      data?.message || (typeof data === "string" ? data : "Request failed");
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// Authentication APIs
export const registerApi = (name, email, password) =>
  apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });

export const loginApi = (email, password) =>
  apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

// Activity APIs
export const logActivityApi = ({ action, meta, ipAddress }) =>
  apiRequest("/activity", {
    method: "POST",
    body: JSON.stringify({ action, meta, ipAddress }),
  });

export const getActivityStatsApi = () => apiRequest("/activity/stats");

export const getSuspiciousActivityApi = () =>
  apiRequest("/activity/suspicious");

export const checkReplayApi = ({ action, clientTime, ipAddress }) =>
  apiRequest("/activity/replay-check", {
    method: "POST",
    body: JSON.stringify({ action, clientTime, ipAddress }),
  });
