import { API_BASE } from '../config';
import type { HeroProEntry } from '../../../shared/apiContracts';

export type { HeroProEntry };

const cache = new Map<number, HeroProEntry[]>();

/** Pro players who recently played this hero (with loadable match ids). */
export async function fetchHeroPros(heroId: number): Promise<HeroProEntry[]> {
  const cached = cache.get(heroId);
  if (cached) return cached;
  try {
    const res = await fetch(`${API_BASE}/heroes/${heroId}/pros`);
    if (!res.ok) return [];
    const data = (await res.json()) as HeroProEntry[];
    const entries = Array.isArray(data) ? data : [];
    cache.set(heroId, entries);
    return entries;
  } catch {
    return [];
  }
}
