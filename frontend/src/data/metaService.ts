import { API_BASE as BACKEND } from '../config';

export type MetaTier = 'S' | 'contested' | 'strong' | 'niche' | 'normal';

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

// Boost added to ban threat ranking for top-meta heroes
export function metaBanBoost(heroId: number): { boost: number; note: string | undefined } {
  const meta = metaMap.get(heroId);
  if (!meta) return { boost: 0, note: undefined };

  const wr = Math.round(meta.highWinRate * 100);
  const pr = Math.round(meta.highPickRate * 100);

  if (meta.tier === 'S') {
    return { boost: 18, note: `S-tier in Immortal bracket — ${wr}% win rate, ${pr}% relative pick rate` };
  }
  if (meta.tier === 'contested') {
    return { boost: 10, note: `Highly contested in Immortal bracket — ${pr}% relative pick rate` };
  }
  if (meta.tier === 'strong') {
    return { boost: 4, note: `A-tier in Immortal bracket — ${wr}% win rate` };
  }
  return { boost: 0, note: undefined };
}
