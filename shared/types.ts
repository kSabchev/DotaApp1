export type Attribute = 'strength' | 'agility' | 'intelligence' | 'universal';

export type Role =
  | 'carry'
  | 'mid'
  | 'offlane'
  | 'support'
  | 'hard_support';

export type MetaRole = 'pos1' | 'pos2' | 'pos3' | 'pos4' | 'pos5' | 'flex';

export type UtilityTag =
  | 'stun'
  | 'silence'
  | 'save'
  | 'dispel'
  | 'wave_clear'
  | 'tower_damage'
  | 'roshan'
  | 'initiation'
  | 'mobility'
  | 'scaling'
  | 'aura_carrier'
  | 'lane_pressure'
  | 'heal'
  | 'vision'
  | 'lockdown'
  | 'burst'
  | 'armor_reduction'
  | 'buff'
  | 'enable'
  | 'rotate'
  | 'global';

export type SynergyType =
  | 'armor_reduction'
  | 'control_damage'
  | 'save_enable'
  | 'wombo_combo'
  | 'push_siege'
  | 'roshan'
  | 'lane_dominant'
  | 'buff_aura'
  | 'global'
  | 'illusion_synergy';

export type CounterType =
  | 'mobility'
  | 'silence'
  | 'illusion_counter'
  | 'channel_disrupt'
  | 'burst'
  | 'kite'
  | 'sustain_counter'
  | 'mana_burn'
  | 'armor_shred'
  | 'vision';

// ─── Win condition system ────────────────────────────────────────────────────

export type WinConditionId =
  | 'teamfight'    // 5-man AoE lockdown + burst
  | 'deathball'    // push objectives as a unit
  | 'pickoff'      // catch isolated heroes
  | 'splitpush'    // rat / backdoor pressure
  | 'lategame'     // outscale, survive until big items
  | 'physical_domination'; // armor reduction + right-click stack

export interface WinConditionResult {
  id: WinConditionId;
  label: string;
  strength: number;    // 0–10
  description: string;
  gameplan: string;    // one-sentence "how to execute"
}

export interface PowerWindow {
  early: number;   // 0–10
  mid: number;
  late: number;
  peak: 'early' | 'mid' | 'late';
  earlyLabel: string;
  midLabel: string;
  lateLabel: string;
}

// ─── Team capability profile ─────────────────────────────────────────────────
// A structured "what this comp can and can't do" vector. Each axis is 0–10 with
// the heroes driving it. Win conditions and the radar both read from this.

export type CapabilityAxisId =
  | 'teamfight'   // AoE lockdown + burst for 5v5
  | 'pickoff'     // find and execute isolated heroes
  | 'gank'        // early roam pressure — enemy can't farm/show safely
  | 'push'        // tower / siege pressure
  | 'splitpush'   // map spread, side-lane threat
  | 'waveClear'   // clear and hold creep waves
  | 'roshan'      // take Roshan early and reliably
  | 'sustain'     // heal / save / peel to survive
  | 'enable'      // buffs and auras that amplify allies
  | 'scaling'     // outscale into the late game
  | 'damage';     // raw damage threat (amount; type lands in a later phase)

export interface CapabilityAxis {
  id: CapabilityAxisId;
  label: string;
  score: number;          // 0–10
  contributors: number[]; // heroIds driving this axis
  note: string;           // short "what this enables / what's missing"
}

export type CapabilityProfile = Record<CapabilityAxisId, CapabilityAxis>;

// ─── Team traits (Phase 2): damage type, space economy, Roshan reliance ───────

export type DamageType = 'physical' | 'magical' | 'pure' | 'mixed';

export interface DamageProfile {
  physical: number;  // weighted hero counts (mixed splits half/half)
  magical: number;
  pure: number;
  dominant: 'physical' | 'magical' | 'pure' | 'balanced';
  note: string;
}

export interface SpaceBalance {
  providerIds: number[]; // heroes that create space/pressure
  userIds: number[];     // heroes that need farm + protection to scale
  rating: 'balanced' | 'user_heavy' | 'no_space' | 'neutral';
  note: string;
}

export interface TeamTraits {
  damage: DamageProfile;
  space: SpaceBalance;
  roshanReliantIds: number[];
  roshanNote: string;
}

// ─── Hero playstyles & team identity (beta) ───────────────────────────────────
// How a hero actually wants to play the game — used to check whether the five
// picks form a coherent "cast" (who fights, who farms, who makes space).

