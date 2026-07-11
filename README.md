# Dota 2 Draft Analyzer

A real-time Dota 2 drafting assistant with live analysis, meta context, and scouting history.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Vite 8 + React + TypeScript |
| State | Redux Toolkit + RTK Query |
| Styling | Tailwind CSS v3 (PostCSS, pure-JS — no native binary) |
| Backend | Express + TypeScript |
| Data | OpenDota API (heroes, matchups, hero stats) |

## Running Locally

```bash
# Backend (port 3001)
cd backend && npm run dev

# Frontend (port 5173)
cd frontend && npm run dev
```

## Tests

Smoke + integration tests for the core logic (the "brain"), using Node's
built-in test runner via `ts-node` — no native test deps (keeps it working
under Windows Application Control on `D:\`).

```bash
cd backend && npm test          # scoring, item matcher, matchup grades,
                                # win model, logreg/metrics, + API health/404
```

Type-check (also runs in `npm run build`):

```bash
cd frontend && npx tsc -p tsconfig.app.json --noEmit
cd backend  && npx tsc --noEmit
```

The matcher tests double as living documentation of the counter-item rules
(Silver Edge breaks passives, MKB pierces evasion, Eul's interrupts charges, …).

## Deployment

The backend is stateless at runtime (the SQLite corpus is only used by the
offline ingest/train/backtest scripts), so deployment is a static frontend
host (Vercel) + one small always-on Node service (Render). Both the API base
URL (`VITE_API_BASE`) and the CORS allowlist (`CORS_ORIGIN`) are
environment-configurable and default to the local dev setup when unset. See
[DEPLOY.md](./DEPLOY.md) for the full step-by-step runbook.

---

## Feature Changelog

### Session 1 — MVP
- Captains Mode + Manual draft modes
- Pick/ban flow with phase indicator and slot order
- Hero grid with search, attribute filter (STR/AGI/INT/UNI), and role filter tabs
- Heroes disabled/greyed after being picked or banned
- Live team analysis panel with 7 score categories (synergy, counter, lane, roles, timing, objectives, utility)
- Strengths, weaknesses, and missing utility detection
- Recommended picks and bans with per-hero reasons
- Post-draft summary with narrative (early/mid/late game plans)
- Undo last pick, reset draft

### Session 2 — Backend + Real Hero Data
- Express backend (port 3001) proxying OpenDota API
- All 124 heroes loaded from OpenDota with real Steam CDN portraits
- `HeroDataLoader` merges live hero list with rich local metadata
- `TeamTags` component: utility tag chips, power timing bar, complexity indicator
- TeamTags shown in live TeamPanel and post-draft DraftSummary
- `DraftImport` modal: enter a match ID → fetch and replay a real pro draft
- Backend endpoints:
  - `GET /api/heroes` — full hero list (1hr cache)
  - `GET /api/heroes/stats` — pub + bracket stats (6hr cache)
  - `GET /api/heroes/:id/matchups` — per-hero matchup win rates (24hr cache)

### Session 3 — Smart Analysis Engine
**Win condition system**
- Replaced flat score with named win conditions: `teamfight`, `deathball`, `pickoff`, `splitpush`, `lategame`, `physical_domination`
- Primary + secondary win condition detection with strength score (0–10)
- Power window: early / mid / late peak timing per team

**Coach narrative (Feature 3)**
- Plain-English "whiteboard" paragraph: *"Your draft wins through teamfight at 20–30 minutes. You have initiation (Puck). You are vulnerable: lacks reliable crowd control."*
- Numbered gameplan steps, key threats, priority bans

**Lane predictions (Feature 4)**
- Per-lane cards (Safe / Mid / Off) with hero portraits vs enemy
- Strength pip dots, natural-language verdict, synergy/counter notes
- Role-aware: improves as users click role badges on heroes
- `LanePredictionsPanel` component

**Ban threat scoring (Feature 5)**
- `rankBanThreats()` produces ranked list of heroes to ban
- Factors: static counter data, synergy with enemy picks, win-condition-specific threats, OpenDota matchup win rates, high-impact floor score
- Urgency tiers: Must Ban (red) / High (orange) / Consider (grey)
- Shows "← Ban one of these now" during ban phase

**Expanded interaction data (Feature 6)**
- Grown from ~80 to 250+ hero interaction pairs
- Covers: Batrider lasso combos, Disruptor kinetic field, Winter Wyvern wombo, Gyro teamfight, Terrorblade synergies, Spectre + Io, full QoP/Silencer/Doom/TA matchup tables

**OpenDota matchup integration**
- `matchupService.ts`: fetches `/heroes/:id/matchups`, converts win rates to advantage scores (−5 to +5)
- `primeMatchups()` pre-fetches data in the background as picks are made
- Degrades gracefully if backend is unavailable

### Session 4 — Layout & Comparison
**Side-by-side comparison view (Feature 8)**
- Both teams analyzed simultaneously — no more toggle
- `ComparisonPanel` (horizontal bar below hero grid):
  - Advantage banner with point margin
  - Hero portrait rows for both teams
  - Win condition cards side-by-side (icon, label, peak timing)
  - 6 dual metric bars: Fight, Counter, Timing, Lanes, Roles, Objectives
  - Lane advantage (Safe / Mid / Off) with directional arrows
- Layout restructured to 3 true columns:
  - **Left (w-64):** Radiant TeamPanel + Radiant AnalysisPanel
  - **Center (flex-1):** BanPanel + HeroGrid + ComparisonPanel
  - **Right (w-64):** Dire TeamPanel + Dire AnalysisPanel

### Session 5 — Meta Context
- `metaService.ts` fetches hero stats on app boot
- Uses Divine + Immortal bracket data (brackets 7 + 8) as proxy for pro-level meta
- Classifies every hero into a tier:
  - **S** (yellow) — dominant pick rate + >53% win rate
  - **CT** (red) — very high pick rate, frequently banned
  - **A** (blue) — solid win rate in high-bracket play
  - **N** (purple) — low pick rate but exceptional win rate (sleeper)
- Tier badge pinned to top-right corner of every `HeroPortrait`
- `rankBanThreats()` boosted by tier: S +18, CT +10, A +4
- `BanThreatsPanel` shows "Immortal: 55% wr · 72% rel. pick" line on non-normal heroes

### Session 6 — Saved Drafts / History
- `draftStorage.ts`: localStorage CRUD (`dota2_draft_history` key)
- `SaveDraftModal`: name, outcome (TBD / Radiant Won / Dire Won), scouting notes
- `DraftHistoryPanel`:
  - Lists all saved drafts newest-first
  - Search bar (appears when >3 drafts)
  - Each card: draft name, date, outcome badge, hero portraits per team, notes
  - **Load Draft** restores full slot state + role assignments to Redux
  - **Delete** with inline confirmation step
- `loadDraft()` action added to `draftSlice`
- **Save** and **History** buttons added to top bar

### Session 7 — Data Layer & Trained Win Model
**SQLite match corpus**
- `backend/src/db/index.ts`: schema (`matches`, `match_heroes`, `ingest_progress`), `saveMatch()`, `loadMatchesForBacktest()`
- Ingest scripts: `npm run ingest -- pub 4 60` (public matches, rank ≥60) / `npm run ingest -- pro 800`
- 1 500+ pro matches ingested from OpenDota `/proMatches` + `/matches/:id`

**Logistic regression win model**
- L2-regularised full-batch gradient descent (`backend/src/model/logreg.ts`)
- Feature space: hero ±1 indicator + synergy/counter pair features above a min-count threshold (`features.ts`)
- 5-fold cross-validation with OOF logit collection; temperature calibration (T = 1.405) via grid search (`calibrate.ts`, `train.ts`)
- Result: AUC 0.577, log-loss 0.6817 (vs 0.690 baseline) on pro matches
- Saved as `backend/data/model_opendota_pro_pairs.json`
- `GET /api/model` serves the trained model JSON (in-memory cached)
- Backtest command: `npm run backtest [-- pub|pro]`

**Win model wired into app**
- `frontend/src/data/winModelService.ts`: loads model on boot, exposes `getRadiantWinProbability(radiant, dire)`
- `ComparisonPanel`: shows "LIVE · PARTIAL" / "WIN PROBABILITY" bar once model is ready (visible at ≥4v4)
- `DraftSummary`: large percentage banner (e.g. 58% / 42%) with animated bar; falls back to heuristic text if model not loaded
- Model footnote: match count, dataset type, "draft signal only"

### Session 8 — Item & Mechanic Matchup Layer
**Shared modules (`shared/`)**
- `mechanics.ts`: 18 `Mechanic` types, 9 `Reliance` types, `RELIANCE_ANSWERS` map, `MECHANIC_LABEL`, `MECHANIC_COUNTERS`
- `items.ts`: ~40 `ItemDef` entries tagged with mechanics/timing/builtBy; `itemIconUrl(key)` → Steam CDN; `pickItemForMechanic()`
- `heroMechanics.ts`: full 127-hero mechanic profiles (reliance vulnerabilities per hero)
- `matchups.ts`: `computeItemMatchups(myPicks, enemyPicks)` — symmetric per-hero buyer assignment + threat detection
- `matchupGrades.ts`: four 0–10 graded scales (Team Synergy, Lane Duos, Lane vs Enemy, Game Counters); `gradeMatchups()`
- `heroPool.ts`: builds Hero objects from OpenDota raw data + local metadata
- `winModel.ts`: `predictRadiantWinProb(model, radiant, dire)` — pure predictor used by both backend and frontend

**New backend endpoints**
- `GET /api/heroes/:id/items` — itemPopularity from OpenDota (24hr cache)
- `GET /api/items` — OpenDota item constants (id → key/name map)

**New frontend panels (added to DraftSummary)**
- `MatchupItemPanel`: "Items to Build vs Enemy" — recommended items with role chips and core badges
- `MatchupGradesPanel`: four grade bars + "They counter your heroes" portrait row
- `HeroBuildPanel`: per-hero typical build (start › early › mid › late phases) from OpenDota itemPopularity; consumables filtered out
- `ItemTablePanel`: Counter-Item Reference modal (opened via "Items" top-bar button); searchable by item name or mechanic; grouped by category
- `AnalysisPanel`: also shows MatchupItemPanel + MatchupGradesPanel in the live side-column view

### Session 9 — Role Assignment & Live Draft Centre
**Role assignment system**
- `RolePicker.tsx`: click-to-open dropdown per hero (5 roles); shows metaRole suggestion with "?" when unassigned; dispatches `assignRole` to Redux
- `DraftRoleBoard.tsx`: centre-screen board during draft showing both teams with role pickers, FLEX badges, and per-team "missing role" hints
- `DraftScreen.tsx`: DraftRoleBoard shown below hero grid whenever any pick exists; `ComparisonPanel` gated at ≥4v4
- `DraftSummary.tsx`: RolePicker under each hero portrait; `analyzeTeam` useMemo deps include `JSON.stringify(roleAssignments)` so re-analysis triggers on role change
- Redux `draftSlice`: `roleAssignments: Record<number, Role>` field + `assignRole` action

**CM pick/ban order fix**
- Updated to current patch: 14 bans + 10 picks (24-slot sequence), correct radiant/dire interleaving

### Session 10 — Editable Item Builds
- `HeroBuildPanel.tsx` rewritten with per-hero edit mode (session-only overrides):
  - **Edit / Done** toggle button per hero (amber highlight when active)
  - **Remove** — × button overlaid on each item icon
  - **Reorder** — ◀ ▶ arrows beneath each item, move within phase
  - **Add** — `+` button per phase opens a searchable dropdown populated from `/api/items` constants; filters as-you-type; autofocused input
  - **Reset** — "reset" link appears when override is active; reverts to OpenDota popularity data
- `heroBuildService.ts`: added `getItemConstants()` export for the picker
- Overrides stored in local `useState` (session-only; no Redux persistence needed)

### Session 11 — Strategic Coaching Layer
**Confirm Roles & sharper verdict**
- "Confirm Roles & Reanalyze" button below each team's heroes in `DraftSummary`; highlights gold once all roles are assigned, turns green after confirming, and stays clickable so roles can be re-confirmed after a fix
- Auto-resets confirmation when role assignments change (tracked via `useRef`)
- `buildGameplan`, `buildKeyThreats`, `buildKeyBans` rewritten to be **hero-name-specific and enemy-draft-aware** — they scan the actual enemy picks (e.g. names Silencer's Global Silence, AA's Ice Blast) and build a hero-specific combo execution chain rather than emitting static generic strings

**Rotations & Draft Health (`DraftHealthPanel`)**
- `computeDraftHealth()` in `shared/scoring.ts` produces a per-team report:
  - **Rune Control / Gate Rotations / Mid Rotation / Farm Balance** — each rated strong/decent/weak/warning with a hero-specific detail line
  - **Blink Breakers** — non-carry heroes expected to rush Blink Dagger and break the laning phase
  - **Key Combos** — notable high-synergy pairs (armor-shred, double-nuke, save+initiation) with execution notes
  - **Flex Warning** — flags 2+ out-of-meta/flex picks or too many cores
  - **Avoid / Adapt** — lanes that lose hard to a named enemy, with role-specific advice

**Game Plan Timeline (`GamePlanTimelinePanel`)**
- `buildGamePlanTimeline()` turns win-condition + power-window + draft-health data into a **minute-by-minute execution plan** across four phases:
  - **0–10 min Laning** · **10–20 min Power Spikes** · **20–30 min Objectives & Fights** · **35+ min Late Game**
  - Each phase carries a tempo stance (aggressive / steady / defensive), a ⚡ Power Peak marker on the team's strongest window, a one-line headline, and 2–4 hero-specific action bullets (lane setup, Blink timings, Roshan windows, BKB discipline)
  - A "Close the game by ~N min" badge appears for early/mid-peak lineups
- Both panels render inside each team column in `DraftSummary`, below the draft verdict card

### Session 12 — Bug-fix pass
- **Match import roles** — imported drafts (OpenDota carries no lane data) now get a clean 1:1 role assignment via `inferRoles()` (optimal 5×5 fit), so lane/gameplan/timeline analysis is correct instead of showing duplicate carries / "No mid assigned"
- **Role dropdown** — `RolePicker` now renders its menu through a `createPortal` with viewport-clamped fixed positioning (flips up, measures real height) so it's never clipped — fixes the cut-off dropdown when only one hero is drafted
- **Two-team role awareness** — lane predictions and the game-plan timeline now honour the enemy's assigned roles too (both read the global `roleAssignments` map), so editing either team's positions updates the matchups
- **Hero-ID data fix** — `shared/interactions.ts` + `shared/heroes.ts` were re-keyed from a legacy custom hero-ID scheme to real OpenDota IDs, so synergy/counter/combo/ban lookups resolve to the correct heroes (e.g. Chronosphere combos now belong to Faceless Void, not Tidehunter). Every `heroId` block was audited against its reason text. *Note: this corrected the displayed analysis but did not move the heuristic backtest AUC — that limitation is structural to the scoring, not the IDs.*

### Session 13 — Data hardening
- **Interactions re-keyed by name** — `shared/interactions.ts` now authors every entry as readable short-names (`{ hero: 'faceless_void', target: 'earthshaker', … }`) resolved to OpenDota IDs at load via a canonical `HERO_IDS` table. An unknown name throws on import, so the silent ID-mismatch bug class can no longer recur, and the table is human-auditable. Downstream consumers are unchanged (runtime `INTERACTIONS` still carry numeric `heroId`/`targetHeroId`).
- **Partner-ID audit** — confirmed the only hero appearing solely as a combo *partner* (Morphling) is referenced correctly; combined with the re-key this closes the wrong-ID class on both sides.
- **Stale comments** stripped (block comments no longer cite dead custom IDs)
- **Dead `Invoker (QW)`** placeholder hero removed from `heroes.ts` / `heroMetadata.ts` (it shadowed Warlock's real ID 37 in the local fallback pool)
- **Import dialog** example match ID updated to a live one
- New `data.test.ts` case asserts every interaction resolves to a valid hero ID with no self-references

### Session 14 — Coaching-layer tests
- `draftPlanning.test.ts` covers the role/coaching functions in `shared/scoring.ts`: `inferRoles` (1:1 assignment, no duplicate roles, empty input), `computeDraftHealth` (farm-balance ratings, blink-breakers, combo callouts — via `analyzeTeam().draftHealth`), and `buildGamePlanTimeline` (four ordered phases, exactly one peak, `winBy` deadlines — via `analyzeTeam().gamePlanTimeline`)
- **Bug found & fixed by the tests:** `computeDraftHealth` derived `coreCount` from the three *filled core slots* (max 3), so the "4 farm-dependent heroes" farm-balance warning and the flex-warning were dead code. It now counts core *heroes*, so greedy core-heavy drafts (e.g. two carries) are flagged. (42 tests total)

### Session 15 — Free Game Check (counter-sensitivity)
First slice of the "draft brain" direction: which picked heroes get a **free game** vs. are **disrupted** by the enemy draft, weighted by how badly a given hero minds counters.
- `shared/heroFreedom.ts` — `analyzeHeroFreedom(myPicks, enemyPicks)` → per-hero `{ status, fragility, counters[], note }`. Counter signal is **hybrid**:
  1. hand-curated hero↔hero counters (`interactions.ts` `getCounter` — score + reason)
  2. **mechanic-based** — the hero's `reliance`/`vulnerable` (`heroMechanics.ts`) answered by an enemy whose kit natively provides that mechanic (`MECHANIC_PROVIDERS`), e.g. Bounty Hunter's detection vs Riki's invisibility
- **Fragility** (`resilient` / `normal` / `fragile`) scales severity — a fragile hero is shut down by a counter a resilient one plays through. Hand overrides (`HERO_FRAGILITY`, ~30 heroes) take priority; otherwise derived from the mechanic profile (resilient is hand-only since tankiness/flex isn't in the profile).
- Status tiers: `free` / `minor` / `contested` / `shut_down`, each with a hero-specific coaching note.
- `HeroFreedomPanel.tsx` renders it per team in `DraftSummary` (portrait + status badge + fragility chip + the disrupting enemies).
- `heroFreedom.test.ts` — fragility (hand + derived), free game, curated counter, mechanic counter, fragility-scaling (48 tests total).

### Session 16 — Flex-aware next-pick suggestions
Second slice of the "draft brain": pick suggestions now reason about **role coverage with flex**, not one fixed role per hero.
- `roleOptions(hero, assignments)` → the set of positions a hero can play (preferred ∪ flex ∪ metaRole; a user-assigned role locks it). `coveredRoles()` runs **bipartite matching** (Kuhn's augmenting paths) to find the maximum set of roles the picks can simultaneously cover, so a flex pick can shift to free a slot.
- `laneVerdict.missingRoles` is now flex-accurate — a role only shows as missing if no maximum assignment can cover it (a carry/mid flex pick no longer makes mid look missing).
- `rankPicks` scores candidates on **marginal coverage**: +8 for filling a genuinely open role (with a "Fills the open X slot" reason), +3 and a `flex` tag for a pick that can cover two open roles, and a penalty for a structurally-redundant pick when roles are still needed.
- `AnalysisPanel` "Suggested Picks" header now shows a **"still need: Sup, Hard Sup"** hint.
- 3 new tests in `draftPlanning.test.ts` (flex missingRoles, gap-filling vs redundant, flex tagging) — 51 tests total.

### Session 17 — Draft-position timing
Final slice of the "draft brain": *when* to commit a hero, based on how counterable it is and how many enemy picks can still respond.
- `pickContextForTeam(slots, team, fromIndex)` → `{ enemyPicksAfter, myPicksAfter, isMyLastPick }` for the team's next pick. `enemyPicksAfter === 0` is a protected slot (the second-pick team's last pick) — a free game for counterable heroes.
- Threaded as an optional `pickContext` through `analyzeTeam → rankPicks`. Each suggestion gets a `timing`: `commit_now` (protected slot or your final pick — fragile heroes get a bonus + "free game" reason), `save_for_later` (fragile + the enemy can still respond → penalty + "save for a later pick"), or `safe_now` (resilient → small early bonus). Your *last* pick never says "save for later" — there's nowhere later to save it.
- `AnalysisPanel` shows a draft-position note for the team currently picking ("🔓 Last pick — free game", "Early pick — favour safe/flexible heroes", "N enemy picks can still respond") plus per-suggestion **commit now** / **save for last** badges.
- 7 new tests in `pickTiming.test.ts` (slot counting, save-for-later, commit-now on protected/last-pick slots, no-context) — 58 tests total.
- *(Resolved in Session 19's panel rewrite — the timing note now shows on a team's opening pick too, since suggestions are no longer gated behind ≥1 pick.)*

### Session 18 — Turn card + inline grid annotations
Tightens the moment-to-moment drafting loop so the assistant reads like a coach.
- **`TurnCard`** — a compact "your turn" banner above the hero grid: `PICK`/`BAN`, whose turn, a count ("5 suggested picks highlighted below" / "top ban threats highlighted below"), and the draft-position cue. It deliberately does *not* feature one hero — the grid highlights them all.
- **Inline grid annotations** — `HeroGrid` draws rings + corner badges on recommended/threat heroes: gold ranked rings (1–5) on suggested picks (green "now" / amber "save" badges when timing applies), red ⊘ rings on the top ban threats. `HeroPortrait` gained an optional `annotation` prop.
- `DraftScreen` threads each team's `pickContext` into its analysis (timing-aware suggestions everywhere), derives the active-turn annotation map (picks from `recommendedPicks`, bans from the richer `rankBanThreats`), and renders the card.

### Session 19 — Collapsible, reordered side panel
- **Collapsible sections** — Threats to Ban, Draft Verdict, Items to Build vs Enemy, Matchup Grades, Lane Predictions, Team Profile, Suggested Picks, and Suggested Bans now collapse/expand via a clickable header + chevron. A generic `Section` wrapper handles the five inline sections; the three standalone components (`DraftVerdictCard`, `MatchupItemPanel`, `MatchupGradesPanel`) got their own internal collapse so they keep their styling (e.g. the verdict's rating-colored border).
- **Action-aware ordering** — `AnalysisPanel` now renders sections from a keyed map in an order driven by the team's *next move*: on a **pick** turn Suggested Picks leads; on a **ban** turn Suggested Bans + Threats to Ban lead. Everything else keeps its prior relative order.

### Session 20 — Live win-rate data + broadened free-game recall
**Live-data foundation** — the scoring engine now blends live OpenDota matchup win-rates into its lane/counter signal, keeping the hand-authored table as the explanatory "why".
- `shared/scoring.ts`: a register-once `setLiveMatchupProvider()` + a blended `matchupAdvantage(a, b)` (`0.35·hand + 0.65·live` when confident win-rate data exists, else hand only). The frontend registers `getApiMatchupAdvantage` on boot; the backend / backtest register nothing, so they stay pure hand data (and the existing tests are unaffected).
- **Provenance** — lane/mid matchup rows show a small `● live` badge when win-rate-backed (`LaneMatchupResult.dataBacked`); an authored note is dropped when live data has flipped the matchup's direction, so the text never contradicts the number.
- `useMatchupVersion` hook primes win-rates and re-runs the analysis as data streams in (wired into all three `analyzeTeam` callers).
- **Bugs uncovered & fixed:** `matchupService` / `metaService` were fetching *relative* `/api/...` URLs that hit the Vite dev server and silently failed — repointed at the shared backend base; and the backend OpenDota proxy had no timeout (an unreachable upstream hung the route forever) — added a 7 s `odFetch` to all four proxy calls.

**Broadened counter recall (free game)** — `analyzeHeroFreedom` was over-reporting "free game" because mechanic-counter detection used only a small hand provider map. Added a `utilityTag → mechanic` derivation (`silence`, `lockdown` → hard-control, `dispel`; **`stun` deliberately excluded** as too common). Precision is preserved because matches are still gated by the picked hero's own vulnerabilities.

**Config** — centralized the backend base URL into `frontend/src/config.ts` (`API_BASE`, overridable via the `VITE_API_BASE` env var); all six call sites now import it instead of hardcoding `localhost:3001`.

### Session 21 — Coaching-brain validation: predictive or explanatory?
Re-ran and extended the model experiment (`backend/src/model/experiment.ts`) to answer whether the "draft brain" adds **predictive** win-probability accuracy or is purely explanatory — turning fragility/exposure, role-coverage, lane advantage, **and the four matchup grades** into per-match features and backtesting AUC against the 0.577 baseline (5-fold CV, 2 500 pro matches).

| Config | AUC |
|--------|-----|
| **A**  hero + learned pairs (baseline) | **0.5768** |
| **B**  A + derived + matchup grades | 0.5746 |
| **C**  coaching features only (no hero) | 0.5064 |
| **D**  hero-only + coaching | 0.5595 |
| **E**  A + matchup grades only | 0.5737 |

- **No lift.** Adding the full coaching layer (B) — or the matchup grades alone (E) — does not improve on the baseline; standalone (C), the heuristics are barely above a coin flip (0.506). Coaching-feature weights come out tiny and several are *inverted*: the model is fitting noise once the hero + synergy/counter pair features already capture the real draft signal.
- **Conclusion:** the coaching brain is the **explanatory / UX layer** (the "why", in-draft guidance), not a predictive lever. The win-probability model is at its draft-only ceiling (~0.577); accuracy gains have to come from different inputs (opponent scouting / player hero pools, parsed in-game data), not more draft heuristics. This de-risks where to invest next.

### Session 22 — One authoritative ban list
The analysis panel had **two overlapping ban sections** that disagreed: a sparse "Suggested Bans" (often just one hero, surfaced by a hard-coded win-condition rule) and the richer "Threats to Ban". They came from two different functions written at different times.
- **Removed** the legacy `rankBans()` and `analysis.recommendedBans` (and the `recommendedBans` field on `TeamAnalysis`), plus the "Suggested Bans" section in `AnalysisPanel`.
- **"Threats to Ban"** (`rankBanThreats`) is now the single source — it strictly subsumes the old function (counters + enemy-synergy + win-condition cases + meta tiers + live win-rate threats + mid matchups, with Must Ban / High / Consider urgency). The three hard-coded win-condition cases were verified already covered before deletion.
- **Ordering fixed** so the strong list leads: on a ban turn Threats to Ban comes first; on a pick turn Suggested Picks leads with Threats to Ban directly below.

### Session 23 — Team Capability Profile
A structured "what each comp can and can't do" layer, built in four phases.
- **Profile (`shared/capabilities.ts`)** — `computeTeamCapabilities` scores 11 axes (Teamfight, Pick-off, Gank, Push, Split-push, Wave clear, Roshan, Sustain, Enable, Scaling, Damage) from the picked heroes' utility tags, each with the contributing heroes and a coaching note. Win-condition detection was **refactored to read from this profile** (single source of truth — the radar and the named win conditions can no longer disagree).
- **Traits (`shared/heroTraits.ts`)** — hand-tagged **damage type** (physical / magical / pure / mixed, with an attribute fallback), **space economy** (creators vs. farm-hungry users), and **Roshan-reliant** heroes. Surfaces notes like *"80% magical — enemy can stack magic resist"* and *"3 farm-hungry cores but no space-creators."*
- **UI (`CapabilityPanel`)** — a pure-SVG **dual-overlay radar** (your team vs. the enemy), a per-team **Can / Can't** summary, and damage-mix bars, in the post-draft report.
- **Suggestions** — `rankPicks` now reasons about the profile: it rewards picks that **fill a capability gap**, **create space** for greedy comps, **balance lopsided damage**, or **extend an existing lead**, surfacing the insight as a suggestion reason (e.g. *"Fills your teamfight gap"*, *"Adds magical damage — your lineup is mostly physical"*).
- **Validation** — backtested the capability + trait features through the same 5-fold CV harness: **no AUC lift** over the 0.577 baseline (A 0.5768 → +caps 0.5721; standalone 0.521). Like the rest of the coaching brain, it's an **explanatory / decision-support** layer, not a win-probability lever.

### Session 24 — Deployment readiness
Made the app deployable (`render.yaml`, `frontend/vercel.json`, `DEPLOY.md`) and along the way caught two bugs that only manifest in a production build, never in dev:
- **`npm start` pointed at the wrong compiled entry point.** Because the backend's `tsconfig.json` sets `rootDir` to the repo root (needed so `../shared` compiles alongside `backend/src`), `tsc` mirrors that path under `dist/` — the real entry is `dist/backend/src/index.js`, not `dist/index.js`. `ts-node-dev` (used in `npm run dev`) never hits this, since it runs the `.ts` source directly, so the bug was invisible until a real production build was run. Fixed the `start` script to point at the correct path.
- **The trained-model route resolved its data directory incorrectly under a compiled build**, for the same reason — `__dirname`-relative traversal in `routes/model.ts` assumed a shallower nesting than the compiled output actually has. Switched to a `process.cwd()`-relative path (both `npm run dev` and `npm start` are invoked with `cwd` = `backend/`, so this holds in both modes).
- **CORS origin is now environment-configurable** (`CORS_ORIGIN`, comma-separated, defaults to the local Vite dev server) instead of hardcoded to `localhost:5173`.
- Verified by building and running the compiled server exactly as the host would (`npm run build && PORT=… CORS_ORIGIN=… node dist/backend/src/index.js`): health check, the model endpoint, and a CORS preflight all confirmed working — including that a non-allowlisted origin is correctly rejected. All 75 tests and both type-checks stayed green; local dev is unaffected since both env vars default to the existing localhost setup.

### Session 25 — Experienced-player expansion (routing, playstyles, match archive, encyclopedia, tips)
Six-checkpoint feature expansion aimed at experienced players:
- **Client routing** (`react-router-dom`, previously an unused dependency): `/` draft screen, `/heroes` index, `/heroes/:heroName` detail, `/tips` — with `NavTabs` in the top bar, a `PageShell` layout for scrollable pages, an SPA rewrite in `vercel.json` (deep links no longer 404 in production), and Redux state deliberately mounted above the router so an in-progress draft survives navigation.
- **Hero playstyles (`shared/heroPlaystyles.ts`)** — 10 archetypes (constant/cooldown fighter, split-map farmer, greedy farmer, initiator, frontline, backline, roamer, tempo controller, global presence); ~115 hand-tagged heroes with tag-derived defaults guaranteeing full-roster coverage.
- **Team Identity panel (beta)** — `shared/teamIdentity.ts` reads the five picks as a cast and flags misalignment: "Draft too greedy" (3+ farm-dependent heroes), "No initiator", "No frontline", fighting-rhythm narration (constant vs. on-cooldown), split-map/global presence, support mobility. Wired into `analyzeTeam()` (additive `identity` field) and rendered in both the live analysis column and the draft summary.
- **Counter-item upgrades (`shared/matchups.ts`)** — `itemsThatCounter(hero)` inverse lookup (Break vs Bristleback/Spectre/Tide, MKB vs PA, detection vs invis) powering the encyclopedia's "items that counter this hero" section; **stacked-threat escalation** in the recommendation engine (`stackedNote`): 2+ invis heroes escalate detection to core, 2+ heavy casters escalate Pipe, 3+ heroes answered by one item escalates it — surfaced with an amber note in the Items panel.
- **Backend routes** — `GET /api/players/:accountId/matches` (player's last 10 games via OpenDota recentMatches, 5-min cache) and `GET /api/heroes/:id/pros` (pro players who recently played the hero + up to 3 loadable match ids each; the multi-MB `/proPlayers` payload is fetched once per day and kept only as an id→name map with in-flight dedupe).
- **Load Match hub** — replaced the single Import modal with a four-tab hub: **My Games** (enter Dota Friend ID once — stored via `playerIdentity.ts` with a `provider` field so Steam OpenID can slot in later; lists last 10 games with W/L + CM badges), **Pro Matches** (one-click load), **Showcase** (5 curated archetype drafts in `shared/showcaseDrafts.ts`, offline, each teaching one drafting lesson the analysis engine narrates), **Match ID** (paste-id; the old hard-throw on non-CM matches replaced by a **pub fallback** that reconstructs picks-only manual drafts from the players array with side derived from `player_slot`).
- **Hero encyclopedia** — index page with search, attribute + playstyle chip filters over the full 124-hero roster; detail pages with identity header, strengths/weaknesses/spikes, solo capability bars, curated + live matchup sections, item progression by phase (live popularity), items-that-counter, and pros-to-watch with replay chips that load the pro game's draft straight into the analyzer.
- **Tips page** — 40 curated tips across drafting/laning/mid-game/itemization/map categories with hero portrait links into the encyclopedia.
- **Interactions expansion** — matchup table grown 320 → 404 entries (contested mid matchups with notes, safelane-vs-offlane matchups, pos-4/5 lane duos, counters for newer heroes), plus a **dedup pass** that removed 12 dead duplicate entries (`.find()` first-match semantics silently shadowed them) and a new data test that forbids same-field duplicates per hero pair; coverage floor test raised to ≥400.
- **HTML-validity fix** — `HeroPortrait` now renders a `<div>` when presentational (no `onClick`), eliminating invalid button-in-button / button-in-anchor nesting flagged by React in the hub and encyclopedia lists.
- 109 tests (was 75); every checkpoint verified live in the browser (draft-state persistence across navigation, greedy-draft identity warnings, stacked detection note with Riki+Clinkz, CM and pub match imports, Friend-ID flow with a real public account, showcase loads, pro replay chips, playstyle filtering, thin-hero fallback pages).

### Session 26 — Meta-popularity signal in pick suggestions (closing the Section 7.5 gap)
The Section 7.5 evaluation's root-caused finding — pick suggestions carried no patch-meta signal while ban threats did (`metaBanBoost`), so a naive most-picked baseline (Top-3 13.3%) beat the full engine (2.2%) — is now fixed and re-measured.
- **`setMetaPickProvider` (shared/scoring.ts)** — a registered-provider hook exactly like `setLiveMatchupProvider`: the frontend registers `metaPickBoost` (live Immortal-bracket relative pick rates from metaService, graded 0–15 + S-tier bump, note above 50% pick rate); the backtest registers a provider derived from the corpus's own pick counts — the *same counts its most-picked baseline ranks by*, so the engine gains no information the baseline doesn't have. No provider registered → identical behavior to before.
- **`meta` ablation flag** added to `RankPicksAblation`; the meta note is promoted into the final reasons alongside `capReason` (a score contribution this large must be visible in the explanation — best-effort appending got truncated by the 3-reason cap in practice).
- **Live UX**: `loadMeta()` now bumps the matchup version on arrival so open analyses recompute; suggestions show reasons like *"Meta staple — 85% relative pick rate in Immortal bracket"*.
- **Re-measured over the same 2,500 pro drafts / 25,000 pick events:**

| Metric | Before (no meta) | After (with meta) | Most-picked baseline |
|---|---|---|---|
| Top-1 agreement | 0.6% | **5.3%** | 5.4% |
| Top-3 agreement | 2.2% | **10.8%** | 13.3% |
| Top-5 agreement | 3.6% | **14.7%** | 19.8% |

- The meta-ablation row (Δ−8.6pp Top-3, exactly reproducing the old engine) confirms the original diagnosis; the other five modules each move agreement by ≤0.5pp — consistent with the project's replicated finding that the structural coaching layer is explanatory rather than predictive of professional pick behavior. The engine now reaches Top-1 parity with the popularity baseline while keeping hero-specific explanations; median full-analysis latency 6.61 ms (P95 14.5 ms), still ~75× under the 500 ms target.
- 110 tests; the new scoring test proves the provider boosts a hero into the top-5, ablates cleanly, and that the engine is bit-identical when no provider is registered.

### Session 27 — Greed messaging consolidated (space economy ↔ Team Identity)
The space-economy note (`heroTraits.ts`) and the Team Identity greed warning could fire on the same draft with near-identical wording — and worse, **contradict** each other (a greedy trio + a space-creator read "Space looks healthy" in the capability panel and "Draft too greedy" in the identity panel simultaneously). Now consolidated:
- **One verdict source**: `computeTeamIdentity` reads `computeTeamTraits`' provider data. A greedy cast **with** a space-creator downgrades from a warning to an *info* plan — *"Greedy, but supported: … Tidehunter must stay active to buy it; protect that plan."* Only a greedy cast with **zero** creators warns (*"…nobody creates space for them — the enemy only has to force early tempo."*).
- **Two distinct voices**: heroTraits keeps the counts-and-balance economy voice (the word "Greedy" removed — *"3 space-hungry cores leaning on 1 space-creator"*); Team Identity owns the named-cast narrative. The misleading neutral fallback (*"Flexible / support-heavy"*) now reports farm-dependent cores when present.
- **Cross-reference**: when the economy is strained, the capability panel's space note points to *"Who and how: Team Identity below."*
- 111 tests — including a new one proving the provider-downgrade agrees with the space rating (no more contradictions by construction).

### Session 28 — Cold-start mitigation (free-tier hosting)
Render's free instance sleeps after ~15 idle minutes and takes 20–60 s to wake (measured: 22 s). Previously every boot loader failed once during that window and never retried — the whole session was left on the 39-hero fallback pool with no meta tiers and no win model. Three-layer fix, verified by simulating a cold start locally (frontend up, backend down, backend started mid-session):
- **Frontend wake layer (`frontend/src/data/backendStatus.ts`)** — pings `/api/health` at page load (the ping itself is what triggers the wake), retries up to ~90 s, and broadcasts a status (`waking`/`ok`/`down`) via a `useBackendStatus()` hook. When it flips to `ok`: the hero-pool query refetches (39 → 127 heroes without a reload), `loadMeta`/`loadWinModel` re-run (idempotent), and the live-data version bumps so open analyses recompute. An `apiFetch` wrapper used by all data services waits out the wake window and retries once instead of failing; MyGamesTab and the pros section show *"Backend is waking up (free hosting) — this can take up to a minute…"* instead of a misleading empty state.
- **Server boot warm-up** — on startup (which on the free tier means "a user just woke us") the backend primes the hero list, hero stats, the multi-MB proPlayers map, and item constants, so follow-up requests hit memory: the "first pros fetch of the day is slow" problem disappears.
- **Keep-alive workflow (`.github/workflows/keepalive.yml`)** — GitHub Actions pings health every 12 minutes, normally preventing the sleep entirely (fits Render's 750 free instance-hours/month; auto-disables after 60 days of repo inactivity — documented in DEPLOY.md §6).

### Session 29 — Bundle code-splitting
Cleared the 500 kB chunk warning (main chunk had grown to 700 kB minified):
- **Lazy routes** — the three info pages (`HeroIndexPage`, `HeroDetailPage`, `TipsPage`) and the `LoadMatchHub` modal load on demand via `React.lazy`/`Suspense`; the draft screen stays in the main chunk. Verified in a production `vite preview` (added a `frontend-preview` launch config): each chunk is fetched exactly when its route/button is first used.
- **Vendor split** — `manualChunks` in `vite.config.ts` (function form — rolldown-vite's types don't accept the object form) separates node_modules from app code: vendor 306 kB / app 346 kB / lazy pages 2–17 kB each, all under the threshold; the vendor chunk stays browser-cached across app deploys.
- **`vite preview` CORS** — the backend's default allowed origins now include `http://localhost:4173` so the production build can be smoke-tested locally.
- Net effect: initial load 200 → ~187 kB gzip (pages + hub deferred), warning gone, and the production preview run incidentally re-verified the cold-start wake layer end-to-end (health retries → recovery refetches visible in the network log).

### Session 30 — Imported-match scoreboard
When a draft is loaded from a real match (any Load Match tab or an encyclopedia replay chip), a collapsible scoreboard now appears **above the draft analysis**: winner (team name, colored by side), kill score, duration and league in the always-visible header; per-hero rows with player name, K/D/A (deaths highlighted), GPM, XPM, and the final six-slot inventory as item icons.
- **Captured at import time** — `buildImportedMatchInfo()` in `matchImport.ts` extracts the stats from the OpenDota payload the importer already had; stored as `draft.importedMatch` in Redux via `setImportedMatch`, dispatched by all four import flows.
- **Cleared everywhere it should be** — `loadDraft` resets it (so showcase drafts and saved-draft history loads never show a stale scoreboard), as do reset/mode/starting-team changes.
- **Item icons** resolve numeric ids through the existing item-constants map (`heroBuildService`), with a graceful placeholder until it loads; narrow screens get horizontal scroll.
- Verified live with TI-qualifier match 8863619325 (Nigma Galaxy 26:9, Miracle- 634 GPM Magnus, 51 item icons resolved): panel above the analysis, collapse/expand works, New Draft clears it, zero console errors.

### Session 31 — Import-path and identity-role fixes
Two known rough edges closed:
- **AP/Turbo matches no longer import as fake Captains Mode drafts.** OpenDota synthesizes a `picks_bans` array even for non-draft modes (ranked All Pick ban votes, Turbo pick order), so presence alone doesn't mean the match had a real draft. `usesCmDraftPath()` now gates the picks_bans path on `game_mode` (2 = Captains Mode, 16 = Captains Draft); every other mode reconstructs picks-only from the players array with an accurate banner ("Not a Captains Mode draft — picks imported from the players list"). Unknown `game_mode` (older payloads) keeps the presence-based behavior. Verified live: a ranked AP match imports as a 10-slot picks-only manual draft (scoreboard intact), the TI-qualifier CM match still imports as the full 24-slot draft with real bans.
- **Team Identity now respects the role board.** `computeTeamIdentity(picks, roleAssignments)` — user-assigned roles take precedence over the hero's default `metaRole` in the support-mobility check, so a hero repositioned to pos4/5 counts as part of the support cast (and vice versa). Covered by a test where role-board-assigned support Mirana is credited as a roamer while default-metaRole Mirana is not. 112 tests.

### Session 32 — Tournament meta: corpus refresh + pro-meta signal
The comparison corpus and the meta signal now track the actual competitive scene:
- **Corpus refreshed to the present** — `npm run ingest -- pro N` pulled 413 new league matches: 2,500 → **2,913 matches / 25 leagues, current through today** (the previous corpus ended 3 weeks earlier, missing the TI regional qualifiers).
- **Tournament-meta artifact** — new `npm run prometa` (`src/model/buildProMeta.ts`) computes per-hero pick/ban/contest/win rates over the corpus's most recent 30-day window (569 matches, 11 leagues) and writes `data/pro_meta.json`, committed and served by **GET /api/meta/pro** exactly like the model artifacts — the deployed backend still needs no database.
- **Blended into the draft analysis** (`metaService.ts`): pick suggestions add a tournament term (up to +8 by contest rate) on top of the Immortal-bracket term, ban threats likewise — with tournament-first notes: *"Tournament meta — picked or banned in 69% of recent pro drafts"* / *"Contested at recent tournaments…"*. Hero pages show the full line (e.g. Treant: *picked 95× / banned 438× — 94% contest, 54% win rate across 569 pro games from 11 recent leagues*). All three surfaces verified live.
- **Everything re-measured on the refreshed corpus**: win model retrained (490 features, was 373; CV AUC 0.566, T=1.78), heuristic score replicated its no-signal result a third time (AUC 0.482), and the recommendation backtest over 29,130 pick events held steady (Top-1 5.2% / Top-3 10.6% / Top-5 14.7%; meta ablation Δ−8.5pp; most-picked baseline 13.2%) — the meta-boosted engine generalizes to the newest tournament data rather than overfitting the old window. Median latency 8.5 ms.
- **Freshness workflow** (re-run after each tournament cycle): `npm run ingest -- pro 1200` → `npm run prometa` → `npm run train -- pro pairs` → commit the refreshed `data/*.json`.
- 115 tests (new: pro-meta artifact integrity + route).

---

## File Map

```
frontend/src/
├── components/
│   ├── AnalysisPanel.tsx        # Per-team live analysis (MatchupItemPanel + MatchupGradesPanel)
│   ├── BanThreatsPanel.tsx      # Ranked ban threats with urgency + meta line
│   ├── BanPanel.tsx             # Ban slot display
│   ├── CapabilityPanel.tsx      # Dual-overlay capability radar + damage/space/Rosh traits
│   ├── ComparisonPanel.tsx      # Win probability bar (model) + heuristic comparison
│   ├── DraftHistoryPanel.tsx    # Saved draft list with load/delete
│   ├── DraftRoleBoard.tsx       # Centre-screen role board during draft
│   ├── DraftScreen.tsx          # Main 3-column layout + top bar
│   ├── DraftHealthPanel.tsx     # Rotations & draft health (rune/gate/mid, combos, avoids)
│   ├── DraftSummary.tsx         # Post-draft full report (all panels)
│   ├── DraftVerdictCard.tsx     # Win condition + coach narrative + gameplan
│   ├── GamePlanTimelinePanel.tsx # Minute-by-minute execution timeline (4 phases)
│   ├── HeroBuildPanel.tsx       # Per-hero item build with edit/remove/add/reorder
│   ├── HeroFreedomPanel.tsx     # Free Game Check — free vs. disrupted per hero
│   ├── HeroGrid.tsx             # Hero picker grid with filters
│   ├── HeroPortrait.tsx         # Portrait with attr pip + meta tier badge
│   ├── ItemTablePanel.tsx       # Counter-Item Reference modal (searchable)
│   ├── LanePredictionsPanel.tsx # Per-lane prediction cards
│   ├── MatchupGradesPanel.tsx   # Four graded matchup scales + countered-by portraits
│   ├── MatchupItemPanel.tsx     # Items to build vs enemy (mechanic-based)
│   ├── RolePicker.tsx           # Click-to-open role dropdown; drives analysis
│   ├── SaveDraftModal.tsx       # Save draft with name/outcome/notes
│   ├── ScoreBar.tsx             # Score progress bar
│   ├── TeamIdentityPanel.tsx    # Team Identity (beta) — playstyle cast + alignment notes
│   ├── TeamPanel.tsx            # Team slot column with role badges
│   ├── TeamTags.tsx             # Utility tags, power bar, complexity
│   ├── hero/                    # Encyclopedia sections (PlaystyleBadges, matchups, items, counters, pros)
│   ├── layout/                  # NavTabs + PageShell route chrome
│   └── loadmatch/               # Load Match hub (MyGames / ProMatches / Showcase / MatchId tabs)
├── pages/
│   ├── HeroIndexPage.tsx        # /heroes — search + attribute/playstyle filters
│   ├── HeroDetailPage.tsx       # /heroes/:heroName — full hero profile
│   └── TipsPage.tsx             # /tips — 40 curated tips with category chips
├── data/
│   ├── draftOrder.ts            # Captains Mode + Manual slot sequences
│   ├── draftStorage.ts          # localStorage saved draft CRUD
│   ├── heroBuildService.ts      # OpenDota itemPopularity fetcher + consumable filter
│   ├── heroProsService.ts       # /heroes/:id/pros fetcher with session cache
│   ├── matchImport.ts           # OpenDota match → SavedDraft (CM path + pub players[] fallback)
│   ├── matchupService.ts        # OpenDota matchup win rates cache (+ getMatchupRowsFor)
│   ├── metaService.ts           # Immortal bracket tier classification
│   ├── playerIdentity.ts        # Friend ID identity in localStorage (Steam OpenID-ready)
│   ├── playerMatchesService.ts  # /players/:id/matches fetcher
│   ├── tips.ts                  # 40 curated tips (5 categories)
│   └── winModelService.ts       # Loads trained model; getRadiantWinProbability()
├── store/
│   ├── draftSlice.ts            # Redux slice (selectHero, undo, assignRole, loadDraft…)
│   ├── hooks.ts                 # Typed useAppSelector / useAppDispatch
│   └── selectors.ts             # Memoized selectors
├── types/
│   └── index.ts                 # All shared types
└── utils/
    └── scoring.ts               # analyzeTeam(), rankBanThreats(), win conditions

shared/                          # Framework-free TS — used by both frontend and backend
├── apiContracts.ts              # Backend↔frontend response shapes (recent matches, hero pros)
├── capabilities.ts              # computeTeamCapabilities() — 11-axis "can/can't" profile
├── heroPlaystyles.ts            # 10 playstyle archetypes; overrides + derived defaults
├── heroTraits.ts                # damage type, space economy, Roshan reliance (+ team aggregate)
├── heroFreedom.ts               # analyzeHeroFreedom() + fragility (free game vs. counters)
├── heroMechanics.ts             # 127-hero mechanic profiles (reliance/vulnerable)
├── heroMetadata.ts              # Metadata for all heroes (roles, metaRole, utilityTags)
├── heroPool.ts                  # Builds Hero objects from OpenDota raw + local metadata
├── interactions.ts              # 400+ synergy/counter/lane/duo pairs
├── items.ts                     # ~40 ItemDef entries with mechanics/timing; itemIconUrl()
├── matchupGrades.ts             # Four graded matchup scales (0–10)
├── matchups.ts                  # computeItemMatchups() + itemsThatCounter() + stacked-threat notes
├── mechanics.ts                 # Mechanic/Reliance vocabulary + RELIANCE_ANSWERS
├── scoring.ts                   # Full scoring engine (analyzeTeam, win conditions, lanes)
├── showcaseDrafts.ts            # 5 curated archetype drafts for the Load Match hub
├── teamIdentity.ts              # computeTeamIdentity() — cast narration + alignment warnings
├── types.ts                     # Shared domain types
└── winModel.ts                  # predictRadiantWinProb() — pure sigmoid predictor

backend/src/
├── backtest/
│   ├── metrics.ts               # AUC, log-loss, accuracy, calibration report
│   └── run.ts                   # npm run backtest [pub|pro]
├── checks/
│   └── itemMatchups.ts          # CLI: npm run checkmatchups -- "sven,cm" vs "pa,tide"
├── db/
│   └── index.ts                 # SQLite schema + saveMatch / loadMatchesForBacktest
├── ingest/
│   ├── heroPool.ts              # Fetches /heroes, caches to data/heroes.json
│   └── opendota.ts              # ingestPublicMatches() / ingestProMatches()
├── model/
│   ├── calibrate.ts             # fitTemperature() via grid search
│   ├── features.ts              # buildFeatureSpace(), matchToRow()
│   ├── logreg.ts                # L2 logistic regression + predictLogit()
│   ├── experiment.ts            # Coaching-brain validation: derived/grade feats → CV AUC
│   └── train.ts                 # 5-fold CV → temperature cal → saves model JSON
├── routes/
│   ├── heroes.ts                # /heroes, /heroes/stats, /heroes/:id/matchups, /:id/items
│   ├── items.ts                 # /api/items — item constants map
│   └── model.ts                 # /api/model — serves trained model JSON
├── tests/
│   ├── api.test.ts              # API health + 404 tests
│   ├── helpers.ts               # hero() stub factory
│   ├── matchupGrades.test.ts    # Graded scale tests
│   └── matchups.test.ts         # 8 item-matchup integration tests
└── index.ts                     # Express app (export app; listen only when main)
```
