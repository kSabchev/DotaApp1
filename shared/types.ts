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

export interface LaneMatchupResult {
  heroId: number;
  enemyHeroId: number;
  advantage: number;
  note: string;
  isMid: boolean;
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

  // Recommendations
  recommendedPicks: HeroRecommendation[];
  recommendedBans: HeroRecommendation[];
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
