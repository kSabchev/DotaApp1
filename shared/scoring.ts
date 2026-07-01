import type {
  CapabilityAxisId, CapabilityProfile, ComboCallout, DraftHealthReport, DraftSlot, DraftTeam, GamePlanPhase, GamePlanTimeline,
  HealthNote, HealthRating, Hero, HeroRecommendation, LanePrediction, LaneMatchupResult,
  LaneVerdictResult, MetaRole, PickContext, PickTiming, PowerWindow, Role, SynergyPair,
  TeamAnalysis, TempoStance, UtilityTag, VerdictRating, WinConditionId, WinConditionResult,
} from './types';
import { HEROES as LOCAL_HEROES } from './heroes';
import {
  INTERACTIONS, getCounterReasons, getLaneMatchupAdvantage as handLaneAdv,
  getLanePartnerScore, getMidMatchupNote, getSynergyPairs, getSynergyReasons,
} from './interactions';
import { analyzeHeroFreedom, getHeroFragility } from './heroFreedom';
import { computeTeamCapabilities, CAPABILITY_ORDER, CAPABILITY_LABELS } from './capabilities';
import { computeTeamTraits, damageTypeOf, spaceRoleOf } from './heroTraits';

export type BanThreatUrgency = 'critical' | 'high' | 'medium';

export interface BanThreat {
  heroId: number;
  score: number;
  urgency: BanThreatUrgency;
  reasons: string[];
  winRateNote?: string;
}

// Live data the frontend injects (OpenDota matchup win rates + meta tiers).
// In Node/backtest contexts these default to no-ops so scoring stays pure.
export interface ScoringDeps {
  getApiCounterThreats?: (
    myPickIds: number[], availableIds: number[], topN: number,
  ) => { heroId: number; score: number; winRateNote: string }[];
  metaBanBoost?: (heroId: number) => { boost: number; note: string | undefined };
}

const NO_API_THREATS: NonNullable<ScoringDeps['getApiCounterThreats']> = () => [];
const NO_META_BOOST: NonNullable<ScoringDeps['metaBanBoost']> = () => ({ boost: 0, note: undefined });

// ─── Live matchup data (the "quantitative" layer) ─────────────────────────────
//
// The frontend registers an OpenDota win-rate advantage provider once on boot
// (matchupService). Below a games threshold the provider returns 0, so confident
// fresh win rates carry the matchup signal while the hand-authored table stays as
// the explanatory "why". In Node/backtest no provider is registered → pure hand data.
type MatchupAdvProvider = (heroId: number, enemyId: number) => number;
let liveMatchupProvider: MatchupAdvProvider | null = null;

export function setLiveMatchupProvider(fn: MatchupAdvProvider | null): void {
  liveMatchupProvider = fn;
}

// True when confident live win-rate data exists for this matchup (drives provenance).
function hasLiveAdv(a: number, b: number): boolean {
  return !!liveMatchupProvider && liveMatchupProvider(a, b) !== 0;
}

// Blended head-to-head advantage of `a` vs `b` (−5..+5). Hand data is the floor;
// when confident live data exists it dominates (0.65) but the hand sign/“why” remains.
function matchupAdvantage(a: number, b: number): number {
  const hand = handLaneAdv(a, b);
  const live = liveMatchupProvider ? liveMatchupProvider(a, b) : 0;
  if (live === 0) return hand;
  return Math.max(-5, Math.min(5, Math.round(0.35 * hand + 0.65 * live)));
}

// ─── Internal helpers ────────────────────────────────────────────────────────

const META_TO_ROLE: Record<MetaRole, Role> = {
  pos1: 'carry', pos2: 'mid', pos3: 'offlane',
  pos4: 'support', pos5: 'hard_support', flex: 'support',
};

function effectiveRole(hero: Hero, assignments: Record<number, Role>): Role {
  if (assignments[hero.id]) return assignments[hero.id];
  if (hero.metaRole) return META_TO_ROLE[hero.metaRole];
  return hero.preferredRoles[0] ?? 'carry';
}

const ROLE_LIST: Role[] = ['carry', 'mid', 'offlane', 'support', 'hard_support'];

// How well a hero fits a position (higher = better).
function roleFitScore(hero: Hero, role: Role): number {
  let s = 0;
  if (hero.metaRole && META_TO_ROLE[hero.metaRole] === role) s += 4;
  if (hero.preferredRoles?.includes(role)) s += 2;
  if (hero.flexRoles?.includes(role)) s += 1;
  return s;
}

function permutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const p of permutations(rest)) out.push([arr[i], ...p]);
  }
  return out;
}

// Best 1:1 assignment of up to 5 heroes to the 5 positions, maximising total fit.
// Used to seed sensible roles for imported drafts (OpenDota carries no lane data),
// so each position is filled exactly once instead of leaving duplicate metaRoles.
export function inferRoles(heroes: Hero[]): Record<number, Role> {
  const picks = heroes.slice(0, 5);
  const result: Record<number, Role> = {};
  if (picks.length === 0) return result;

  let best: { order: Role[]; score: number } | null = null;
  for (const roleOrder of permutations(ROLE_LIST)) {
    let score = 0;
    for (let i = 0; i < picks.length; i++) score += roleFitScore(picks[i], roleOrder[i]);
    if (!best || score > best.score) best = { order: roleOrder, score };
  }
  picks.forEach((h, i) => { result[h.id] = best!.order[i]; });
  return result;
}

// The set of positions a hero can plausibly play. A user-assigned role locks it to
// that one; otherwise it's preferred ∪ flex ∪ metaRole — this is what lets the
// coverage solver understand flex picks instead of pinning one role per hero.
function roleOptions(hero: Hero, assignments: Record<number, Role>): Role[] {
  if (assignments[hero.id]) return [assignments[hero.id]];
  const set = new Set<Role>();
  for (const r of hero.preferredRoles ?? []) set.add(r);
  for (const r of hero.flexRoles ?? []) set.add(r);
  if (hero.metaRole) set.add(META_TO_ROLE[hero.metaRole]);
  const out = [...set].filter(r => ROLE_LIST.includes(r));
  return out.length ? out : ['carry'];
}

// Maximum set of distinct roles the given picks can simultaneously cover, via
// bipartite matching (Kuhn's augmenting paths). Flex picks can shift to free a
// role, so this is the honest "which roles are actually covered" answer.
function coveredRoles(optionSets: Role[][]): Set<Role> {
  const roleToPick = new Map<Role, number>();
  const augment = (p: number, seen: Set<Role>): boolean => {
    for (const r of optionSets[p]) {
      if (seen.has(r)) continue;
      seen.add(r);
      const occ = roleToPick.get(r);
      if (occ === undefined || augment(occ, seen)) { roleToPick.set(r, p); return true; }
    }
    return false;
  };
  for (let p = 0; p < optionSets.length; p++) augment(p, new Set());
  return new Set(roleToPick.keys());
}

// Roles no maximum assignment of the picks can cover → still need a future pick.
function openRoles(picks: Hero[], assignments: Record<number, Role>): Role[] {
  const covered = coveredRoles(picks.map(h => roleOptions(h, assignments)));
  return ROLE_LIST.filter(r => !covered.has(r));
}

// Draft-position context for a team's next pick: how many picks each side still
// makes after it. enemyPicksAfter === 0 means a "protected" slot (the team's last,
// or last-but-one for the first-pick team) where a counterable hero gets a free game.
export function pickContextForTeam(
  slots: DraftSlot[], team: DraftTeam, fromIndex = 0,
): PickContext | null {
  let nextIdx = -1;
  for (let i = Math.max(0, fromIndex); i < slots.length; i++) {
    const s = slots[i];
    if (s.phase === 'pick' && s.team === team && s.heroId === null) { nextIdx = i; break; }
  }
  if (nextIdx === -1) return null;  // team has no remaining picks

  let enemyPicksAfter = 0, myPicksAfter = 0;
  for (let i = nextIdx + 1; i < slots.length; i++) {
    const s = slots[i];
    if (s.phase !== 'pick' || s.heroId !== null) continue;
    if (s.team === team) myPicksAfter++; else enemyPicksAfter++;
  }
  return { enemyPicksAfter, myPicksAfter, isMyLastPick: myPicksAfter === 0 };
}

const DESIRED_UTILITY: UtilityTag[] = [
  'stun', 'initiation', 'save', 'dispel', 'wave_clear', 'scaling',
];

// ─── Raw score components (kept for detail bars) ─────────────────────────────

function computeSynergyScore(pickIds: number[]): number {
  let total = 0;
  for (let i = 0; i < pickIds.length; i++) {
    for (let j = i + 1; j < pickIds.length; j++) {
      const ix = INTERACTIONS.find(
        x => ((x.heroId === pickIds[i] && x.targetHeroId === pickIds[j]) ||
              (x.heroId === pickIds[j] && x.targetHeroId === pickIds[i])) &&
             x.synergyScore !== undefined,
      );
      total += ix?.synergyScore ?? 0;
    }
  }
  const max = pickIds.length * (pickIds.length - 1) * 5;
  return max > 0 ? Math.min(25, Math.round((total / max) * 25)) : 0;
}

function computeCounterScore(myIds: number[], enemyIds: number[]): number {
  let total = 0;
  for (const myId of myIds) {
    for (const enemyId of enemyIds) {
      const ix = INTERACTIONS.find(
        x => x.heroId === myId && x.targetHeroId === enemyId && x.counterScore !== undefined,
      );
      total += ix?.counterScore ?? 0;
    }
  }
  const max = myIds.length * enemyIds.length * 5;
  return max > 0 ? Math.min(15, Math.round((total / max) * 15)) : 0;
}

function computeRoleBalance(picks: Hero[], assignments: Record<number, Role>): number {
  const roles: Role[] = ['carry', 'mid', 'offlane', 'support', 'hard_support'];
  let covered = 0;
  for (const role of roles) {
    if (picks.some(h => effectiveRole(h, assignments) === role ||
                        h.preferredRoles.includes(role) ||
                        h.flexRoles?.includes(role))) covered++;
  }
  return Math.round((covered / 5) * 10);
}

function computeUtilityCoverage(picks: Hero[]): { score: number; missing: UtilityTag[] } {
  const missing: UtilityTag[] = [];
  let covered = 0;
  for (const tag of DESIRED_UTILITY) {
    if (picks.some(h => h.utilityTags.includes(tag))) covered++;
    else missing.push(tag);
  }
  return { score: Math.round((covered / DESIRED_UTILITY.length) * 10), missing };
}

function computeTimingScore(picks: Hero[]): number {
  let score = 5;
  if (picks.some(h => h.utilityTags.includes('lane_pressure') || h.utilityTags.includes('burst'))) score += 2;
  if (picks.some(h => h.utilityTags.includes('initiation') || h.utilityTags.includes('stun'))) score += 2;
  if (picks.some(h => h.utilityTags.includes('scaling'))) score += 2;
  return Math.min(10, score);
}

function computeObjectiveScore(picks: Hero[]): number {
  let score = 0;
  if (picks.some(h => h.utilityTags.includes('tower_damage'))) score += 3;
  if (picks.some(h => h.utilityTags.includes('roshan'))) score += 3;
  if (picks.some(h => h.utilityTags.includes('wave_clear'))) score += 2;
  if (picks.some(h => h.utilityTags.includes('vision'))) score += 2;
  return Math.min(10, score);
}

function computePhysicalStack(picks: Hero[]): number {
  const ARMOR_REDUCERS = new Set(['elder_titan', 'slardar', 'dazzle', 'weaver', 'nevermore']);
  const hasArmorReduce = picks.some(h => h.utilityTags.includes('armor_reduction') || ARMOR_REDUCERS.has(h.name));
  const physCarries = picks.filter(h => h.attribute === 'agility' ||
    ['sven', 'juggernaut', 'phantom_assassin', 'ursa'].includes(h.name)).length;
  if (hasArmorReduce && physCarries >= 2) return 3;
  if (hasArmorReduce && physCarries >= 1) return 2;
  if (physCarries >= 3) return 1;
  return 0;
}

