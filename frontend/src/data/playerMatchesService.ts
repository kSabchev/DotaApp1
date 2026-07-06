import { API_BASE } from '../config';
import { apiFetch } from './backendStatus';
import type { RecentMatchSummary } from '../../../shared/apiContracts';

export type { RecentMatchSummary };

/** A player's last 10 games via the backend proxy. [] when unavailable/private. */
export async function fetchRecentMatches(accountId: number): Promise<RecentMatchSummary[]> {
  const res = await apiFetch(`${API_BASE}/players/${accountId}/matches`);
  if (!res.ok) throw new Error(res.status === 400 ? 'Invalid Friend ID' : `HTTP ${res.status}`);
  const data = (await res.json()) as RecentMatchSummary[];
  return Array.isArray(data) ? data : [];
}
