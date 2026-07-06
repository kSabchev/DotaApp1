import { API_BASE } from '../config';
import { apiFetch } from './backendStatus';
import type { HeroProEntry } from '../../../shared/apiContracts';

export type { HeroProEntry };

const cache = new Map<number, HeroProEntry[]>();

/** Pro players who recently played this hero (with loadable match ids). */
export async function fetchHeroPros(heroId: number): Promise<HeroProEntry[]> {
  const cached = cache.get(heroId);
  if (cached) return cached;
  try {
    // apiFetch waits out a cold-start wake instead of failing once; the pros
    // route itself can be slow on first hit (upstream proPlayers fetch).
    const res = await apiFetch(`${API_BASE}/heroes/${heroId}/pros`, undefined, 20000);
    if (!res.ok) return [];
    const data = (await res.json()) as HeroProEntry[];
    const entries = Array.isArray(data) ? data : [];
    cache.set(heroId, entries);
    return entries;
  } catch {
    return [];
  }
}