// ─── Win condition detection ─────────────────────────────────────────────────

// Win conditions are now a "named summary" of the capability profile — they read
// the same axis scores (teamfight/push/pickoff/scaling) the radar shows, so the
// two can never disagree. The splitpush gate keeps its identity check.
function detectWinConditions(picks: Hero[], physStack: number, caps: CapabilityProfile): WinConditionResult[] {
  const results: WinConditionResult[] = [];

  // TEAMFIGHT — initiation + lockdown + AoE damage
  const tfStr = caps.teamfight.score;
  if (tfStr >= 4) {
    results.push({
      id: 'teamfight', label: 'Teamfight', strength: tfStr,
      description: 'Win through 5-man engagements with lockdown and AoE damage.',
      gameplan: 'Force fights around Roshan and towers. Group at 15 min. Never let them catch you split.',
    });
  }

  // DEATHBALL — tower damage + wave clear + early-mid pressure
  const dbStr = caps.push.score;
  if (dbStr >= 5) {
    results.push({
      id: 'deathball', label: 'Deathball Push', strength: dbStr,
      description: 'Dominate lanes, push as a unit, take towers before they scale.',
      gameplan: 'Win lane phase, group at 15-20 min. Take Roshan then immediately push high ground.',
    });
  }

  // PICKOFF — mobility + silence/vision + catch mechanics
  const poStr = caps.pickoff.score;
  if (poStr >= 5) {
    results.push({
      id: 'pickoff', label: 'Pick-off', strength: poStr,
      description: 'Use mobility and vision to find isolated heroes and execute them.',
      gameplan: 'Stack wards, use silence to disable escapes. Avoid 5v5 — win through attrition.',
    });
  }

  // LATEGAME — scaling carries + protection
  const lgStr = caps.scaling.score;
  if (lgStr >= 5) {
    results.push({
      id: 'lategame', label: 'Late Game', strength: lgStr,
      description: 'Outscale the enemy — your lineup wins every fight after 40 minutes.',
      gameplan: 'Trade defensively early. Don\'t fight without BKBs. Contest Roshan at 3 items.',
    });
  }

  // SPLITPUSH — tower damage + mobility but low teamfight (identity check)
  const towerCount = picks.filter(h => h.utilityTags.includes('tower_damage')).length;
  const mobCount = picks.filter(h => h.utilityTags.includes('mobility')).length;
  const initCount = picks.filter(h => h.utilityTags.includes('initiation')).length;
  if (towerCount >= 2 && mobCount >= 2 && initCount <= 1) {
    const spStr = Math.min(10, towerCount * 3 + mobCount * 2);
    if (spStr >= 6) {
      results.push({
        id: 'splitpush', label: 'Split Push', strength: spStr,
        description: 'Create pressure on all lanes simultaneously, force unfavorable responses.',
        gameplan: 'Never group unless you must. Send heroes to create pressure on both sides of the map.',
      });
    }
  }

  // PHYSICAL DOMINATION
  if (physStack >= 2) {
    results.push({
      id: 'physical_domination', label: 'Physical Dominance', strength: physStack * 3,
      description: 'Armor reduction + right-click cores overwhelm enemies in direct fights.',
      gameplan: 'Buy armor-shred items (Desolator, Solar Crest). Ban enemy Assault Cuirass buyers.',
    });
  }

  return results.sort((a, b) => b.strength - a.strength);
}

// ─── Power window ────────────────────────────────────────────────────────────

function computePowerWindow(picks: Hero[]): PowerWindow {
  const earlyHeroes = picks.filter(h => h.utilityTags.includes('lane_pressure') || h.utilityTags.includes('burst'));
  const midHeroes = picks.filter(h => h.utilityTags.includes('initiation') || h.utilityTags.includes('stun') || h.utilityTags.includes('roshan'));
  const lateHeroes = picks.filter(h => h.utilityTags.includes('scaling'));
  const hasSave = picks.some(h => h.utilityTags.includes('save'));

  const early = Math.min(10, earlyHeroes.length * 2 + (earlyHeroes.length >= 3 ? 2 : 0));
  const mid = Math.min(10, midHeroes.length * 2 + (picks.some(h => h.utilityTags.includes('roshan')) ? 1 : 0));
  const late = Math.min(10, lateHeroes.length * 3 + (hasSave ? 1 : 0));

  const peak = early >= mid && early >= late ? 'early' : mid >= late ? 'mid' : 'late';

  const earlyLabel = early >= 7 ? 'Dominant' : early >= 4 ? 'Decent' : 'Weak';
  const midLabel = mid >= 7 ? 'Dominant' : mid >= 4 ? 'Decent' : 'Weak';
  const lateLabel = late >= 7 ? 'Dominant' : late >= 4 ? 'Decent' : 'Weak';

  return { early, mid, late, peak, earlyLabel, midLabel, lateLabel };
}

// ─── Lane verdict ─────────────────────────────────────────────────────────────

function computeLaneVerdict(picks: Hero[], assignments: Record<number, Role>): LaneVerdictResult {
  const byRole = (role: Role) => picks.filter(h => effectiveRole(h, assignments) === role);

  const carries = byRole('carry');
  const mids = byRole('mid');
  const offlaners = byRole('offlane');
  const softSupports = byRole('support');
  const hardSupports = byRole('hard_support');
  const allSupports = [...softSupports, ...hardSupports];

  const carry = carries[0];
  const mid = mids[0];
  const offlaner = offlaners[0];

  // Safe lane
  const safeHeroIds = [...carries, ...hardSupports].map(h => h.id);
  const safeNeeds: string[] = [];
  if (!carry) {
    safeNeeds.push('No carry assigned — click role badge in team panel to assign');
  } else {
    const hasProtection = allSupports.some(s => s.utilityTags.includes('save') || s.utilityTags.includes('heal'));
    if (!hasProtection) safeNeeds.push(`${carry.displayName} needs a saving support (Dazzle, Oracle, Omniknight)`);
    const hasStunSupport = allSupports.some(s => s.utilityTags.includes('stun') || s.utilityTags.includes('lockdown'));
    if (!hasStunSupport) safeNeeds.push(`${carry.displayName} needs stun/lockdown for lane security`);
    if (carry.needs?.includes('aura carriers') && !allSupports.some(s => s.utilityTags.includes('aura_carrier'))) {
      safeNeeds.push(`${carry.displayName} wants an aura carrier (VS, Lich, Elder Titan)`);
    }
  }
  const safeStrength = carry ? (allSupports.some(s => s.utilityTags.includes('save')) ? 9 : 6) : 2;

  // Mid lane
  const midNeeds: string[] = [];
  if (!mid) {
    midNeeds.push('No mid hero assigned — assign a hero to mid role');
  } else {
    if (!mid.utilityTags.includes('mobility') && !mid.utilityTags.includes('burst')) {
      midNeeds.push(`${mid.displayName} will struggle to impact map — pick up mobility item early`);
    }
    if (mid.complexity === 3) midNeeds.push(`${mid.displayName} is mechanically demanding — high skill floor`);
  }

  // Off lane
  const offHeroIds = [...offlaners, ...softSupports].map(h => h.id);
  const offNeeds: string[] = [];
  if (!offlaner) {
    offNeeds.push('No offlaner assigned');
  } else {
    const offHasKillThreat = offlaners.some(h => h.utilityTags.includes('stun') || h.utilityTags.includes('burst') || h.utilityTags.includes('initiation'));
    const pos4HasMobility = softSupports.some(s => s.utilityTags.includes('mobility') || s.utilityTags.includes('rotate'));
    if (!offHasKillThreat) offNeeds.push(`${offlaner.displayName} lane needs more kill threat or initiation`);
    if (!pos4HasMobility && softSupports.length > 0) offNeeds.push('Pos4 should have rotation/roam ability to impact map');
  }
  const offStrength = offlaner ? (offlaners.some(h => h.utilityTags.includes('initiation')) ? 8 : 5) : 2;

  // Rotation support
  const rotators = allSupports.filter(h => h.utilityTags.includes('mobility') || h.utilityTags.includes('rotate') || h.utilityTags.includes('stun'));
  const canRotate = rotators.length > 0;
  const rotateNote = canRotate
    ? `${rotators.map(h => h.displayName).join(' + ')} can rotate to secure kills and deny enemy farm`
    : 'No dedicated rotation support — consider heroes with mobility or stun for ganks';

  // Missing roles — flex-aware: a role only counts as missing if no maximum
  // assignment of the current picks (honouring flex) can cover it.
  const missingRoles = openRoles(picks, assignments);

  const overallScore = Math.min(10,
    (carry ? 2 : 0) + (mid ? 2 : 0) + (offlaner ? 2 : 0) +
    (allSupports.length >= 2 ? 2 : allSupports.length) +
    (canRotate ? 1 : 0) + (safeNeeds.length === 0 ? 1 : 0),
  );

  return {
    safeLane: { heroIds: safeHeroIds, verdict: carry ? `${carry.displayName} as carry` : 'Unassigned', needs: safeNeeds, strength: safeStrength },
    midLane: { heroIds: mid ? [mid.id] : [], heroId: mid?.id, verdict: mid ? `${mid.displayName} in mid` : 'Unassigned', needs: midNeeds, strength: mid ? 6 : 0 },
    offLane: { heroIds: offHeroIds, verdict: offlaner ? `${offlaner.displayName} offlane` : 'Unassigned', needs: offNeeds, strength: offStrength },
    rotationSupport: { heroIds: rotators.map(h => h.id), canRotate, note: rotateNote },
    overallScore,
    missingRoles,
    predictions: [],  // filled in analyzeTeam after enemyPicks are available
  };
}

// ─── Verdict rating ───────────────────────────────────────────────────────────

function computeVerdict(picks: Hero[], winCons: WinConditionResult[], laneVerdict: LaneVerdictResult): { rating: VerdictRating; label: string } {
  if (picks.length < 3) return { rating: 'incomplete', label: 'Incomplete' };
  const topStr = winCons[0]?.strength ?? 0;
  const laneOk = laneVerdict.overallScore >= 6;
  if (topStr >= 8 && laneOk && winCons.length >= 2) return { rating: 'dominant', label: 'Dominant Draft' };
  if (topStr >= 6 && laneOk) return { rating: 'strong', label: 'Strong Draft' };
  if (topStr >= 4) return { rating: 'solid', label: 'Solid Draft' };
  if (topStr >= 2 || picks.length < 5) return { rating: 'needs_work', label: 'Needs Work' };
  return { rating: 'needs_work', label: 'Unclear Win Condition' };
}

// ─── Gameplan builder ─────────────────────────────────────────────────────────

