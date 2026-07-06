// Cold-start handling for the free-tier backend (Render sleeps after ~15 min
// idle; waking takes 20–60 s). This module pings /health at page load so the
// wake starts immediately, tracks the backend state, and gives data services a
// fetch wrapper that waits out the wake window instead of failing once and
// leaving the session degraded.
import { useSyncExternalStore } from 'react';
import { API_BASE } from '../config';

export type BackendStatus = 'unknown' | 'waking' | 'ok' | 'down';

let status: BackendStatus = 'unknown';
const listeners = new Set<() => void>();
let readyPromise: Promise<boolean> | null = null;

function setStatus(next: BackendStatus): void {
  if (status === next) return;
  status = next;
  for (const l of listeners) l();
}

export function getBackendStatus(): BackendStatus {
  return status;
}

export function subscribeBackendStatus(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** React hook — re-renders when the backend status changes. */
export function useBackendStatus(): BackendStatus {
  return useSyncExternalStore(subscribeBackendStatus, getBackendStatus);
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

async function pingHealth(timeoutMs: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(timeoutMs) });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Start (or join) the wake-up: ping /health with retries until the backend
 * answers or the ~90 s budget runs out. Call once at page load — the first
 * request is what triggers Render to spin the instance up.
 */
export function warmBackend(): Promise<boolean> {
  if (status === 'ok') return Promise.resolve(true);
  if (readyPromise) return readyPromise;

  readyPromise = (async () => {
    // First attempt: generous timeout — on a warm backend this returns in <1s,
    // on a cold one this same request is what starts the wake.
    if (await pingHealth(12000)) { setStatus('ok'); return true; }
    setStatus('waking');
    // Retry while Render spins up (observed ~22s, allow up to ~90s total).
    const delays = [5000, 8000, 12000, 15000, 15000];
    for (const d of delays) {
      await sleep(d);
      if (await pingHealth(12000)) { setStatus('ok'); return true; }
    }
    setStatus('down');
    return false;
  })().finally(() => { readyPromise = null; });

  return readyPromise;
}

/** Resolves true once the backend is reachable (joining an in-flight wake). */
export function whenBackendReady(): Promise<boolean> {
  return status === 'ok' ? Promise.resolve(true) : warmBackend();
}

/**
 * fetch() for API calls that survives a cold start: normal fast path when the
 * backend is awake; on failure while it's waking, waits for the wake to finish
 * and retries once instead of surfacing a misleading error/empty state.
 */
export async function apiFetch(url: string, init?: RequestInit, timeoutMs = 10000): Promise<Response> {
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
    if (res.ok || status === 'ok') {
      if (res.ok) setStatus('ok');
      return res;
    }
    return res;
  } catch (err) {
    if (status === 'ok') throw err; // real error, backend is up
    const woke = await whenBackendReady();
    if (!woke) throw err;
    return fetch(url, { ...init, signal: AbortSignal.timeout(Math.max(timeoutMs, 15000)) });
  }
}