export type Playstyle =
  | 'constant_fighter'   // skirmishes from level 1 on short cooldowns
  | 'cooldown_fighter'   // fights around a big ult window (Magnus, Enigma, Void)
  | 'split_map_farmer'   // lives on the other side of the map (Spectre, AM, NP)
  | 'greedy_farmer'      // needs farm + protection before contributing
  | 'initiator'          // starts the fight
  | 'frontline'          // absorbs damage at the front
  | 'backline'           // delivers from range, must be protected
  | 'roamer'             // support that leaves lane to make plays
  | 'tempo_controller'   // dictates mid-game pace off early item/level spikes
  | 'global_presence';   // cross-map pressure via global spells/TP plays

export type IdentityNoteKind =
  | 'fighting_rhythm'    // constant vs cooldown fighting mix
  | 'map_presence'       // split-map / global heroes
  | 'initiation'         // is there someone to start fights?
  | 'line_balance'       // frontline vs backline
  | 'greed'              // too many farm-dependent heroes
  | 'support_mobility';  // do the supports move around the map?

export type IdentitySeverity = 'good' | 'info' | 'warning';

export interface TeamIdentityMember {
  heroId: number;
  displayName: string;
  playstyles: Playstyle[];
}

export interface TeamIdentityNote {
  kind: IdentityNoteKind;
  severity: IdentitySeverity;
  headline: string;   // "No initiator", "Draft too greedy"
  detail: string;     // full sentence naming the heroes involved
  heroIds: number[];
}

export interface TeamIdentity {
  members: TeamIdentityMember[];
  counts: Partial<Record<Playstyle, number>>;
  notes: TeamIdentityNote[];  // warnings first, then info, then good
  summary: string;            // 1–2 sentence cast narrative
}

// ─── Lane analysis ───────────────────────────────────────────────────────────

export interface LaneSummary {
  heroIds: number[];
  verdict: string;
  needs: string[];
  strength: number;  // 0–10
}

export interface LanePrediction {
  lane: 'safe' | 'mid' | 'off' | 'roam';
  label: string;
  heroIds: number[];
  strength: number;       // 0–10
  verdict: string;        // "Strong kill threat — Frostbite into Axe Call"
  synergyNote?: string;   // synergy between the lane heroes
  counterNote?: string;   // "Puck hard counters enemy Storm mid"
  enemyHeroIds: number[]; // enemy heroes likely in same lane
  needs: string[];        // gaps or warnings
}

export interface LaneVerdictResult {
  safeLane: LaneSummary;
  midLane: LaneSummary & { heroId?: number };
  offLane: LaneSummary;
  rotationSupport: { heroIds: number[]; canRotate: boolean; note: string };
  overallScore: number;  // 0–10
  missingRoles: Role[];
  predictions: LanePrediction[];  // rich per-lane analysis with names
}

// ─── Draft verdict ───────────────────────────────────────────────────────────

export type VerdictRating = 'dominant' | 'strong' | 'solid' | 'needs_work' | 'incomplete';

export interface DraftVerdict {
  rating: VerdictRating;
  ratingLabel: string;
  primaryWinCondition: WinConditionResult;
  secondaryWinCondition?: WinConditionResult;
  powerWindow: PowerWindow;
  laneVerdict: LaneVerdictResult;
  coachNarrative: string;    // single plain-English paragraph like a coach's whiteboard
  gameplan: string[];        // ordered bullet points
  keyThreats: string[];
  keyBans: string[];
}

// ─── Draft health ────────────────────────────────────────────────────────────

export type HealthRating = 'strong' | 'decent' | 'weak' | 'warning';

export interface HealthNote {
  label: string;
  rating: HealthRating;
  detail: string;
}

export interface ComboCallout {
  type: string;
  heroes: string[];
  note: string;
}

export interface DraftHealthReport {
  runeControl: HealthNote;
  gateRotations: HealthNote;
  midRotation: HealthNote;
  blinkBreakers: string[];          // heroes expected to buy Blink and break laning
  combos: ComboCallout[];           // notable hero synergy combos
  farmBalance: HealthNote;
  flexWarning: string | null;       // >2 out-of-meta or flex picks warning
  laneAvoids: { hero: string; advice: string }[];  // bad matchups → avoid/cut/jungle
}

// ─── Game plan timeline ───────────────────────────────────────────────────────

// How a team should play a given window of the game.
export type TempoStance = 'aggressive' | 'neutral' | 'defensive';

export interface GamePlanPhase {
  id: 'laning' | 'early' | 'mid' | 'late';
  range: string;        // "0–10 min"
  label: string;        // "Laning Phase"
  tempo: TempoStance;   // how to play this window
  isPeak: boolean;      // is this the team's power peak?
  headline: string;     // one-line priority for the window
  actions: string[];    // hero-specific bullet actions (2–4)
}