function buildGameplan(
  winCon: WinConditionResult,
  powerWindow: PowerWindow,
  laneVerdict: LaneVerdictResult,
  picks: Hero[],
  enemyPicks: Hero[],
  roleAssignments: Record<number, Role>,
): string[] {
  const steps: string[] = [];
  const byRole = (r: Role) => picks.filter(h => effectiveRole(h, roleAssignments) === r);

  const carry    = byRole('carry')[0];
  const mid      = byRole('mid')[0];
  const offlaner = byRole('offlane')[0];
  const hardSup  = byRole('hard_support')[0];
  const softSup  = byRole('support')[0];

  // Step 1: Lane composition (hero-specific)
  const hasRoles = picks.some(h => roleAssignments[h.id] || h.metaRole);
  if (hasRoles && (carry || mid || offlaner)) {
    const lanes: string[] = [];
    if (carry && hardSup) lanes.push(`${carry.displayName} + ${hardSup.displayName} safe`);
    else if (carry)       lanes.push(`${carry.displayName} safe`);
    if (mid)              lanes.push(`${mid.displayName} mid`);
    if (offlaner && softSup) lanes.push(`${offlaner.displayName} + ${softSup.displayName} off`);
    else if (offlaner)       lanes.push(`${offlaner.displayName} off`);
    if (lanes.length > 0) steps.push(lanes.join(' · '));
  }

  // Step 2: Power-window timing action with hero names
  if (powerWindow.peak === 'early') {
    const aggressors = picks.filter(h =>
      h.utilityTags.includes('lane_pressure') || h.utilityTags.includes('burst'));
    if (aggressors.length > 0) {
      steps.push(`${aggressors.map(h => h.displayName).join(' and ')} must dominate lanes before 15 min — your lineup fades if the game goes late.`);
    } else {
      steps.push('Win the laning phase aggressively — your window closes fast.');
    }
  } else if (powerWindow.peak === 'mid') {
    const initiators = picks.filter(h => h.utilityTags.includes('initiation'));
    const roshanH   = picks.find(h => h.utilityTags.includes('roshan'));
    if (initiators.length > 0) {
      const roster = initiators.map(h => h.displayName).join(' + ');
      steps.push(
        `Group as 5 after 15 min. Force a fight with ${roster} into Roshan.` +
        (roshanH ? ` Secure Aegis with ${roshanH.displayName} and push high ground.` : ''),
      );
    } else {
      steps.push('Contest the 20-minute Roshan — your midgame is strongest.');
    }
  } else {
    if (carry) {
      steps.push(`Play defensively. ${carry.displayName} needs 3 core items before you commit to fights. Your late-game teamfight wins every engagement.`);
    } else {
      steps.push('Avoid fights before 30 min — let your lineup scale to full power.');
    }
  }

  // Step 3: Core combo execution (hero-specific)
  const initiator  = picks.find(h => h.utilityTags.includes('initiation'));
  const lockdown   = picks.find(h => (h.utilityTags.includes('lockdown') || h.utilityTags.includes('stun')) && h !== initiator);
  const damageCore = picks.find(h =>
    h.utilityTags.includes('burst') || (h.attribute === 'agility' && h.utilityTags.includes('scaling')));

  if (initiator && lockdown) {
    const chain = damageCore && damageCore !== initiator && damageCore !== lockdown
      ? `${initiator.displayName} → ${lockdown.displayName} → ${damageCore.displayName}`
      : `${initiator.displayName} → ${lockdown.displayName}`;
    steps.push(`Fight order: ${chain}. Never split ${initiator.displayName} from the team before a fight starts.`);
  } else if (winCon.id === 'deathball') {
    const pushers = picks.filter(h => h.utilityTags.includes('tower_damage') || h.utilityTags.includes('wave_clear'));
    if (pushers.length >= 2) {
      steps.push(`${pushers.map(h => h.displayName).join(' + ')} push as a unit. After every won fight, immediately advance to the nearest tier.`);
    }
  } else if (winCon.id === 'pickoff') {
    const catchers = picks.filter(h => h.utilityTags.includes('mobility') || h.utilityTags.includes('silence'));
    if (catchers.length > 0) {
      steps.push(`${catchers.map(h => h.displayName).join(' + ')}: smoke, find an isolated target, execute — then reset. Avoid 5v5 fights.`);
    }
  }

  // Step 4: Enemy-specific warning
  const warnings: string[] = [];
  for (const enemy of enemyPicks) {
    if (winCon.id === 'teamfight') {
      if (enemy.name === 'silencer') {
        warnings.push(`Buy BKBs before every fight — enemy ${enemy.displayName} Global Silence cancels all combo spells simultaneously.`); break;
      }
      if (enemy.name === 'doom_bringer') {
        warnings.push(`Fight only when enemy ${enemy.displayName} is on cooldown — Doom on your initiator ends the fight before it starts.`); break;
      }
      if (enemy.utilityTags.includes('silence')) {
        warnings.push(`Enemy ${enemy.displayName} silence disrupts your combo chain — initiate only when BKBs are active.`);
      }
    } else if (winCon.id === 'lategame') {
      if (enemy.name === 'ancient_apparition') {
        warnings.push(`CRITICAL: enemy ${enemy.displayName} — never use healing items while Ice Blast is active on your carry.`); break;
      }
    } else if (winCon.id === 'deathball') {
      if (enemy.name === 'natures_prophet') {
        warnings.push(`Watch enemy ${enemy.displayName} backdoor — always check for split push before committing to a tier.`); break;
      }
      if (enemy.name === 'timbersaw') {
        warnings.push(`Enemy ${enemy.displayName} stalls pushes indefinitely in trees — do not siege in without vision.`); break;
      }
    } else if (winCon.id === 'pickoff') {
      if (enemy.utilityTags.includes('save')) {
        warnings.push(`Enemy ${enemy.displayName} saves assassination targets — time your initiation around their save cooldown.`); break;
      }
    }
  }
  if (warnings.length > 0) steps.push(warnings[0]);

  // Step 5: Rotation or safe-lane gap
  if (laneVerdict.rotationSupport.canRotate) {
    const rotaters = picks.filter(h => h.utilityTags.includes('mobility') || h.utilityTags.includes('rotate'));
    if (rotaters.length > 0) {
      const target = mid ?? carry;
      steps.push(
        `${rotaters[0].displayName} rotates early to create pressure.` +
        (target ? ` Prioritise kills near ${target.displayName}'s lane after winning their matchup.` : ''),
      );
    }
  } else if (laneVerdict.safeLane.needs.length > 0) {
    steps.push(`Safe lane gap: ${laneVerdict.safeLane.needs[0]}`);
  } else if (carry?.needs?.length) {
    steps.push(`${carry.displayName} needs: ${carry.needs.slice(0, 2).join(', ')}`);
  }

  return steps.slice(0, 5);
}

// ─── Key threats / key bans ───────────────────────────────────────────────────

function buildKeyThreats(winCon: WinConditionResult, _picks: Hero[], enemyPicks: Hero[]): string[] {
  const threats: string[] = [];

  // Scan the actual enemy picks first for specific named threats
  for (const enemy of enemyPicks) {
    if (winCon.id === 'teamfight') {
      if (enemy.name === 'silencer') {
        threats.push(`${enemy.displayName}: Global Silence cancels all combo spells at once — buy BKBs before every fight`); break;
      }
      if (enemy.name === 'doom_bringer') {
        threats.push(`${enemy.displayName}: Doom on your initiator prevents the fight from starting — never engage into a fresh Doom`); break;
      }
      if (enemy.utilityTags.includes('silence')) {
        threats.push(`${enemy.displayName}: silence disrupts your combo chain — ensure BKBs are active before initiating`);
      }
    } else if (winCon.id === 'lategame') {
      if (enemy.name === 'ancient_apparition') {
        threats.push(`${enemy.displayName}: Ice Blast hard-counters all healing on your carry — highest priority threat`); break;
      }
      if (enemy.name === 'doom_bringer') {
        threats.push(`${enemy.displayName}: Doom destroys carry items in fights — never let Doom get a clean Blink initiation`); break;
      }
      if (enemy.utilityTags.includes('burst') || enemy.utilityTags.includes('initiation')) {
        threats.push(`${enemy.displayName}: can kill your carry before scaling comes online — needs early protection`);
      }
    } else if (winCon.id === 'deathball') {
      if (enemy.name === 'timbersaw') {
        threats.push(`${enemy.displayName}: stalls your push indefinitely inside trees — avoid sieging without vision`);
      }
      if (enemy.name === 'natures_prophet') {
        threats.push(`${enemy.displayName}: backdoors while your team is pushing — always check the minimap first`);
      }
      if (enemy.name === 'batrider') {
        threats.push(`${enemy.displayName}: lasso isolates your key hero mid-push and forces a bad fight`);
      }
    } else if (winCon.id === 'pickoff') {
      if (enemy.utilityTags.includes('save')) {
        threats.push(`${enemy.displayName}: saves your assassination targets — time single-target spells around their save cooldown`);
      }
    } else if (winCon.id === 'physical_domination') {
      if (enemy.name === 'phantom_lancer' || enemy.name === 'naga_siren') {
        threats.push(`${enemy.displayName}: illusions dilute your physical damage — buy cleave items (Battlefury, Maelstrom)`);
      }
    }
    if (threats.length >= 3) break;
  }

  // Fill remaining slots with generic threats for this win condition
  if (threats.length < 2) {
    switch (winCon.id) {
      case 'teamfight':
        threats.push('BKB-heavy enemy carries reduce lockdown window — engage only when your BKBs are active');
        if (threats.length < 2) threats.push('Hex or Linkens on your initiator before fights start defeats your combo');
        break;
      case 'lategame':
        threats.push('Aggressive early lineup that snowballs before your carry reaches two core items');
        if (threats.length < 2) threats.push('Doom or Hex on your carry in fights prevents using items at critical moments');
        break;
      case 'deathball':
        threats.push('Heroes with buyback + counter-initiation can stall a push into base indefinitely');
        if (threats.length < 2) threats.push('Ancient Apparition if your team relies on healing through sustained sieges');
        break;
      case 'pickoff':
        threats.push("Linken's Sphere on priority targets blocks all single-target initiation spells");
        if (threats.length < 2) threats.push('Heroes with strong escapes (AM Blink, Morphling Shift) can survive your ganks');
        break;
      case 'physical_domination':
        threats.push('Assault Cuirass aura neutralizes your armor-shred stack — their whole team benefits');
        if (threats.length < 2) threats.push('Evasion items (Butterfly) on enemy cores block a large portion of right-click output');
        break;
      default:
        threats.push('Heroes with global presence can interrupt your strategy anywhere on the map');
    }
  }

  return [...new Set(threats)].slice(0, 3);
}

function buildKeyBans(winCon: WinConditionResult, picks: Hero[], enemyPicks: Hero[]): string[] {
  const bans: string[] = [];

  // Win-condition-specific priority bans
  switch (winCon.id) {
    case 'teamfight':
      bans.push('Silencer — Global Silence cancels your entire combo window; must-ban vs teamfight');
      bans.push('Doom — silences your initiator before they can start the fight');
      break;
    case 'lategame':
      bans.push('Ancient Apparition — Ice Blast hard-counters carry healing; #1 priority ban');
      bans.push('Doom — shuts down carry items and removes key abilities in fights');
      break;
    case 'deathball':
      bans.push('Timbersaw — stalls your push indefinitely; cannot be killed inside trees');
      bans.push("Nature's Prophet — backdoors while your team is grouped pushing");
      break;
    case 'physical_domination':
      bans.push('Phantom Lancer / Naga Siren — illusions spread your physical damage too thin');
      bans.push('Elder Titan / Slardar — enemy armor reduction competes directly with yours');
      break;
    case 'pickoff':
      bans.push('Oracle / Dazzle — saves the targets you are trying to assassinate');
      bans.push('Heroes with Linken\'s Sphere passives; blocks your single-target initiation');
      break;
    default:
      bans.push('Heroes that directly counter your carry\'s core items or playstyle');
  }

  // Synergy bans — heroes that would fit perfectly into what the enemy already has
  for (const enemy of enemyPicks) {
    const synergies = INTERACTIONS
      .filter(ix =>
        ((ix.heroId === enemy.id) || (ix.targetHeroId === enemy.id)) &&
        ix.synergyScore !== undefined && ix.synergyScore >= 9,
      )
      .slice(0, 1);
    for (const ix of synergies) {
      const synId = ix.heroId === enemy.id ? ix.targetHeroId : ix.heroId;
      const synHero = LOCAL_HEROES.find(h => h.id === synId);
      if (synHero && !picks.some(p => p.id === synId) && !enemyPicks.some(e => e.id === synId)) {
        bans.push(`${synHero.displayName} — strong wombo combo with enemy ${enemy.displayName}`);
      }
    }
    if (bans.length >= 3) break;
  }

  // Carry-stack counter
  if (computePhysicalStack(picks) >= 2) {
    bans.push('Dazzle / heroes with Weave — negates your physical damage stack directly');
  }

  return [...new Set(bans)].slice(0, 3);
}

