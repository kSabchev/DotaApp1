// Team Identity (beta): reads the five picks as a cast — who fights constantly,
// who fights around big cooldowns, who lives on the other side of the map —
// and flags misalignment (no initiator, too many greedy farmers, no frontline).
//
// The greed note is the NARRATIVE voice of the space economy computed in
// shared/heroTraits.ts (which keeps the counts-and-balance voice): it reads the
// same provider data, so the two panels can never contradict each other — a
// greedy cast with a space-creator is an "info" plan, not a warning.
import type { Hero, Playstyle, Role, TeamIdentity, TeamIdentityMember, TeamIdentityNote } from './types';
import { getHeroPlaystyles } from './heroPlaystyles';
import { computeTeamTraits } from './heroTraits';

const names = (ms: TeamIdentityMember[]) => ms.map(m => m.displayName).join(', ');
const ids = (ms: TeamIdentityMember[]) => ms.map(m => m.heroId);

export function computeTeamIdentity(picks: Hero[], assignments: Record<number, Role> = {}): TeamIdentity {
  const members: TeamIdentityMember[] = picks.map(h => ({
    heroId: h.id,
    displayName: h.displayName,
    playstyles: getHeroPlaystyles(h),
  }));

  const counts: Partial<Record<Playstyle, number>> = {};
  for (const m of members) {
    for (const p of m.playstyles) counts[p] = (counts[p] ?? 0) + 1;
  }

  const withStyle = (...styles: Playstyle[]) =>
    members.filter(m => styles.some(s => m.playstyles.includes(s)));

  const notes: TeamIdentityNote[] = [];

  // ── greed: heroes that want the map to themselves before they fight ──
  // Severity follows the space economy: space-creators on the draft downgrade
  // "too greedy" to a plan ("they buy the farm time") instead of a warning.
  const traits = computeTeamTraits(picks);
  const providers = picks.filter(h => traits.space.providerIds.includes(h.id));
  const providerNames = providers.map(h => h.displayName).join(', ');
  const farmers = withStyle('greedy_farmer', 'split_map_farmer');
  if (farmers.length >= 3 && providers.length === 0) {
    notes.push({
      kind: 'greed', severity: 'warning', headline: 'Draft too greedy',
      detail: `${names(farmers)} all want farm before they fight and nobody creates space for them — the enemy only has to force early tempo.`,
      heroIds: ids(farmers),
    });
  } else if (farmers.length >= 3) {
    notes.push({
      kind: 'greed', severity: 'info', headline: 'Greedy, but supported',
      detail: `${names(farmers)} all want farm — ${providerNames} must stay active to buy it; protect that plan and don't fight without them.`,
      heroIds: [...ids(farmers), ...providers.map(h => h.id)],
    });
  } else if (farmers.length > 0) {
    notes.push({
      kind: 'greed', severity: 'good', headline: 'Healthy greed level',
      detail: `${names(farmers)} can be given space without starving the rest of the draft.`,
      heroIds: ids(farmers),
    });
  }

  // ── initiation: someone has to start the fight ──
  const initiators = withStyle('initiator');
  if (picks.length >= 4 && initiators.length === 0) {
    notes.push({
      kind: 'initiation', severity: 'warning', headline: 'No initiator',
      detail: 'Nobody starts the fight on your terms — you will be reacting to the enemy’s engagements.',
      heroIds: [],
    });
  } else if (initiators.length > 0) {
    notes.push({
      kind: 'initiation', severity: 'good', headline: 'Initiation covered',
      detail: `${names(initiators)} can open fights on your timing.`,
      heroIds: ids(initiators),
    });
  }

  // ── line balance: frontline vs backline ──
  const front = withStyle('frontline');
  const back = withStyle('backline');
  if (picks.length >= 4 && front.length === 0 && back.length >= 2) {
    notes.push({
      kind: 'line_balance', severity: 'warning', headline: 'No frontline',
      detail: `${names(back)} deliver from range but nobody absorbs damage in front of them.`,
      heroIds: ids(back),
    });
  } else if (picks.length >= 4 && back.length === 0 && front.length >= 3) {
    notes.push({
      kind: 'line_balance', severity: 'info', headline: 'All frontline',
      detail: 'Plenty of bodies at the front, but little ranged delivery behind them — fights may lack damage from safety.',
      heroIds: ids(front),
    });
  } else if (front.length > 0 && back.length > 0) {
    notes.push({
      kind: 'line_balance', severity: 'good', headline: 'Front-to-back balance',
      detail: `${names(front)} hold the front while ${names(back)} deliver from behind.`,
      heroIds: [...ids(front), ...ids(back)],
    });
  }

  // ── fighting rhythm: constant skirmishing vs cooldown windows ──
  const constant = withStyle('constant_fighter');
  const cooldown = withStyle('cooldown_fighter');
  if (constant.length >= 2 && cooldown.length === 0) {
    notes.push({
      kind: 'fighting_rhythm', severity: 'info', headline: 'Always fighting',
      detail: `${names(constant)} skirmish nonstop — keep the game chaotic and never let the enemy farm in peace.`,
      heroIds: ids(constant),
    });
  } else if (cooldown.length >= 2 && constant.length === 0) {
    notes.push({
      kind: 'fighting_rhythm', severity: 'info', headline: 'Fights on cooldowns',
      detail: `${names(cooldown)} fight around big ultimates — force fights when they are up, avoid them when they are down.`,
      heroIds: ids(cooldown),
    });
  } else if (constant.length >= 1 && cooldown.length >= 1) {
    notes.push({
      kind: 'fighting_rhythm', severity: 'info', headline: 'Mixed rhythm',
      detail: `${names(constant)} keep constant pressure; ${names(cooldown)} join when the big cooldowns are ready.`,
      heroIds: [...ids(constant), ...ids(cooldown)],
    });
  }

  // ── map presence: split-map and global heroes ──
  const splitMap = withStyle('split_map_farmer');
  const globals = withStyle('global_presence');
  if (splitMap.length > 0 || globals.length > 0) {
    const parts: string[] = [];
    if (splitMap.length) parts.push(`${names(splitMap)} ${splitMap.length === 1 ? 'lives' : 'live'} on the other side of the map`);
    if (globals.length) parts.push(`${names(globals)} ${globals.length === 1 ? 'threatens' : 'threaten'} cross-map plays`);
    notes.push({
      kind: 'map_presence', severity: 'info', headline: 'Map spread',
      detail: parts.join('; ') + '.',
      heroIds: [...new Set([...ids(splitMap), ...ids(globals)])],
    });
  }

  // ── support mobility: do the pos4/5s move around the map? ──
  // User-assigned roles (the role board) take precedence over the hero's
  // default metaRole — a hero repositioned to support counts as one.
  const isSupport = (h: Hero): boolean => {
    const assigned = assignments[h.id];
    if (assigned) return assigned === 'support' || assigned === 'hard_support';
    return h.metaRole === 'pos4' || h.metaRole === 'pos5';
  };
  const supports = picks.filter(isSupport);
  if (supports.length >= 2) {
    const roamers = supports.filter(h =>
      members.find(m => m.heroId === h.id)?.playstyles.includes('roamer'),
    );
    if (roamers.length > 0) {
      notes.push({
        kind: 'support_mobility', severity: 'good', headline: 'Active support cast',
        detail: `${roamers.map(h => h.displayName).join(', ')} roam to make plays across the map.`,
        heroIds: roamers.map(h => h.id),
      });
    } else {
      notes.push({
        kind: 'support_mobility', severity: 'info', headline: 'Lane-bound supports',
        detail: 'Your supports prefer staying with their cores — expect less early map pressure.',
        heroIds: supports.map(h => h.id),
      });
    }
  }

  // warnings → info → good
  const order: Record<string, number> = { warning: 0, info: 1, good: 2 };
  notes.sort((a, b) => order[a.severity] - order[b.severity]);

  // ── summary narrative ──
  let summary = '';
  if (members.length === 0) {
    summary = 'No picks yet.';
  } else {
    const bits: string[] = [];
    if (constant.length && cooldown.length) {
      bits.push(`${names(constant)} keep the fighting constant while ${names(cooldown)} swing fights with big cooldowns`);
    } else if (constant.length) {
      bits.push(`this cast wants to fight from the first minute (${names(constant)})`);
    } else if (cooldown.length) {
      bits.push(`this cast fights in bursts around its big cooldowns (${names(cooldown)})`);
    }
    if (splitMap.length) bits.push(`${names(splitMap)} farm the far side of the map`);
    if (farmers.length >= 3) {
      bits.push(providers.length > 0
        ? `the draft is greedy — ${providerNames} must make its space`
        : 'the draft is greedy and nothing creates space for it');
    }
    summary = bits.length
      ? bits.join('; ') + '.'
      : 'A flexible cast without one dominant identity — adapt to how the game flows.';
    summary = summary.charAt(0).toUpperCase() + summary.slice(1);
  }

  return { members, counts, notes, summary };
}
