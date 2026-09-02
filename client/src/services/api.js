import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '/api';

// ── Authenticated API (private routes — sends JWT) ─────────────────────────
const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every authenticated request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('igh_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401: clear stale token so app re-renders as logged-out
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('igh_token');
      localStorage.removeItem('igh_user');
    }
    return Promise.reject(error);
  }
);

// ── Public API (Steam / open routes — NEVER sends JWT) ────────────────────
// Using a separate instance means an expired token can NEVER break Steam data.
export const publicApi = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
});

export default api;