// ─── Coach narrative ─────────────────────────────────────────────────────────

function buildCoachNarrative(
  picks: Hero[],
  enemyPicks: Hero[],
  winCon: WinConditionResult,
  powerWindow: PowerWindow,
  weaknesses: string[],
  roleAssignments: Record<number, Role>,
): string {
  if (picks.length < 2) return 'Pick more heroes to generate a draft summary.';

  const carry = picks.find(h => effectiveRole(h, roleAssignments) === 'carry');
  const mid = picks.find(h => effectiveRole(h, roleAssignments) === 'mid');

  const parts: string[] = [];

  // Sentence 1: what the draft wins through and when
  const timingStr =
    powerWindow.peak === 'early' ? 'at 15–20 minutes' :
    powerWindow.peak === 'mid'   ? 'at 20–30 minutes' :
                                   'after 35+ minutes';

  parts.push(`Your draft wins through ${winCon.label.toLowerCase()} ${timingStr}.`);

  // Sentence 2: who enables the win condition and how
  const enablers: string[] = [];
  if (winCon.id === 'teamfight') {
    const initiators = picks.filter(h => h.utilityTags.includes('initiation'));
    const lockdown = picks.filter(h => h.utilityTags.includes('lockdown') || h.utilityTags.includes('stun'));
    const damage = picks.filter(h => h.utilityTags.includes('burst') || h.utilityTags.includes('scaling'));
    if (initiators.length) enablers.push(`initiation (${initiators.map(h => h.displayName).join(', ')})`);
    if (lockdown.length && lockdown.some(h => !initiators.includes(h))) {
      enablers.push(`lockdown (${lockdown.filter(h => !initiators.includes(h)).map(h => h.displayName).join(', ')})`);
    }
    if (damage.length) enablers.push(`right-click damage (${damage.map(h => h.displayName).join(', ')})`);
  } else if (winCon.id === 'deathball') {
    const pushers = picks.filter(h => h.utilityTags.includes('tower_damage') || h.utilityTags.includes('wave_clear'));
    const initiators = picks.filter(h => h.utilityTags.includes('initiation'));
    if (initiators.length) enablers.push(`initiation (${initiators.map(h => h.displayName).join(', ')})`);
    if (pushers.length) enablers.push(`push damage (${pushers.map(h => h.displayName).join(', ')})`);
  } else if (winCon.id === 'lategame') {
    const scalers = picks.filter(h => h.utilityTags.includes('scaling'));
    const savers = picks.filter(h => h.utilityTags.includes('save'));
    if (scalers.length) enablers.push(`scaling cores (${scalers.map(h => h.displayName).join(', ')})`);
    if (savers.length) enablers.push(`protection (${savers.map(h => h.displayName).join(', ')})`);
  } else if (winCon.id === 'physical_domination') {
    const armorReduce = picks.filter(h => h.utilityTags.includes('armor_reduction'));
    const physCarries = picks.filter(h => h.attribute === 'agility' || h.utilityTags.includes('scaling'));
    if (armorReduce.length) enablers.push(`armor reduction (${armorReduce.map(h => h.displayName).join(', ')})`);
    if (physCarries.length) enablers.push(`right-click damage (${physCarries.map(h => h.displayName).join(', ')})`);
  } else if (winCon.id === 'pickoff') {
    const catchers = picks.filter(h => h.utilityTags.includes('mobility') || h.utilityTags.includes('silence'));
    if (catchers.length) enablers.push(`catch potential (${catchers.map(h => h.displayName).join(', ')})`);
  }
  if (enablers.length) {
    parts.push(`You have ${enablers.join(', ')}.`);
  }

  // Sentence 3: specific synergy callout
  const physStack = computePhysicalStack(picks);
  if (physStack >= 2) {
    const armorReducer = picks.find(h => h.utilityTags.includes('armor_reduction'));
    const physCore = picks.find(h => (h.attribute === 'agility' || h.utilityTags.includes('scaling')) && !h.utilityTags.includes('armor_reduction'));
    if (armorReducer && physCore) {
      parts.push(`${armorReducer.displayName} armor reduction stacks with ${physCore.displayName} right-click for devastating physical burst.`);
    }
  }
  const hasSave = picks.some(h => h.utilityTags.includes('save'));
  if (carry && hasSave) {
    const saver = picks.find(h => h.utilityTags.includes('save'));
    if (saver) parts.push(`${saver.displayName} protects ${carry.displayName} through burst and lets them fight through assassination attempts.`);
  }

  // Sentence 4: mid matchup callout vs enemy
  if (mid && enemyPicks.length > 0) {
    const enemyMid = enemyPicks.find(h => h.metaRole === 'pos2' || h.preferredRoles.includes('mid'));
    if (enemyMid) {
      const adv = matchupAdvantage(mid.id, enemyMid.id);
      const note = getMidMatchupNote(mid.id, enemyMid.id);
      if (note) {
        parts.push(note);
      } else if (adv >= 2) {
        parts.push(`Your mid ${mid.displayName} has a strong matchup advantage over their ${enemyMid.displayName}.`);
      } else if (adv <= -2) {
        parts.push(`Warning: your mid ${mid.displayName} is at a disadvantage against their ${enemyMid.displayName} — consider swapping roles.`);
      }
    }
  }

  // Sentence 5: core weakness and time pressure
  if (weaknesses.length > 0) {
    const mainWeakness = weaknesses[0].toLowerCase();
    parts.push(`You are vulnerable: ${mainWeakness}.`);
  }
  if (powerWindow.peak === 'mid') {
    parts.push('End the game before 35 minutes or you risk losing the timing window.');
  } else if (powerWindow.peak === 'early') {
    parts.push('If you cannot win by 25 minutes, the game becomes very difficult.');
  } else {
    parts.push('Avoid unnecessary fights before your cores hit their 3-item timing.');
  }

  return parts.join(' ');
}

// ─── Lane predictions ──────────────────────────────────────────────────────────

function buildLanePredictions(
  picks: Hero[],
  enemyPicks: Hero[],
  roleAssignments: Record<number, Role>,
): LanePrediction[] {
  const predictions: LanePrediction[] = [];

  const byRole = (role: Role) => picks.filter(h => effectiveRole(h, roleAssignments) === role);
  // roleAssignments is the global heroId→role map (both teams), so enemy lookups
  // honour the user's assigned enemy positions too.
  const enemyByRole = (role: Role) => enemyPicks.filter(h => effectiveRole(h, roleAssignments) === role);

  const carries = byRole('carry');
  const mids = byRole('mid');
  const offlaners = byRole('offlane');
  const hardSups = byRole('hard_support');
  const softSups = byRole('support');

  // ── Safe Lane ──
  const safeHeroes = [...carries, ...hardSups];
  if (safeHeroes.length > 0) {
    const carry = carries[0];
    const sup5 = hardSups[0];
    const enemyOff = [...enemyByRole('offlane'), ...enemyByRole('support')];
    const needs: string[] = [];
    let verdict = '';
    let synergyNote: string | undefined;
    let counterNote: string | undefined;

    if (carry && sup5) {
      const lps = getLanePartnerScore(sup5.id, carry.id);
      if (lps >= 9) {
        verdict = `${carry.displayName} + ${sup5.displayName} — one of the strongest safe-lane duos in the game`;
        synergyNote = `Lane partner score: ${lps}/10`;
      } else if (lps >= 7) {
        verdict = `${carry.displayName} + ${sup5.displayName} — strong kill threat and sustain`;
        synergyNote = `Good synergy: ${lps}/10 lane partner score`;
      } else if (sup5.utilityTags.includes('save')) {
        verdict = `${carry.displayName} safe with ${sup5.displayName} — protected against burst`;
      } else if (sup5.utilityTags.includes('stun') || sup5.utilityTags.includes('lockdown')) {
        verdict = `${carry.displayName} + ${sup5.displayName} — decent kill threat with lockdown`;
      } else {
        verdict = `${carry.displayName} safe lane — limited kill potential`;
        needs.push(`${carry.displayName} needs more kill threat support`);
      }
      if (!sup5.utilityTags.includes('stun') && !sup5.utilityTags.includes('save')) {
        needs.push(`Consider a support with stun or save alongside ${carry.displayName}`);
      }
    } else if (carry) {
      verdict = `${carry.displayName} safe — no hard support assigned`;
      needs.push('Assign a hard support to protect the carry');
    } else {
      verdict = 'Safe lane unassigned — assign a carry hero';
      needs.push('No carry assigned to safe lane');
    }

    // Counter note vs enemy offlane
    if (carry && enemyOff.length > 0) {
      const worstMatchup = enemyOff.reduce((best, e) => {
        const adv = matchupAdvantage(e.id, carry.id);
        return adv > best.adv ? { hero: e, adv } : best;
      }, { hero: enemyOff[0], adv: -999 });
      if (worstMatchup.adv >= 2) {
        counterNote = `Watch out — enemy ${worstMatchup.hero.displayName} wins the lane matchup`;
      }
    }

    const strength = carry
      ? Math.min(10, (sup5 ? getLanePartnerScore(sup5.id, carry.id) : 4) +
                     (hardSups.some(h => h.utilityTags.includes('stun')) ? 1 : 0))
      : 2;

    predictions.push({
      lane: 'safe', label: 'Safe Lane',
      heroIds: safeHeroes.map(h => h.id),
      enemyHeroIds: enemyOff.map(h => h.id),
      strength, verdict, synergyNote, counterNote, needs,
    });
  }

  // ── Mid Lane ──
  if (mids.length > 0) {
    const mid = mids[0];
    const enemyMids = enemyByRole('mid');
    const needs: string[] = [];
    let verdict = '';
    let counterNote: string | undefined;

    if (enemyMids.length > 0) {
      const enemyMid = enemyMids[0];
      const adv = matchupAdvantage(mid.id, enemyMid.id);
      const note = getMidMatchupNote(mid.id, enemyMid.id);
      if (note) {
        verdict = note;
        counterNote = adv >= 2 ? undefined : adv <= -2 ? `Disadvantaged vs ${enemyMid.displayName}` : undefined;
      } else if (adv >= 3) {
        verdict = `${mid.displayName} heavily favoured over ${enemyMid.displayName}`;
      } else if (adv >= 1) {
        verdict = `${mid.displayName} slight advantage vs ${enemyMid.displayName}`;
      } else if (adv <= -3) {
        verdict = `${mid.displayName} is at a serious disadvantage vs ${enemyMid.displayName}`;
        counterNote = `Consider swapping ${mid.displayName} off mid`;
        needs.push(`${mid.displayName} struggles this matchup — consider role swap or aggressive rune control`);
      } else if (adv <= -1) {
        verdict = `${mid.displayName} slight disadvantage vs ${enemyMid.displayName}`;
        needs.push('Play safely and focus on farm rather than kills');
      } else {
        verdict = `${mid.displayName} vs ${enemyMid.displayName} — even matchup`;
      }
    } else {
      verdict = `${mid.displayName} mid — no known enemy mid assigned`;
    }

    if (mid.complexity === 3) needs.push(`${mid.displayName} is mechanically demanding — high skill floor`);

    const strength = enemyMids.length > 0
      ? Math.min(10, 5 + matchupAdvantage(mid.id, enemyMids[0].id))
      : 6;

    predictions.push({
      lane: 'mid', label: 'Mid Lane',
      heroIds: [mid.id],
      enemyHeroIds: enemyMids.map(h => h.id),
      strength, verdict, counterNote, needs,
    });
  }

  // ── Off Lane ──
  const offHeroes = [...offlaners, ...softSups];
  if (offHeroes.length > 0) {
    const offlaner = offlaners[0];
    const pos4 = softSups[0];
    const enemySafe = [...enemyByRole('carry'), ...enemyByRole('hard_support')];
    const needs: string[] = [];
    let verdict = '';
    let synergyNote: string | undefined;
    let counterNote: string | undefined;

    if (offlaner && pos4) {
      const lps = getLanePartnerScore(pos4.id, offlaner.id);
      const hasKillThreat = offlaners.some(h => h.utilityTags.includes('stun') || h.utilityTags.includes('initiation'))
        || softSups.some(h => h.utilityTags.includes('stun'));
      if (lps >= 7) {
        verdict = `${offlaner.displayName} + ${pos4.displayName} — strong kill threat in lane`;
        synergyNote = `${pos4.displayName} enables ${offlaner.displayName} to find kills`;
      } else if (hasKillThreat) {
        verdict = `${offlaner.displayName} + ${pos4.displayName} — aggressive offlane with kill potential`;
      } else {
        verdict = `${offlaner.displayName} + ${pos4.displayName} — passive offlane, focus on XP`;
        needs.push('Offlane lacks kill threat — risk of being zoned out');
      }
      if (pos4.utilityTags.includes('mobility') || pos4.utilityTags.includes('rotate')) {
        synergyNote = (synergyNote ?? '') + ` ${pos4.displayName} can rotate to secure kills elsewhere`;
      }
    } else if (offlaner) {
      verdict = `${offlaner.displayName} solo offlane — needs coordination with pos4`;
      needs.push('Assign a pos4 roamer for kill pressure');
    }

    // Counter note vs enemy safe lane
    if (offlaner && enemySafe.length > 0) {
      const enemyCarry = enemySafe[0];
      const adv = matchupAdvantage(offlaner.id, enemyCarry.id);
      if (adv >= 2) counterNote = `${offlaner.displayName} pressures enemy ${enemyCarry.displayName} carry effectively`;
      else if (adv <= -2) {
        counterNote = `Enemy ${enemyCarry.displayName} is hard to kill from offlane`;
        needs.push(`${offlaner.displayName} will struggle to zone ${enemyCarry.displayName} — focus on XP`);
      }
    }

    const strength = offlaner
      ? Math.min(10, (offlaners.some(h => h.utilityTags.includes('initiation')) ? 7 : 5)
                    + (pos4 ? 2 : 0))
      : 2;

    predictions.push({
      lane: 'off', label: 'Off Lane',
      heroIds: offHeroes.map(h => h.id),
      enemyHeroIds: enemySafe.map(h => h.id),
      strength, verdict, synergyNote, counterNote, needs,
    });
  }

  // ── Roam / Rotation ──
  const roamers = [...softSups, ...hardSups].filter(h => h.utilityTags.includes('mobility') || h.utilityTags.includes('rotate'));
  if (roamers.length > 0 && (mids.length > 0 || carries.length > 0)) {
    const roamer = roamers[0];
    const targets = [...carries, ...mids].map(h => h.displayName);
    predictions.push({
      lane: 'roam', label: 'Rotation',
      heroIds: roamers.map(h => h.id),
      enemyHeroIds: [],
      strength: 7,
      verdict: `${roamer.displayName} rotates to secure kills on ${targets.slice(0, 2).join(' and ')}`,
      synergyNote: roamers.length > 1 ? `${roamers.map(h => h.displayName).join(' + ')} double roam` : undefined,
      needs: [],
    });
  }

  return predictions;
}

