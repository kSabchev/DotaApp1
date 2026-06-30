// Single source of truth for the backend API base URL.
// Override per-environment with VITE_API_BASE (Vite env var); falls back to the
// local dev backend. Use an empty string for same-origin deployments.
export const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3001/api';