export interface GamePlanTimeline {
  phases: GamePlanPhase[];
  winBy: string | null;   // e.g. "Close the game by 35 min" — null if this is a late-game lineup
}

// ─── Hero freedom ("free game" vs. disrupted by counters) ─────────────────────

// How badly a hero's game collapses when its counters are on the board.
export type Fragility = 'resilient' | 'normal' | 'fragile';

// How free a picked hero is to play their game given the enemy draft.
export type FreedomStatus = 'free' | 'minor' | 'contested' | 'shut_down';

export interface HeroCounter {
  enemyId: number;
  enemyName: string;
  reason: string;
  severity: number;   // 0–10, before fragility weighting
}

export interface HeroFreedom {
  heroId: number;
  status: FreedomStatus;
  fragility: Fragility;
  counters: HeroCounter[];   // strongest first, capped
  note: string;
}

// ─── Hero types ──────────────────────────────────────────────────────────────

export interface Hero {
  id: number;
  name: string;
  displayName: string;
  attribute: Attribute;
  roles: Role[];
  preferredRoles: Role[];
  flexRoles?: Role[];
  metaRole?: MetaRole;
  attack: 'melee' | 'ranged';
  complexity: 1 | 2 | 3;
  strengths: string[];
  weaknesses: string[];
  powerSpikes: string[];
  utilityTags: UtilityTag[];
  needs: string[];
  imageUrl?: string;
}

export interface HeroInteraction {
  heroId: number;
  targetHeroId: number;
  synergyScore?: number;
  counterScore?: number;
  laneMatchupScore?: number;
  lanePartnerScore?: number;
  reason: string;
  synergyType?: SynergyType;
  counterType?: CounterType;
  laneNote?: string;
  midMatchupNote?: string;
}

export type DraftPhase = 'ban' | 'pick';
export type DraftTeam = 'radiant' | 'dire';

export interface DraftSlot {
  phase: DraftPhase;
  team: DraftTeam;
  heroId: number | null;
}

// A complete, loadable draft snapshot. Lives in shared/ so showcase drafts and
// (later) server-side persistence use the exact shape the frontend stores.
export type DraftOutcome = 'radiant_win' | 'dire_win' | 'unknown';

export interface SavedDraft {
  id: string;
  name: string;
  notes: string;
  outcome: DraftOutcome;
  savedAt: number;
  // Snapshot of the slot array (preserves pick/ban order and team)
  slots: DraftSlot[];
  mode: 'captains' | 'manual';
  startingTeam: DraftTeam;
  roleAssignments: Record<number, Role>;
}

export interface LaneMatchupResult {
  heroId: number;
  enemyHeroId: number;
  advantage: number;
  note: string;
  isMid: boolean;
  dataBacked?: boolean;  // true when live win-rate data contributed to the advantage
}

export interface SynergyPair {
  heroIds: [number, number];
  type: SynergyType;
  label: string;
}

// When (in the pick order) it's wisest to commit a hero, given how counterable it is.
export type PickTiming = 'commit_now' | 'safe_now' | 'save_for_later';

// The draft-position context for a team's next pick.
export interface PickContext {
  enemyPicksAfter: number;  // enemy picks remaining after this team's next pick
  myPicksAfter: number;     // this team's own picks remaining after the next one
  isMyLastPick: boolean;
}

export interface HeroRecommendation {
  heroId: number;
  score: number;
  reasons: string[];
  tag?: string;
  timing?: PickTiming;
}

export interface TeamAnalysis {
  // Raw component scores (used internally, de-emphasized in UI)
  synergyScore: number;
  counterScore: number;
  laneScore: number;
  roleBalanceScore: number;
  timingScore: number;
  objectiveScore: number;
  utilityCoverageScore: number;
  totalScore: number;

  // Enriched analysis
  strengths: string[];
  weaknesses: string[];
  missingUtility: UtilityTag[];
  laneMatchups: LaneMatchupResult[];
  physicalStackScore: number;
  synergyPairs: SynergyPair[];
  flexPicks: number[];

  // Win conditions, verdict, and strategic health
  draftVerdict: DraftVerdict;
  draftHealth: DraftHealthReport;
  gamePlanTimeline: GamePlanTimeline;
  heroFreedom: HeroFreedom[];
  capabilities: CapabilityProfile;
  traits: TeamTraits;
  identity: TeamIdentity;

  // Recommendations
  recommendedPicks: HeroRecommendation[];
}

export interface DraftState {
  slots: DraftSlot[];
  currentSlotIndex: number;
  radiantPicks: number[];
  direPicks: number[];
  bans: number[];
  history: { slotIndex: number; heroId: number }[];
  mode: 'captains' | 'manual';
  phase: 'drafting' | 'complete';
}