// ─── Lane matchups ────────────────────────────────────────────────────────────

function computeLaneMatchups(myPicks: Hero[], enemyPicks: Hero[]): LaneMatchupResult[] {
  const results: LaneMatchupResult[] = [];
  for (const myHero of myPicks) {
    for (const enemyHero of enemyPicks) {
      const advantage = matchupAdvantage(myHero.id, enemyHero.id);
      if (advantage === 0) continue;
      const dataBacked = hasLiveAdv(myHero.id, enemyHero.id);
      const isMid = (myHero.metaRole === 'pos2' || myHero.preferredRoles.includes('mid')) &&
                    (enemyHero.metaRole === 'pos2' || enemyHero.preferredRoles.includes('mid'));
      const directional = advantage > 0
        ? `${myHero.displayName} wins lane vs ${enemyHero.displayName}`
        : `${myHero.displayName} struggles vs ${enemyHero.displayName} in lane`;
      // The authored note carries the "why", but drop it when live data has flipped
      // the matchup's direction so the text never contradicts the blended number.
      const handAdv = handLaneAdv(myHero.id, enemyHero.id);
      const midNote = getMidMatchupNote(myHero.id, enemyHero.id);
      const note = midNote && (handAdv === 0 || Math.sign(handAdv) === Math.sign(advantage))
        ? midNote : directional;
      results.push({ heroId: myHero.id, enemyHeroId: enemyHero.id, advantage, note, isMid, dataBacked });
    }
  }
  return results.sort((a, b) => Math.abs(b.advantage) - Math.abs(a.advantage));
}

// ─── Narrative strengths/weaknesses ──────────────────────────────────────────

function buildStrengths(picks: Hero[], synergy: number, counter: number, physStack: number): string[] {
  const s: string[] = [];
  if (synergy >= 18) s.push('Excellent hero synergies');
  else if (synergy >= 10) s.push('Good hero synergies');
  if (counter >= 10) s.push('Strong counter picks against enemy');
  if (picks.some(h => h.utilityTags.includes('scaling'))) s.push('Strong late-game scaling');
  if (picks.some(h => h.utilityTags.includes('initiation'))) s.push('Reliable teamfight initiation');
  if (picks.filter(h => h.utilityTags.includes('stun')).length >= 2) s.push('Multiple stuns — reliable lockdown');
  else if (picks.some(h => h.utilityTags.includes('stun'))) s.push('Reliable crowd control');
  if (picks.some(h => h.utilityTags.includes('save'))) s.push('Can protect key allies from burst');
  if (picks.some(h => h.utilityTags.includes('roshan'))) s.push('Roshan control potential');
  if (physStack >= 2) s.push('Physical damage stack: armor shred amplifies right-click cores');
  if (picks.some(h => h.utilityTags.includes('global'))) s.push('Global presence threatens anywhere on map');
  return s.slice(0, 6);
}

function buildWeaknesses(missing: UtilityTag[], roleBalance: number, picks: Hero[]): string[] {
  const w: string[] = [];
  if (missing.includes('stun')) w.push('Lacks reliable crowd control — enemy can walk away from fights');
  if (missing.includes('initiation')) w.push('No reliable teamfight initiation — must react not engage');
  if (missing.includes('save')) w.push('Cannot protect carries from burst/assassin combos');
  if (missing.includes('scaling')) w.push('Weak in late-game scenarios — must end before 40 min');
  if (missing.includes('dispel')) w.push('No dispel — vulnerable to long-duration debuffs');
  if (roleBalance < 6) w.push('Role coverage is incomplete — some positions unfilled');
  if (picks.filter(h => h.complexity === 3).length >= 3) w.push('High execution requirement — three complex heroes');
  if (picks.length >= 3 && picks.every(h => h.attack === 'melee')) w.push('Full melee lineup — vulnerable to kiting and ranged harass');
  if (picks.filter(h => h.utilityTags.includes('scaling')).length >= 3 && !picks.some(h => h.utilityTags.includes('lane_pressure'))) {
    w.push('Too late-game — enemy may snowball before you come online');
  }
  return w.slice(0, 6);
}

// ─── Ban phase threat ranking ─────────────────────────────────────────────────

export function rankBanThreats(
  myPickIds: number[],
  enemyPickIds: number[],
  availableIds: number[],
  heroPool: Hero[] = LOCAL_HEROES,
  primaryWinCon?: WinConditionResult,
  deps: ScoringDeps = {},
): BanThreat[] {
  const getApiCounterThreats = deps.getApiCounterThreats ?? NO_API_THREATS;
  const metaBanBoost = deps.metaBanBoost ?? NO_META_BOOST;

  const myPicks = myPickIds.map(id => heroPool.find(h => h.id === id)!).filter(Boolean);
  const enemyPicks = enemyPickIds.map(id => heroPool.find(h => h.id === id)!).filter(Boolean);
  const available = availableIds.map(id => heroPool.find(h => h.id === id)!).filter(Boolean);

  // API-based win rate threats (blended in)
  const apiThreats = getApiCounterThreats(myPickIds, availableIds, 20);
  const apiMap = new Map(apiThreats.map(t => [t.heroId, t]));

  const results: BanThreat[] = [];

  for (const hero of available) {
    let score = 0;
    const reasons: string[] = [];

    // 1. Direct counters to my picks (from static interaction data)
    for (const myPick of myPicks) {
      const ix = INTERACTIONS.find(
        x => x.heroId === hero.id && x.targetHeroId === myPick.id && x.counterScore !== undefined,
      );
      if (ix && ix.counterScore! >= 7) {
        score += ix.counterScore! * 2;
        reasons.push(ix.reason);
      } else if (ix && ix.counterScore! >= 5) {
        score += ix.counterScore!;
        reasons.push(ix.reason);
      }
    }

    // 2. Synergy with enemy picks
    for (const enemyPick of enemyPicks) {
      const ix = INTERACTIONS.find(
        x => ((x.heroId === hero.id && x.targetHeroId === enemyPick.id) ||
               (x.heroId === enemyPick.id && x.targetHeroId === hero.id)) &&
             x.synergyScore !== undefined,
      );
      if (ix && ix.synergyScore! >= 8) {
        score += ix.synergyScore!;
        reasons.push(`${hero.displayName} + enemy ${enemyPick.displayName}: ${ix.reason}`);
      } else if (ix && ix.synergyScore! >= 6) {
        score += Math.round(ix.synergyScore! * 0.6);
      }
    }

    // 3. Win-condition-specific threats
    if (primaryWinCon) {
      switch (primaryWinCon.id) {
        case 'teamfight':
          if (hero.name === 'silencer') { score += 20; reasons.push('Global Silence cancels your entire combo window — must ban'); }
          if (hero.name === 'doom_bringer') { score += 15; reasons.push('Doom on your initiator prevents the fight from starting'); }
          if (hero.utilityTags.includes('silence') && hero.utilityTags.includes('initiation')) { score += 8; reasons.push('Silence disrupts combo timing'); }
          break;
        case 'lategame':
          if (hero.name === 'ancient_apparition') { score += 20; reasons.push('Ice Blast counters all healing/sustain carries — #1 priority ban'); }
          if (hero.name === 'doom_bringer') { score += 15; reasons.push('Doom disables your carry\'s items and removes key abilities'); }
          break;
        case 'deathball':
          if (hero.name === 'timbersaw') { score += 12; reasons.push('Timbersaw can stall your push indefinitely in trees'); }
          if (hero.name === 'batrider') { score += 10; reasons.push('Batrider disrupts your grouped push and lassoes key heroes'); }
          if (hero.name === 'natures_prophet') { score += 8; reasons.push('Nature\'s Prophet backdoors while your team is pushing'); }
          break;
        case 'physical_domination':
          if (hero.name === 'phantom_lancer') { score += 12; reasons.push('PL illusions make your armor shred and single-target hits ineffective'); }
          if (hero.name === 'naga_siren') { score += 10; reasons.push('Naga illusions spread your physical damage too thin'); }
          if (hero.name === 'ancient_apparition') { score += 8; reasons.push('Ice Blast prevents your cores from sustaining through fights'); }
          break;
        case 'pickoff':
          if (hero.utilityTags.includes('save') && hero.complexity >= 2) { score += 10; reasons.push(`${hero.displayName} saves the targets you're trying to kill`); }
          break;
      }
    }

    // 4. High-impact heroes that are always dangerous (floor score)
    if (hero.utilityTags.includes('initiation') && hero.utilityTags.includes('lockdown')) {
      score += 6;
      if (!reasons.length) reasons.push(`${hero.displayName} provides game-winning initiation and lockdown`);
    }

    // 5. Blend in API win-rate data if available
    const apiData = apiMap.get(hero.id);
    if (apiData && apiData.score > 0) {
      score += apiData.score;
      if (apiData.winRateNote && !reasons.some(r => r.includes('win rate'))) {
        reasons.push(apiData.winRateNote);
      }
    }

    // 6. Mid matchup threat — if any of my picks play mid, this hero beats them
    const myMid = myPicks.find(h => h.metaRole === 'pos2' || h.preferredRoles.includes('mid'));
    if (myMid) {
      const midAdv = matchupAdvantage(hero.id, myMid.id);
      if (midAdv >= 3) {
        score += midAdv * 3;
        const note = getMidMatchupNote(hero.id, myMid.id);
        reasons.push(note ?? `Beats your mid ${myMid.displayName} hard in lane`);
      } else if (midAdv >= 2) {
        score += midAdv * 2;
      }
    }

    // 7. Pro meta boost — S-tier / contested heroes get elevated regardless of static data
    const metaBoost = metaBanBoost(hero.id);
    if (metaBoost.boost > 0) {
      score += metaBoost.boost;
      if (metaBoost.note && reasons.length < 3) reasons.push(metaBoost.note);
    }

    if (score <= 0) continue;

    const urgency: BanThreatUrgency = score >= 30 ? 'critical' : score >= 15 ? 'high' : 'medium';
    results.push({
      heroId: hero.id,
      score,
      urgency,
      reasons: [...new Set(reasons)].slice(0, 3),
      winRateNote: apiData?.winRateNote,
    });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 8);
}

