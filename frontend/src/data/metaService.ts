import { API_BASE as BACKEND } from '../config';
import { apiFetch } from './backendStatus';

export type MetaTier = 'S' | 'contested' | 'strong' | 'niche' | 'normal';

// ─── Tournament meta (pro corpus artifact served by /api/meta/pro) ────────────

export interface ProHeroMeta {
  picks: number;
  bans: number;
  wins: number;
  pickRate: number;
  banRate: number;
  contestRate: number; // (picks + bans) / matches in the window
  winRate: number;
}

interface ProMetaFile {
  from: string;
  to: string;
  matches: number;
  leagues: number;
  windowDays: number;
  heroes: Record<number, ProHeroMeta>;
}

let proMeta: ProMetaFile | null = null;
let proLoading = false;

export function getProHeroMeta(heroId: number): ProHeroMeta | undefined {
  return proMeta?.heroes[heroId];
}

export function getProMetaWindow(): { from: string; to: string; matches: number; leagues: number } | null {
  return proMeta ? { from: proMeta.from, to: proMeta.to, matches: proMeta.matches, leagues: proMeta.leagues } : null;
}

export async function loadProMeta(): Promise<void> {
  if (proMeta || proLoading) return;
  proLoading = true;
  try {
    const res = await apiFetch(`${BACKEND}/meta/pro`);
    if (res.ok) proMeta = (await res.json()) as ProMetaFile;
  } catch {
    // Artifact missing / backend offline — tournament term simply won't apply.
  } finally {
    proLoading = false;
  }
}

export interface HeroMeta {
  heroId: number;
  tier: MetaTier;
  // High-bracket (Divine + Immortal) stats — best public proxy for pro meta
  highPick: number;
  highWin: number;
  highPickRate: number; // relative to max picks, 0-1
  highWinRate: number;  // 0-1
}

interface RawHeroStat {
  id: number;
  // Bracket 7 = Divine, 8 = Immortal
  '7_pick': number;
  '7_win': number;
  '8_pick': number;
  '8_win': number;
}

const metaMap = new Map<number, HeroMeta>();
let loaded = false;
let loading = false;

export function isMetaLoaded(): boolean {
  return loaded;
}

export function getHeroMeta(heroId: number): HeroMeta | undefined {
  return metaMap.get(heroId);
}

export const TIER_LABEL: Record<MetaTier, string> = {
  S: 'S',
  contested: 'CT',
  strong: 'A',
  niche: 'N',
  normal: '',
};

export const TIER_COLOR: Record<MetaTier, string> = {
  S: 'bg-yellow-500 text-black',
  contested: 'bg-red-600 text-white',
  strong: 'bg-blue-500 text-white',
  niche: 'bg-purple-600 text-white',
  normal: '',
};

export const TIER_TOOLTIP: Record<MetaTier, string> = {
  S: 'S-tier: dominant pick rate + win rate in Immortal bracket',
  contested: 'Contested: very high pick rate — frequently banned',
  strong: 'A-tier: strong win rate in high-bracket play',
  niche: 'Niche: low pick rate but exceptional win rate',
  normal: '',
};

function classify(pickRate: number, winRate: number): MetaTier {
  // pickRate is relative (0-1, 1 = the most-picked hero)
  if (pickRate > 0.5 && winRate > 0.53) return 'S';
  if (pickRate > 0.7) return 'contested';  // very popular even if win rate is lower
  if (pickRate > 0.3 && winRate > 0.53) return 'strong';
  if (pickRate < 0.1 && winRate > 0.56) return 'niche';
  if (winRate > 0.55 && pickRate > 0.05) return 'strong';
  return 'normal';
}

