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
- *Known minor gap:* the timing note is hidden on a team's very first pick (the analysis block requires ≥1 pick); it shows from the second pick onward.

---

## File Map

```
frontend/src/
├── components/
│   ├── AnalysisPanel.tsx        # Per-team live analysis (MatchupItemPanel + MatchupGradesPanel)
│   ├── BanThreatsPanel.tsx      # Ranked ban threats with urgency + meta line
│   ├── BanPanel.tsx             # Ban slot display
│   ├── ComparisonPanel.tsx      # Win probability bar (model) + heuristic comparison
│   ├── DraftHistoryPanel.tsx    # Saved draft list with load/delete
│   ├── DraftImport.tsx          # Import draft from match ID
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
│   ├── TeamPanel.tsx            # Team slot column with role badges
│   └── TeamTags.tsx             # Utility tags, power bar, complexity
├── data/
│   ├── draftOrder.ts            # Captains Mode + Manual slot sequences
│   ├── draftStorage.ts          # localStorage saved draft CRUD
│   ├── heroBuildService.ts      # OpenDota itemPopularity fetcher + consumable filter
│   ├── matchupService.ts        # OpenDota matchup win rates cache
│   ├── metaService.ts           # Immortal bracket tier classification
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
├── heroFreedom.ts               # analyzeHeroFreedom() + fragility (free game vs. counters)
├── heroMechanics.ts             # 127-hero mechanic profiles (reliance/vulnerable)
├── heroMetadata.ts              # Metadata for all heroes (roles, metaRole, utilityTags)
├── heroPool.ts                  # Builds Hero objects from OpenDota raw + local metadata
├── interactions.ts              # 250+ synergy/counter pairs
├── items.ts                     # ~40 ItemDef entries with mechanics/timing; itemIconUrl()
├── matchupGrades.ts             # Four graded matchup scales (0–10)
├── matchups.ts                  # computeItemMatchups() — mechanic-based item recommender
├── mechanics.ts                 # Mechanic/Reliance vocabulary + RELIANCE_ANSWERS
├── scoring.ts                   # Full scoring engine (analyzeTeam, win conditions, lanes)
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