// ─── Draft health analysis ────────────────────────────────────────────────────

function computeDraftHealth(
  picks: Hero[],
  enemyPicks: Hero[],
  roleAssignments: Record<number, Role>,
): DraftHealthReport {
  const byRole = (r: Role) => picks.filter(h => effectiveRole(h, roleAssignments) === r);
  const carry    = byRole('carry')[0];
  const mid      = byRole('mid')[0];
  const offlaner = byRole('offlane')[0];
  const supports = [...byRole('support'), ...byRole('hard_support')];

  // ── Rune control ──────────────────────────────────────────────────────────────
  const mobileSupports = supports.filter(h =>
    h.utilityTags.includes('mobility') || h.utilityTags.includes('rotate'));
  const killThreatSupports = supports.filter(h =>
    h.utilityTags.includes('stun') || h.utilityTags.includes('lockdown') || h.utilityTags.includes('burst'));

  let runeRating: HealthRating;
  let runeDetail: string;
  if (mobileSupports.length > 0) {
    runeRating = 'strong';
    runeDetail = `${mobileSupports[0].displayName} can cover both rune spots — contest every power rune at 2/4/6 min`;
  } else if (killThreatSupports.length > 0) {
    runeRating = 'decent';
    runeDetail = `${killThreatSupports[0].displayName} can fight for runes but lacks mobility to cover both sides`;
  } else if (mid?.utilityTags.includes('mobility')) {
    runeRating = 'decent';
    runeDetail = `Rely on ${mid.displayName} to contest mid runes; ward both sides aggressively`;
  } else {
    runeRating = 'weak';
    runeDetail = 'No mobile supports — power rune control is limited; buy additional wards for rune vision';
  }
  const runeControl: HealthNote = { label: 'Rune Control', rating: runeRating, detail: runeDetail };

  // ── Gate rotations ─────────────────────────────────────────────────────────
  // Dota 2 New Frontiers map has portal gates — mobile heroes use them for cross-map pressure
  const mobileHeroes = picks.filter(h =>
    h.utilityTags.includes('mobility') || h.utilityTags.includes('rotate') || h.utilityTags.includes('global'));
  const globalHero = picks.find(h => h.utilityTags.includes('global'));

  let gateRating: HealthRating;
  let gateDetail: string;
  if (globalHero) {
    gateRating = 'strong';
    gateDetail = `${globalHero.displayName} bypasses gates entirely — instant cross-map threat without needing to commit`;
  } else if (mobileHeroes.length >= 2) {
    gateRating = 'strong';
    gateDetail = `${mobileHeroes.slice(0, 2).map(h => h.displayName).join(' + ')} can appear on either side of the map quickly — abuse outpost gates for unexpected pressure`;
  } else if (mobileHeroes.length === 1) {
    gateRating = 'decent';
    gateDetail = `${mobileHeroes[0].displayName} uses gates effectively; slower teammates should TP and follow rather than run`;
  } else {
    gateRating = 'weak';
    gateDetail = 'Slow lineup — gate usage telegraphs position; use TPs and vision instead of gate commits';
  }
  const gateRotations: HealthNote = { label: 'Gate Rotations', rating: gateRating, detail: gateDetail };

  // ── Mid rotation ──────────────────────────────────────────────────────────────
  let midRating: HealthRating;
  let midDetail: string;
  if (!mid) {
    midRating = 'weak';
    midDetail = 'No mid assigned';
  } else if (mid.utilityTags.includes('mobility') && (mid.utilityTags.includes('initiation') || mid.utilityTags.includes('burst'))) {
    midRating = 'strong';
    midDetail = `${mid.displayName} can rotate for kills after level 6 — high map pressure through midgame`;
  } else if (mid.utilityTags.includes('mobility') || mid.utilityTags.includes('rotate') || mid.utilityTags.includes('initiation')) {
    midRating = 'decent';
    midDetail = `${mid.displayName} can rotate situationally — secure lane first, then look for smoke ganks`;
  } else if (mid.utilityTags.includes('scaling')) {
    midRating = 'weak';
    midDetail = `${mid.displayName} is a farming mid — don't rotate; focus on fast core items`;
  } else {
    midRating = 'weak';
    midDetail = `${mid.displayName} has limited rotation value — winning the mid lane itself is this hero's contribution`;
  }
  const midRotation: HealthNote = { label: 'Mid Rotation', rating: midRating, detail: midDetail };

  // ── Blink breakers ────────────────────────────────────────────────────────────
  // Heroes expected to rush Blink Dagger and break laning phase around 10–15 min
  const blinkBreakers: string[] = [];
  for (const hero of picks) {
    const role = effectiveRole(hero, roleAssignments);
    const isNonCarry = role !== 'carry';
    if (isNonCarry && (hero.utilityTags.includes('initiation') ||
        (hero.utilityTags.includes('mobility') && role === 'offlane'))) {
      blinkBreakers.push(hero.displayName);
    }
  }

  // ── Combo callouts ────────────────────────────────────────────────────────────
  const combos: ComboCallout[] = [];
  const ids = picks.map(h => h.id);

  // High-synergy interaction pairs
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const ix = INTERACTIONS.find(x =>
        ((x.heroId === ids[i] && x.targetHeroId === ids[j]) ||
         (x.heroId === ids[j] && x.targetHeroId === ids[i])) &&
        x.synergyScore !== undefined && x.synergyScore >= 8,
      );
      if (ix) {
        const h1 = picks.find(h => h.id === ids[i])!;
        const h2 = picks.find(h => h.id === ids[j])!;
        combos.push({ type: ix.synergyType ?? 'wombo_combo', heroes: [h1.displayName, h2.displayName], note: ix.reason });
      }
      if (combos.length >= 3) break;
    }
    if (combos.length >= 3) break;
  }

  // Physical + armor synergy (if not already caught)
  if (computePhysicalStack(picks) >= 2 && !combos.some(c => c.type === 'armor_reduction')) {
    const armorReducer = picks.find(h => h.utilityTags.includes('armor_reduction'));
    const physCore = picks.find(h =>
      (h.attribute === 'agility' || h.utilityTags.includes('scaling')) && h !== armorReducer);
    if (armorReducer && physCore) {
      combos.push({
        type: 'armor_reduction', heroes: [armorReducer.displayName, physCore.displayName],
        note: `${armorReducer.displayName} armor shred + ${physCore.displayName} right-click — buy Desolator early to amplify`,
      });
    }
  }

  // Double nukes
  const nukers = picks.filter(h => h.utilityTags.includes('burst'));
  if (nukers.length >= 2 && combos.length < 4 && !combos.some(c =>
    c.heroes.includes(nukers[0].displayName) && c.heroes.includes(nukers[1].displayName))) {
    combos.push({
      type: 'control_damage', heroes: nukers.slice(0, 2).map(h => h.displayName),
      note: `${nukers.slice(0, 2).map(h => h.displayName).join(' + ')}: double nuke can delete a squishy hero in under 2 seconds`,
    });
  }

  // Save + initiator (counter-engagement)
  const saver = picks.find(h => h.utilityTags.includes('save'));
  const initiator = picks.find(h => h.utilityTags.includes('initiation'));
  if (saver && initiator && combos.length < 4 && !combos.some(c => c.heroes.includes(saver.displayName))) {
    combos.push({
      type: 'save_enable', heroes: [initiator.displayName, saver.displayName],
      note: `${initiator.displayName} opens the fight; ${saver.displayName} saves overextended teammates — counter-engagement ability`,
    });
  }

  // ── Farm balance ──────────────────────────────────────────────────────────────
  // Count heroes in core roles (not just filled slots) so greedy core-heavy drafts
  // (e.g. two carries) are detected.
  const coreCount = byRole('carry').length + byRole('mid').length + byRole('offlane').length;
  const supCount = supports.length;
  let farmRating: HealthRating;
  let farmDetail: string;

  if (picks.length < 3) {
    farmRating = 'decent';
    farmDetail = `${picks.length}/5 picks made — assign roles to evaluate balance`;
  } else if (coreCount >= 4) {
    farmRating = 'warning';
    farmDetail = `${coreCount} farm-dependent heroes — extreme early vulnerability with little protective support`;
  } else if (coreCount >= 3 && supCount >= 2) {
    farmRating = 'strong';
    farmDetail = '3 cores + 2 supports — balanced structure with clear roles';
  } else if (coreCount === 2 && supCount >= 3) {
    farmRating = 'decent';
    farmDetail = '2 cores, 3 supports — support-heavy; confirm damage output is sufficient for late game';
  } else if (coreCount <= 1 && picks.length >= 4) {
    farmRating = 'weak';
    farmDetail = 'Only 1 core — limited late-game damage; supports must win fights independently';
  } else if (coreCount >= 3 && supCount < 2) {
    farmRating = 'warning';
    farmDetail = `${coreCount} cores with only ${supCount} support${supCount === 1 ? '' : 's'} — no protection; high-risk laning phase`;
  } else {
    farmRating = 'decent';
    farmDetail = `${coreCount} cores, ${supCount} supports — check role assignments for balance`;
  }
  const farmBalance: HealthNote = { label: 'Farm Balance', rating: farmRating, detail: farmDetail };

  // ── Flex / out-of-meta warning ────────────────────────────────────────────────
  let flexWarning: string | null = null;
  const outOfMeta = picks.filter(h => {
    if (!roleAssignments[h.id]) return false;
    const meta = h.metaRole ? META_TO_ROLE[h.metaRole] : null;
    return meta && roleAssignments[h.id] !== meta;
  });
  if (outOfMeta.length >= 2) {
    flexWarning = `${outOfMeta.map(h => h.displayName).join(', ')} playing outside typical positions — flex drafts require high coordination and lose to lane bullies`;
  } else if (picks.length >= 5 && coreCount >= 4) {
    flexWarning = `${coreCount} heroes in core positions — too many farm requirements; expect a punishing laning phase`;
  }

  // ── Lane avoids ───────────────────────────────────────────────────────────────
  const laneAvoids: { hero: string; advice: string }[] = [];
  for (const hero of [carry, mid, offlaner].filter(Boolean) as Hero[]) {
    let worstEnemy: Hero | null = null;
    let worstAdv = -1;
    for (const enemy of enemyPicks) {
      const adv = matchupAdvantage(enemy.id, hero.id);
      if (adv > worstAdv) { worstAdv = adv; worstEnemy = enemy; }
    }
    if (worstAdv >= 3 && worstEnemy) {
      const role = effectiveRole(hero, roleAssignments);
      const advice = role === 'carry'
        ? `${hero.displayName} vs ${worstEnemy.displayName}: request deep wards and look for jungle/cut waves — do not trade spells`
        : role === 'mid'
          ? `${hero.displayName} vs ${worstEnemy.displayName}: control rune timings and call for a rotation to reset the matchup`
          : `${hero.displayName} is outmatched by ${worstEnemy.displayName}: play for XP, not kills; look for a fast rotation out`;
      laneAvoids.push({ hero: hero.displayName, advice });
    }
  }

  return { runeControl, gateRotations, midRotation, blinkBreakers, combos: combos.slice(0, 4), farmBalance, flexWarning, laneAvoids };
}

