// Graded hero↔hero scales for a draft. Each scale is a 0–10 grade plus the
// notable pairings behind it. Game matchups blend the hand-authored counter
// table with live OpenDota win-rate advantage (injected, so this stays pure).
import type { Hero } from './types';
import {
  getSynergyScore, getCounterScore, getLanePartnerScore,
  getLaneMatchupAdvantage, getMidMatchupNote, getSynergyPairs,
} from './interactions';

export type GameAdvFn = (heroId: number, enemyId: number) => number; // −5..+5, + = heroId favoured

export interface GradeEntry {
  aId: number; aName: string;
  bId: number; bName: string;
  grade: number;     // 0–10
  note?: string;
}

export interface ScaleSummary {
  key: 'synergy' | 'lanePartner' | 'laneMatchup' | 'gameMatchup';
  label: string;
  grade: number;     // 0–10 overall
  verdict: string;
  relative: boolean; // true ⇒ 5 is neutral (matchups); false ⇒ higher is just better
  entries: GradeEntry[];
}

export interface MatchupGrades {
  synergy: ScaleSummary;
  lanePartner: ScaleSummary;
  laneMatchup: ScaleSummary;
  gameMatchup: ScaleSummary;
  counteredBy: GradeEntry[]; // enemy → strongly counters one of my heroes
}

const clamp = (x: number, lo = 0, hi = 10) => Math.max(lo, Math.min(hi, x));

function verdictFor(g: number, relative: boolean): string {
  if (relative) {
    if (g >= 7) return 'Strong edge';
    if (g >= 5.7) return 'Favorable';
    if (g >= 4.3) return 'Even';
    if (g >= 3) return 'Unfavorable';
    return 'Hard matchup';
  }
  if (g >= 7) return 'Excellent';
  if (g >= 5) return 'Good';
  if (g >= 3) return 'Modest';
  return 'Thin';
}

export function gradeMatchups(
  myPicks: Hero[],
  enemyPicks: Hero[],
  gameAdv: GameAdvFn = () => 0,
): MatchupGrades {
  const name = (h: Hero) => h.displayName;

  // ── Synergy (my team internal) ──
  const synEntries: GradeEntry[] = [];
  let synSum = 0;
  const typedPairs = getSynergyPairs(myPicks.map(h => h.id));
  for (let i = 0; i < myPicks.length; i++) {
    for (let j = i + 1; j < myPicks.length; j++) {
      const s = getSynergyScore(myPicks[i].id, myPicks[j].id);
      if (s <= 0) continue;
      synSum += s;
      const tp = typedPairs.find(p =>
        (p.heroIds[0] === myPicks[i].id && p.heroIds[1] === myPicks[j].id) ||
        (p.heroIds[0] === myPicks[j].id && p.heroIds[1] === myPicks[i].id));
      synEntries.push({
        aId: myPicks[i].id, aName: name(myPicks[i]), bId: myPicks[j].id, bName: name(myPicks[j]),
        grade: clamp(s), note: tp?.reason,
      });
    }
  }
  synEntries.sort((a, b) => b.grade - a.grade);
  const synGrade = clamp(synSum / Math.max(1, myPicks.length));

  // ── Lane-partner synergy (best duos) ──
  const lpEntries: GradeEntry[] = [];
  for (let i = 0; i < myPicks.length; i++) {
    for (let j = i + 1; j < myPicks.length; j++) {
      const s = getLanePartnerScore(myPicks[i].id, myPicks[j].id);
      if (s <= 0) continue;
      lpEntries.push({
        aId: myPicks[i].id, aName: name(myPicks[i]), bId: myPicks[j].id, bName: name(myPicks[j]),
        grade: clamp(s),
      });
    }
  }
  lpEntries.sort((a, b) => b.grade - a.grade);
  const lpGrade = lpEntries.length ? lpEntries.slice(0, 2).reduce((a, e) => a + e.grade, 0) / Math.min(2, lpEntries.length) : 0;

  // ── Lane matchups (my hero vs enemy in lane) ──
  const laneEntries: GradeEntry[] = [];
  let laneSum = 0, laneCnt = 0;
  for (const me of myPicks) {
    for (const en of enemyPicks) {
      const adv = getLaneMatchupAdvantage(me.id, en.id);
      if (adv === 0) continue;
      laneSum += adv; laneCnt++;
      if (Math.abs(adv) >= 2) {
        laneEntries.push({
          aId: me.id, aName: name(me), bId: en.id, bName: name(en),
          grade: clamp(5 + adv),
          note: getMidMatchupNote(me.id, en.id) ??
            (adv > 0 ? `${name(me)} wins lane vs ${name(en)}` : `${name(me)} struggles vs ${name(en)}`),
        });
      }
    }
  }
  laneEntries.sort((a, b) => Math.abs(b.grade - 5) - Math.abs(a.grade - 5));
  const laneGrade = clamp(5 + (laneCnt ? laneSum / laneCnt : 0));

  // ── Game matchups (overall counters: static table + live win-rate) ──
  const gameEntries: GradeEntry[] = [];
  const counteredBy: GradeEntry[] = [];
  let gameSum = 0, gameCnt = 0;
  for (const me of myPicks) {
    for (const en of enemyPicks) {
      const myEdge = gameAdv(me.id, en.id) + getCounterScore(me.id, en.id) * 0.4;
      const theirEdge = gameAdv(en.id, me.id) + getCounterScore(en.id, me.id) * 0.4;
      const net = myEdge - theirEdge;
      gameSum += net; gameCnt++;
      if (myEdge >= 2) {
        gameEntries.push({
          aId: me.id, aName: name(me), bId: en.id, bName: name(en),
          grade: clamp(5 + myEdge), note: `${name(me)} counters ${name(en)}`,
        });
      }
      if (theirEdge >= 2) {
        counteredBy.push({
          aId: en.id, aName: name(en), bId: me.id, bName: name(me),
          grade: clamp(5 + theirEdge), note: `${name(en)} counters ${name(me)}`,
        });
      }
    }
  }
  gameEntries.sort((a, b) => b.grade - a.grade);
  counteredBy.sort((a, b) => b.grade - a.grade);
  const gameGrade = clamp(5 + (gameCnt ? gameSum / gameCnt : 0));

  return {
    synergy:     { key: 'synergy', label: 'Team Synergy', grade: synGrade, verdict: verdictFor(synGrade, false), relative: false, entries: synEntries.slice(0, 4) },
    lanePartner: { key: 'lanePartner', label: 'Lane Duos', grade: lpGrade, verdict: verdictFor(lpGrade, false), relative: false, entries: lpEntries.slice(0, 3) },
    laneMatchup: { key: 'laneMatchup', label: 'Lane vs Enemy', grade: laneGrade, verdict: verdictFor(laneGrade, true), relative: true, entries: laneEntries.slice(0, 4) },
    gameMatchup: { key: 'gameMatchup', label: 'Game Counters', grade: gameGrade, verdict: verdictFor(gameGrade, true), relative: true, entries: gameEntries.slice(0, 4) },
    counteredBy: counteredBy.slice(0, 4),
  };
}