export async function loadMeta(): Promise<void> {
  if (loaded || loading) return;
  loading = true;

  try {
    const res = await fetch(`${BACKEND}/heroes/stats`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return;
    const raw: RawHeroStat[] = await res.json();

    // Combine Divine (7) + Immortal (8) brackets as proxy for top-level play
    const heroes = raw.map(h => ({
      id: h.id,
      highPick: (h['7_pick'] ?? 0) + (h['8_pick'] ?? 0),
      highWin:  (h['7_win']  ?? 0) + (h['8_win']  ?? 0),
    }));

    const maxPick = Math.max(...heroes.map(h => h.highPick), 1);

    for (const h of heroes) {
      const pickRate  = h.highPick / maxPick;
      const winRate   = h.highPick > 0 ? h.highWin / h.highPick : 0.5;
      metaMap.set(h.id, {
        heroId: h.id,
        tier: classify(pickRate, winRate),
        highPick: h.highPick,
        highWin:  h.highWin,
        highPickRate: pickRate,
        highWinRate:  winRate,
      });
    }
    loaded = true;
  } catch {
    // Silently fail — meta is enhancement only
  } finally {
    loading = false;
  }
}

// Boost added to pick suggestions for in-meta heroes — the pick-side counterpart
// of metaBanBoost. Graded continuously by relative pick rate (pros weigh the
// current meta heavily; the Section 7.5 evaluation measured what happens when
// this signal is absent). Note only above 50% so reasons stay high-signal.
export function metaPickBoost(heroId: number): { boost: number; note?: string } {
  const meta = metaMap.get(heroId);
  const pro = getProHeroMeta(heroId);

  // Pub term: relative Immortal-bracket pick rate (0–18).
  const pubBoost = meta ? Math.round(15 * meta.highPickRate) + (meta.tier === 'S' ? 3 : 0) : 0;
  // Tournament term: contest rate at recent pro events (0–8). What pro teams
  // pick and ban right now is the strongest available meta signal.
  const proBoost = pro ? Math.round(8 * pro.contestRate) : 0;
  const boost = pubBoost + proBoost;
  if (boost <= 0) return { boost: 0 };

  // One note, tournament-first: recent pro contest beats bracket popularity.
  let note: string | undefined;
  if (pro && pro.contestRate >= 0.5) {
    note = `Tournament meta — picked or banned in ${Math.round(pro.contestRate * 100)}% of recent pro drafts`;
  } else if (meta && meta.highPickRate >= 0.5) {
    const pr = Math.round(meta.highPickRate * 100);
    const wr = Math.round(meta.highWinRate * 100);
    note = meta.tier === 'S'
      ? `S-tier meta pick — ${wr}% win rate, ${pr}% relative pick rate`
      : `Meta staple — ${pr}% relative pick rate in Immortal bracket`;
  }
  return { boost, note };
}

// Boost added to ban threat ranking for top-meta heroes
export function metaBanBoost(heroId: number): { boost: number; note: string | undefined } {
  const meta = metaMap.get(heroId);
  const pro = getProHeroMeta(heroId);

  // Tournament term: heavily contested at recent pro events = prime ban target.
  const proBoost = pro ? Math.round(8 * pro.contestRate) : 0;
  const proNote = pro && pro.contestRate >= 0.5
    ? `Contested at recent tournaments — picked or banned in ${Math.round(pro.contestRate * 100)}% of pro drafts`
    : undefined;

  if (!meta) return { boost: proBoost, note: proNote };

  const wr = Math.round(meta.highWinRate * 100);
  const pr = Math.round(meta.highPickRate * 100);

  if (meta.tier === 'S') {
    return { boost: 18 + proBoost, note: proNote ?? `S-tier in Immortal bracket — ${wr}% win rate, ${pr}% relative pick rate` };
  }
  if (meta.tier === 'contested') {
    return { boost: 10 + proBoost, note: proNote ?? `Highly contested in Immortal bracket — ${pr}% relative pick rate` };
  }
  if (meta.tier === 'strong') {
    return { boost: 4 + proBoost, note: proNote ?? `A-tier in Immortal bracket — ${wr}% win rate` };
  }
  return { boost: proBoost, note: proNote };
}