// ─── Game plan timeline ───────────────────────────────────────────────────────

function buildGamePlanTimeline(
  picks: Hero[],
  enemyPicks: Hero[],
  winCon: WinConditionResult,
  powerWindow: PowerWindow,
  draftHealth: DraftHealthReport,
  roleAssignments: Record<number, Role>,
): GamePlanTimeline {
  const byRole = (r: Role) => picks.filter(h => effectiveRole(h, roleAssignments) === r);
  const carry    = byRole('carry')[0];
  const mid      = byRole('mid')[0];
  const offlaner = byRole('offlane')[0];
  const hardSup  = byRole('hard_support')[0];
  const softSup  = byRole('support')[0];

  const enemyCarry = enemyPicks.find(h =>
    effectiveRole(h, roleAssignments) === 'carry' || h.metaRole === 'pos1');

  const stance = (score: number): TempoStance =>
    score >= 7 ? 'aggressive' : score <= 3 ? 'defensive' : 'neutral';

  const phases: GamePlanPhase[] = [];

  // ── Phase 1 — Laning (0–10 min) ────────────────────────────────────────────
  const laningActions: string[] = [];
  const lanes: string[] = [];
  if (carry)    lanes.push(`${carry.displayName}${hardSup ? ` + ${hardSup.displayName}` : ''} safe`);
  if (mid)      lanes.push(`${mid.displayName} mid`);
  if (offlaner) lanes.push(`${offlaner.displayName}${softSup ? ` + ${softSup.displayName}` : ''} off`);
  if (lanes.length) laningActions.push(`Set up ${lanes.join(' · ')}`);

  // Aggressive kill lanes when the early game is strong
  const earlyTempo = stance(powerWindow.early);
  if (earlyTempo === 'aggressive') {
    const aggressors = picks.filter(h =>
      h.utilityTags.includes('lane_pressure') || h.utilityTags.includes('stun') || h.utilityTags.includes('burst'));
    if (aggressors.length > 0) {
      laningActions.push(`Pressure kills with ${aggressors.slice(0, 2).map(h => h.displayName).join(' + ')} — deny enemy farm and snowball leads`);
    }
  }
  if (draftHealth.runeControl.rating !== 'weak') {
    laningActions.push(draftHealth.runeControl.detail);
  } else {
    laningActions.push('Buy extra wards for rune vision — your supports can\'t contest both spots');
  }
  if (draftHealth.laneAvoids.length > 0) {
    laningActions.push(draftHealth.laneAvoids[0].advice);
  } else if (carry && enemyCarry) {
    const carrySafe = matchupAdvantage(carry.id, enemyCarry.id);
    if (carrySafe >= 2) laningActions.push(`${carry.displayName} should win the lane vs ${enemyCarry.displayName} — farm aggressively`);
  }

  phases.push({
    id: 'laning', range: '0–10 min', label: 'Laning Phase',
    tempo: earlyTempo, isPeak: powerWindow.peak === 'early',
    headline:
      earlyTempo === 'aggressive' ? 'Punish lanes now — your draft peaks early'
      : earlyTempo === 'defensive' ? 'Survive the lane and scale toward your timing'
      : 'Win your lanes and set up the mid-game',
    actions: laningActions.slice(0, 4),
  });

  // ── Phase 2 — Power Spikes (10–20 min) ─────────────────────────────────────
  const earlyMidActions: string[] = [];
  if (draftHealth.blinkBreakers.length > 0) {
    earlyMidActions.push(`${draftHealth.blinkBreakers.slice(0, 2).join(' / ')} finish Blink Dagger ~12 min — that's your cue to start grouping for fights`);
  }
  if (draftHealth.midRotation.rating === 'strong' && mid) {
    earlyMidActions.push(`${mid.displayName} rotates after level 6 — smoke for kills on the sidelanes`);
  } else if (draftHealth.gateRotations.rating === 'strong') {
    earlyMidActions.push(draftHealth.gateRotations.detail);
  }
  const firstCombo = draftHealth.combos[0];
  if (firstCombo) {
    earlyMidActions.push(`First fights: land ${firstCombo.heroes.join(' + ')} together — ${firstCombo.note}`);
  }
  if (winCon.id === 'deathball' || winCon.id === 'splitpush') {
    earlyMidActions.push('Take the first tier-1 tower to open the map and start your snowball');
  } else {
    earlyMidActions.push('Stack and pull camps for supports; secure the first tier-1 with a coordinated push');
  }

  const midTempo = stance(powerWindow.mid);
  phases.push({
    id: 'early', range: '10–20 min', label: 'Power Spikes',
    tempo: midTempo, isPeak: false,
    headline:
      draftHealth.blinkBreakers.length > 0
        ? 'Group on Blink timings — turn lane leads into objectives'
        : 'Transition lane advantage into towers and pickoffs',
    actions: earlyMidActions.slice(0, 4),
  });

  // ── Phase 3 — Objectives & Fights (20–30 min) ──────────────────────────────
  const midGameActions: string[] = [];
  switch (winCon.id) {
    case 'teamfight':
      midGameActions.push('Force 5-man fights around Roshan and tier-2 towers — never get caught split');
      break;
    case 'deathball':
      midGameActions.push('Siege as a unit — after every won fight push immediately to the next tier');
      break;
    case 'pickoff':
      midGameActions.push('Smoke through the map, pick off an isolated hero, then take a free objective');
      break;
    case 'lategame':
      midGameActions.push('Avoid coinflip fights — take the safe farm and only fight with a clear advantage');
      break;
    case 'splitpush':
      midGameActions.push('Apply pressure on both sides — make them choose which push to answer');
      break;
    case 'physical_domination':
      midGameActions.push('Group with armor-shred active and run them down in straight fights');
      break;
    default:
      midGameActions.push('Play around your strongest heroes and contest key objectives');
  }
  // Roshan
  const roshHero = picks.find(h => h.utilityTags.includes('roshan'));
  if (roshHero) {
    midGameActions.push(`${roshHero.displayName} enables an early Roshan — take Aegis before a high-ground push`);
  } else if (winCon.id !== 'lategame') {
    midGameActions.push('Contest the 20–25 min Roshan with smoke + vision before committing high ground');
  }
  // Enemy timing warning
  const enemyScaler = enemyPicks.find(h => h.utilityTags.includes('scaling'));
  if (enemyScaler && powerWindow.peak !== 'late') {
    midGameActions.push(`Close before enemy ${enemyScaler.displayName} comes online — every minute past 30 favours them`);
  }

  const midGameTempo = winCon.id === 'lategame' ? 'defensive' : stance(powerWindow.mid);
  phases.push({
    id: 'mid', range: '20–30 min', label: 'Objectives & Fights',
    tempo: midGameTempo, isPeak: powerWindow.peak === 'mid',
    headline: winCon.id === 'lategame'
      ? 'Stall and farm — deny their timing, reach your own'
      : `Execute your ${winCon.label.toLowerCase()} — this is your window`,
    actions: midGameActions.slice(0, 4),
  });

  // ── Phase 4 — Late Game (35+ min) ──────────────────────────────────────────
  const lateActions: string[] = [];
  if (carry) {
    lateActions.push(`${carry.displayName} should have 3+ core items — play through them, don't fight without your carry`);
  }
  const hasSave = picks.some(h => h.utilityTags.includes('save'));
  const saver = picks.find(h => h.utilityTags.includes('save'));
  if (hasSave && saver && carry) {
    lateActions.push(`Hold ${saver.displayName}'s save for ${carry.displayName} in every fight`);
  }
  lateActions.push('Buy Back-to-base discipline: don\'t throw on bad buybacks — one lost late fight can end the game');
  if (powerWindow.peak === 'late') {
    lateActions.push('You out-scale them — take methodical high-ground sieges with BKBs and vision');
  } else {
    lateActions.push('If still alive here, group tight and look for one decisive fight before they out-scale you');
  }

  const lateTempo = stance(powerWindow.late);
  phases.push({
    id: 'late', range: '35+ min', label: 'Late Game',
    tempo: lateTempo, isPeak: powerWindow.peak === 'late',
    headline: powerWindow.peak === 'late'
      ? 'Your time — close out methodically'
      : 'Danger zone — end it or steal one fight',
    actions: lateActions.slice(0, 4),
  });

  const winBy =
    powerWindow.peak === 'early' ? 'Close the game by ~25 min — your draft fades hard after that'
    : powerWindow.peak === 'mid' ? 'Close the game by ~35 min before the late-game timing slips'
    : null;

  return { phases, winBy };
}

// ─── Main exported function ───────────────────────────────────────────────────

