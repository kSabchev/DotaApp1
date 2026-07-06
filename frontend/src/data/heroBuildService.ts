// Fetches each hero's typical item build (by game phase) from OpenDota's
// itemPopularity, resolving numeric item ids to names/icons via the backend's
// item-constants map. Cached per hero for the session.
import { itemIconUrl } from '../../../shared/items';
import { API_BASE as BACKEND } from '../config';
import { apiFetch } from './backendStatus';

export interface BuildItem {
  id: number;
  key: string;
  name: string;
  iconUrl: string;
  count: number;
}
export interface HeroBuild {
  start: BuildItem[];
  early: BuildItem[];
  mid: BuildItem[];
  late: BuildItem[];
}

// Consumables / throwaway starting items — excluded so the build shows real items.
const CONSUMABLE_KEYS = new Set([
  'tango', 'tango_single', 'flask', 'clarity', 'enchanted_mango', 'faerie_fire',
  'branches', 'iron_branch', 'tpscroll', 'ward_observer', 'ward_sentry', 'ward_dispenser',
  'dust', 'smoke_of_deceit', 'tome_of_knowledge', 'bottle',
]);

let constants: Record<number, { key: string; name: string }> | null = null;
const buildCache = new Map<number, HeroBuild | null>();

export function getItemConstants(): Record<number, { key: string; name: string }> | null {
  return constants;
}

export async function loadItemConstants(): Promise<void> {
  if (constants) return;
  try {
    const r = await apiFetch(`${BACKEND}/items`);
    if (r.ok) constants = await r.json();
  } catch { /* offline — builds simply won't show */ }
}

function topItems(obj: Record<string, number> | undefined, n: number): BuildItem[] {
  if (!obj || !constants) return [];
  return Object.entries(obj)
    .map(([id, count]) => ({ id: Number(id), count: Number(count) }))
    .sort((a, b) => b.count - a.count)
    .map(({ id, count }) => {
      const c = constants![id];
      if (!c || c.key.startsWith('recipe') || CONSUMABLE_KEYS.has(c.key)) return null;
      return { id, key: c.key, name: c.name, iconUrl: itemIconUrl(c.key), count };
    })
    .filter(Boolean)
    .slice(0, n) as BuildItem[];
}

export async function getHeroBuild(heroId: number): Promise<HeroBuild | null> {
  await loadItemConstants();
  if (buildCache.has(heroId)) return buildCache.get(heroId)!;
  try {
    const r = await apiFetch(`${BACKEND}/heroes/${heroId}/items`);
    if (!r.ok) { buildCache.set(heroId, null); return null; }
    const d = await r.json();
    const build: HeroBuild = {
      start: topItems(d.start_game_items, 3),
      early: topItems(d.early_game_items, 3),
      mid: topItems(d.mid_game_items, 4),
      late: topItems(d.late_game_items, 3),
    };
    buildCache.set(heroId, build);
    return build;
  } catch {
    buildCache.set(heroId, null);
    return null;
  }
}
