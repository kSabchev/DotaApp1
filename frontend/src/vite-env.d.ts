/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Backend API base URL. Defaults to the local dev backend; set in production
  // (e.g. an empty string for same-origin, or a deployed host) via a .env file.
  readonly VITE_API_BASE?: string;
}