export function analyzeTeam(
  myPickIds: number[],
  enemyPickIds: number[],
  availableHeroIds: number[],
  heroPool: Hero[] = LOCAL_HEROES,
  roleAssignments: Record<number, Role> = {},
  pickContext: PickContext | null = null,
): TeamAnalysis {
  const myPicks = myPickIds.map(id => heroPool.find(h => h.id === id)!).filter(Boolean);
  const enemyPicks = enemyPickIds.map(id => heroPool.find(h => h.id === id)!).filter(Boolean);

  // Raw scores
  const synergyScore = computeSynergyScore(myPickIds);
  const counterScore = computeCounterScore(myPickIds, enemyPickIds);
  const roleBalanceScore = computeRoleBalance(myPicks, roleAssignments);
  const laneScore = roleBalanceScore;
  const timingScore = computeTimingScore(myPicks);
  const objectiveScore = computeObjectiveScore(myPicks);
  const { score: utilityCoverageScore, missing: missingUtility } = computeUtilityCoverage(myPicks);
  const totalScore = synergyScore + counterScore + laneScore + roleBalanceScore +
    timingScore + objectiveScore + utilityCoverageScore;

  // Enriched
  const physicalStackScore = computePhysicalStack(myPicks);
  const laneMatchups = computeLaneMatchups(myPicks, enemyPicks);
  const rawPairs = getSynergyPairs(myPickIds);
  const synergyPairs: SynergyPair[] = rawPairs.map(p => ({
    heroIds: p.heroIds, type: p.type, label: synergyTypeLabel(p.type),
  }));
  const flexPicks = myPicks.filter(h => h.flexRoles && h.flexRoles.length > 1).map(h => h.id);

  // Capability profile — single source of truth for win conditions + the radar.
  const capabilities = computeTeamCapabilities(myPicks, physicalStackScore);
  const traits = computeTeamTraits(myPicks);

  // Win conditions (a named summary of the capability profile)
  const winConditions = detectWinConditions(myPicks, physicalStackScore, capabilities);
  const powerWindow = computePowerWindow(myPicks);
  const laneVerdict = computeLaneVerdict(myPicks, roleAssignments);
  const { rating, label: ratingLabel } = computeVerdict(myPicks, winConditions, laneVerdict);
  const primaryWinCondition = winConditions[0] ?? {
    id: 'teamfight' as WinConditionId, label: 'No clear win condition',
    strength: 0, description: 'Pick more heroes to identify a win condition.',
    gameplan: 'Pick heroes with a coherent strategy in mind.',
  };
  const gameplan = buildGameplan(primaryWinCondition, powerWindow, laneVerdict, myPicks, enemyPicks, roleAssignments);
  const keyThreats = buildKeyThreats(primaryWinCondition, myPicks, enemyPicks);
  const keyBans = buildKeyBans(primaryWinCondition, myPicks, enemyPicks);
  const strengths = buildStrengths(myPicks, synergyScore, counterScore, physicalStackScore);
  const weaknesses = buildWeaknesses(missingUtility, roleBalanceScore, myPicks);

  const predictions = buildLanePredictions(myPicks, enemyPicks, roleAssignments);
  laneVerdict.predictions = predictions;

  const coachNarrative = buildCoachNarrative(
    myPicks, enemyPicks, primaryWinCondition, powerWindow, weaknesses, roleAssignments,
  );

  const draftVerdict: import('./types').DraftVerdict = {
    rating,
    ratingLabel,
    primaryWinCondition,
    secondaryWinCondition: winConditions[1],
    powerWindow,
    laneVerdict,
    coachNarrative,
    gameplan,
    keyThreats,
    keyBans,
  };

  const draftHealth = computeDraftHealth(myPicks, enemyPicks, roleAssignments);
  const gamePlanTimeline = buildGamePlanTimeline(
    myPicks, enemyPicks, primaryWinCondition, powerWindow, draftHealth, roleAssignments,
  );
  const heroFreedom = analyzeHeroFreedom(myPicks, enemyPicks);

  return {
    totalScore, synergyScore, counterScore, laneScore, roleBalanceScore,
    timingScore, objectiveScore, utilityCoverageScore,
    strengths, weaknesses, missingUtility,
    laneMatchups, physicalStackScore, synergyPairs, flexPicks,
    draftVerdict,
    draftHealth,
    gamePlanTimeline,
    heroFreedom,
    capabilities,
    traits,
    recommendedPicks: rankPicks(myPickIds, enemyPickIds, availableHeroIds, myPicks, missingUtility, laneVerdict, roleAssignments, heroPool, pickContext),
  };
}

function synergyTypeLabel(type: import('./types').SynergyType): string {
  const m: Record<import('./types').SynergyType, string> = {
    armor_reduction: 'Armor Shred', control_damage: 'Control + Damage',
    save_enable: 'Save / Enable', wombo_combo: 'Wombo Combo',
    push_siege: 'Push / Siege', roshan: 'Roshan Control',
    lane_dominant: 'Lane Dominance', buff_aura: 'Aura / Buff',
    global: 'Global Threat', illusion_synergy: 'Illusion Synergy',
  };
  return m[type] ?? type;
}

// ─── Recommendation engines ───────────────────────────────────────────────────

function rankPicks(
  myIds: number[], enemyIds: number[], availableIds: number[],
  currentPicks: Hero[], missingUtility: UtilityTag[],
  laneVerdict: LaneVerdictResult, assignments: Record<number, Role>,
  heroPool: Hero[], pickContext: PickContext | null = null,
): HeroRecommendation[] {
  const available = availableIds.map(id => heroPool.find(h => h.id === id)).filter(Boolean) as Hero[];
  const hasMid = currentPicks.some(h => effectiveRole(h, assignments) === 'mid');
  const enemyMids = enemyIds.map(id => heroPool.find(h => h.id === id)).filter(Boolean)
    .filter(h => h!.preferredRoles.includes('mid') || h!.metaRole === 'pos2') as Hero[];

  // Flex-aware role coverage: which roles are still genuinely needed, accounting
  // for the fact that flex picks can shift to free a slot.
  const currentOptionSets = currentPicks.map(h => roleOptions(h, assignments));
  const baseCovered = coveredRoles(currentOptionSets);
  const stillOpen = ROLE_LIST.filter(r => !baseCovered.has(r));

  // Capability-aware suggestions: fill the comp's gaps, extend its leads, and keep
  // the damage/space mix sane. Needs a partial comp (≥2 picks) to be meaningful.
  const capActive = currentPicks.length >= 2;
  const myCaps = capActive ? computeTeamCapabilities(currentPicks, computePhysicalStack(currentPicks)) : null;
  const myTraits = capActive ? computeTeamTraits(currentPicks) : null;
  const gapAxes = myCaps ? CAPABILITY_ORDER.filter(id => myCaps[id].score <= 3) : [];
  const leadAxes = myCaps ? CAPABILITY_ORDER.filter(id => myCaps[id].score >= 7) : [];

  return available.map(hero => {
    let score = 0;
    const reasons: string[] = [];
    let tag: string | undefined;

    // Synergy
    const synReasons = getSynergyReasons(hero.id, myIds);
    if (synReasons.length > 0) { score += synReasons.length * 3; reasons.push(...synReasons.slice(0, 1)); }

    // Counter
    const cntReasons = getCounterReasons(hero.id, enemyIds);
    if (cntReasons.length > 0) { score += cntReasons.length * 4; reasons.push(...cntReasons.slice(0, 1)); }

    // Mid matchup
    if (!hasMid && (hero.preferredRoles.includes('mid') || hero.metaRole === 'pos2')) {
      for (const em of enemyMids) {
        const adv = matchupAdvantage(hero.id, em.id);
        if (adv >= 2) {
          score += adv * 3;
          reasons.push(getMidMatchupNote(hero.id, em.id) ?? `Wins mid vs ${em.displayName}`);
          tag = 'mid matchup';
        } else if (adv <= -2) score -= 3;
      }
    }

    // Lane partner
    for (const allyId of myIds) {
      const lp = getLanePartnerScore(hero.id, allyId);
      if (lp >= 7) {
        score += lp;
        const ally = heroPool.find(h => h.id === allyId);
        if (ally) reasons.push(`Strong lane partner with ${ally.displayName}`);
      }
    }

    // Missing utility
    for (const tag2 of missingUtility) {
      if (hero.utilityTags.includes(tag2)) { score += 5; reasons.push(`Adds ${tag2.replace('_', ' ')}`); break; }
    }

    // Role coverage — does this pick fill a still-open role, and does it keep flex?
    if (stillOpen.length > 0) {
      const candOptions = roleOptions(hero, {});
      const withCand = coveredRoles([...currentOptionSets, candOptions]);
      const fillsGap = withCand.size > baseCovered.size;
      const openFillable = candOptions.filter(r => stillOpen.includes(r));
      if (fillsGap) {
        const filled = openFillable[0] ?? [...withCand].find(r => !baseCovered.has(r));
        score += 8;
        if (filled) reasons.push(`Fills the open ${filled.replace('_', ' ')} slot`);
        if (openFillable.length >= 2) {
          score += 3;
          tag = tag ?? 'flex';
          reasons.push(`Flexible — can cover ${openFillable.map(r => r.replace('_', ' ')).join(' or ')}`);
        }
      } else {
        // Team still needs roles but this hero structurally fills none — deprioritise.
        score -= 4;
      }
    }

    // Safe lane needs
    if (laneVerdict.safeLane.needs.length > 0 &&
        (hero.utilityTags.includes('save') || hero.utilityTags.includes('heal'))) {
      score += 6;
      reasons.push('Provides save/sustain for safe lane carry');
      tag = 'safe lane';
    }

    // Capability-aware: fill gaps, extend leads, balance damage, create space. The
    // single most salient insight is surfaced as a prominent reason (capReason).
    let capReason: string | undefined;
    if (myCaps && myTraits) {
      const cand = computeTeamCapabilities([...currentPicks, hero], computePhysicalStack([...currentPicks, hero]));

      // 1) Fill the biggest capability gap (largest improvement on a weak axis).
      let bestGap: { id: CapabilityAxisId; delta: number } | null = null;
      for (const id of gapAxes) {
        const delta = cand[id].score - myCaps[id].score;
        if (delta > 0 && (!bestGap || delta > bestGap.delta)) bestGap = { id, delta };
      }
      if (bestGap) {
        score += Math.min(bestGap.delta, 4) + 1;
        capReason = `Fills your ${CAPABILITY_LABELS[bestGap.id].toLowerCase()} gap`;
        tag = tag ?? 'fills gap';
      }

      // 2) Create space for a greedy comp (or discourage another farmer).
      const greedy = myTraits.space.rating === 'no_space' || myTraits.space.rating === 'user_heavy';
      const space = spaceRoleOf(hero);
      if (greedy && space === 'provider') {
        score += 3; capReason = capReason ?? 'Creates space for your farming cores'; tag = tag ?? 'creates space';
      } else if (greedy && space === 'user') score -= 3;

      // 3) Balance a lopsided damage profile (easy to itemize against otherwise).
      const dt = damageTypeOf(hero);
      if (myTraits.damage.dominant === 'physical' && (dt === 'magical' || dt === 'pure')) {
        score += 3; capReason = capReason ?? 'Adds magical damage — your lineup is mostly physical';
      } else if (myTraits.damage.dominant === 'magical' && dt === 'physical') {
        score += 3; capReason = capReason ?? 'Adds physical damage — your lineup is mostly magical';
      }

      // 4) Otherwise, extend an existing strength.
      if (!bestGap) {
        let bestLead: { id: CapabilityAxisId; delta: number } | null = null;
        for (const id of leadAxes) {
          const delta = cand[id].score - myCaps[id].score;
          if (delta > 0 && (!bestLead || delta > bestLead.delta)) bestLead = { id, delta };
        }
        if (bestLead) { score += 2; capReason = capReason ?? `Doubles down on your ${CAPABILITY_LABELS[bestLead.id].toLowerCase()} lead`; }
      }
    }

    // Draft-position timing — counterable heroes want a protected (late) slot.
    let timing: PickTiming | undefined;
    if (pickContext) {
      const frag = getHeroFragility(hero);
      if (pickContext.enemyPicksAfter === 0) {
        // Protected slot: the enemy can no longer respond — commit counterable heroes here.
        if (frag === 'fragile') {
          score += 6; timing = 'commit_now';
          reasons.push('Free game — pick here; the enemy can no longer draft a counter');
        } else timing = 'safe_now';
      } else if (pickContext.isMyLastPick) {
        // Your final pick — you must commit it; there's no later slot to save for.
        timing = 'commit_now';
        if (frag === 'fragile') {
          reasons.push(`Your last pick — commit it (${pickContext.enemyPicksAfter} enemy pick${pickContext.enemyPicksAfter === 1 ? '' : 's'} can still respond)`);
        }
      } else if (frag === 'fragile') {
        score -= 4; timing = 'save_for_later';
        reasons.push("Counterable — risky now; save for a later pick when the enemy can't respond");
      } else if (frag === 'resilient') {
        score += 2; timing = 'safe_now';
        reasons.push('Resilient — safe to commit early');
      } else timing = 'safe_now';
    }

    // Surface the capability insight prominently (right after the top reason).
    const base = [...new Set(reasons)];
    const finalReasons = (capReason
      ? [...new Set([base[0], capReason, ...base.slice(1)].filter(Boolean))]
      : base) as string[];
    return { heroId: hero.id, score, reasons: finalReasons.slice(0, 3), tag, timing };
  })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
