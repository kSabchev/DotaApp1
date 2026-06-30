// Builds the project pitch + technical-design doc as a .docx.
// Run with:  NODE_PATH=$(npm root -g) node backend/scripts/build-pitch.cjs
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, LevelFormat, HeadingLevel, BorderStyle, WidthType, ShadingType,
  Footer, PageNumber,
} = require('docx');

const ROOT = 'D:\\coding\\claude\\dotaApp1';
const OUT = path.join(ROOT, 'Dota2-Draft-Analyzer-Pitch.docx');

const ACCENT = 'C8932A'; // dota gold
const DARK = '1A1A1A';

// ── helpers ──
const h1 = txt => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(txt)] });
const h2 = txt => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(txt)] });
const h3 = txt => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(txt)] });
const p = (runs, opts = {}) => new Paragraph({ spacing: { after: 120 }, ...opts,
  children: Array.isArray(runs) ? runs : [new TextRun(runs)] });
const bullet = runs => new Paragraph({ numbering: { reference: 'b', level: 0 }, spacing: { after: 40 },
  children: Array.isArray(runs) ? runs : [new TextRun(runs)] });
const num = runs => new Paragraph({ numbering: { reference: 'n', level: 0 }, spacing: { after: 80 },
  children: Array.isArray(runs) ? runs : [new TextRun(runs)] });
const b = txt => new TextRun({ text: txt, bold: true });
const i = txt => new TextRun({ text: txt, italics: true });
const t = s => new TextRun(s);
const mono = s => new TextRun({ text: s, font: 'Consolas', size: 20 });
const code = s => new Paragraph({ spacing: { after: 20 }, shading: { fill: 'F4F4F4', type: ShadingType.CLEAR },
  children: [new TextRun({ text: s, font: 'Consolas', size: 19 })] });
const note = runs => new Paragraph({ spacing: { before: 60, after: 160 }, indent: { left: 360 },
  border: { left: { style: BorderStyle.SINGLE, size: 18, color: ACCENT, space: 12 } },
  children: Array.isArray(runs) ? runs : [new TextRun({ text: runs, italics: true, color: '555555' })] });

// ── generic table ──
const cb = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: cb, bottom: cb, left: cb, right: cb };
const cell = (text, width, head = false, mono = false) => new TableCell({
  borders, width: { size: width, type: WidthType.DXA },
  shading: { fill: head ? 'EFE3C8' : 'FFFFFF', type: ShadingType.CLEAR },
  margins: { top: 50, bottom: 50, left: 110, right: 110 },
  children: [new Paragraph({ children: [new TextRun({ text, bold: head, size: 19, font: mono ? 'Consolas' : undefined })] })],
});
function table(widths, headers, rows) {
  const total = widths.reduce((a, c) => a + c, 0);
  return new Table({
    width: { size: total, type: WidthType.DXA }, columnWidths: widths,
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((hd, k) => cell(hd, widths[k], true)) }),
      ...rows.map(r => new TableRow({ children: r.map((c, k) => cell(c, widths[k], false, k > 0 && /^\d/.test(c))) })),
    ],
  });
}

const techTable = table([2500, 6860],
  ['Layer', 'Technology'],
  [
    ['Frontend', 'Vite 8 + React + TypeScript; Redux Toolkit + RTK Query; Tailwind CSS v3 (pure-JS PostCSS build)'],
    ['Backend', 'Express + TypeScript — OpenDota REST proxy (with caching & timeouts) + trained-model server'],
    ['Data sources', 'OpenDota API — heroes, matchup win rates, hero stats, item popularity, pro & public matches'],
    ['Corpus & DB', "Node's built-in node:sqlite — ~2,500 pro-match corpus at backend/data/dota.db"],
    ['ML model', 'A from-scratch, pure-TypeScript L2 logistic-regression win model (no native ML dependencies)'],
    ['Shared core', 'Framework-free TypeScript scoring engine shared by the app, the backend, and the offline backtest'],
    ['Testing', "Node's built-in test runner via ts-node — 61 tests, no native test tooling"],
  ]);

const expTable = table([900, 5560, 1500],
  ['Cfg', 'Feature set', 'Held-out AUC'],
  [
    ['A', 'Hero indicators + learned synergy/counter pairs (production baseline)', '0.5768'],
    ['B', 'A + all coaching features (fragility, role-coverage, lanes, grades)', '0.5746'],
    ['C', 'Coaching features only (no hero/pair features)', '0.5064'],
    ['D', 'Hero-only + coaching features', '0.5595'],
    ['E', 'A + the four matchup grades only', '0.5737'],
  ]);

const doc = new Document({
  creator: 'Dota 2 Draft Analyzer',
  title: 'Dota 2 Draft Analyzer — Pitch & Technical Design',
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
    paragraphStyles: [
      { id: 'Title', name: 'Title', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 46, bold: true, color: DARK, font: 'Arial' }, paragraph: { spacing: { after: 60 } } },
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 30, bold: true, color: ACCENT, font: 'Arial' },
        paragraph: { spacing: { before: 300, after: 140 }, outlineLevel: 0,
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 2 } } } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 25, bold: true, color: DARK, font: 'Arial' },
        paragraph: { spacing: { before: 180, after: 70 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 22, bold: true, color: '444444', font: 'Arial' },
        paragraph: { spacing: { before: 120, after: 50 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: 'b', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 540, hanging: 280 } } } }] },
      { reference: 'n', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 540, hanging: 280 } } } }] },
    ],
  },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Dota 2 Draft Analyzer  ·  Pitch & Technical Design  ·  Page ', size: 16, color: '999999' }),
        new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '999999' })] })] }) },
    children: [
      new Paragraph({ style: 'Title', children: [new TextRun('Dota 2 Draft Analyzer')] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: 'Pitch & Technical Design — the logic and considerations behind a real-time draft coach', size: 24, color: ACCENT, bold: true })] }),

      // ── Elevator pitch ──
      p([b('The one-liner. '), t('A real-time drafting coach for Dota 2 that doesn’t just report win rates — it explains '), b('why'), t(' a draft works and tells you '), b('what to do about it'), t(', pick by pick.')]),
      p([t('Most drafting tools are lookup tables of hero win rates. This is a '), b('coaching brain'), t(': it reads both teams the moment heroes hit the board and reasons about roles, flex, lane matchups, counter-sensitivity, draft timing, and a minute-by-minute game plan — while a separately '), b('trained, calibrated win-probability model'), t(' carries the hard numbers. It is the difference between a stats sheet and an analyst sitting next to you during the draft.')]),

      // ── Positioning ──
      h1('Positioning'),
      p([t('Tools like Dota Plus, Stratz, dotapicker and Dota Terminal are excellent at '), b('data'), t(' (win rates, matchups). None of them act as a '), b('coach'), t(': role/flex reasoning, counter-sensitivity, '), i('when'), t(' to commit a hero, a written game plan, and concrete item responses — the judgment a pro analyst provides. The bet is that '), b('explanation plus actionable guidance'), t(' is the underserved gap, made credible by a real model underneath.')]),

      // ── Tech stack ──
      h1('Technology Stack'),
      techTable,
      note([i('Engineering note: '), t('the project deliberately avoids native binary dependencies (no better-sqlite3, no native ML libs, no esbuild-based test runner). It runs under a locked-down Windows Application Control environment that blocks third-party '), mono('.node'), t(' addons — so the stack leans on built-ins (node:sqlite, node:test) and pure-TypeScript implementations. A constraint that turned into a clean, dependency-light design.')]),

      // ── Architecture ──
      h1('Architecture'),
      h2('One shared, framework-free core'),
      p([t('The entire analysis engine lives in a '), mono('shared/'), t(' TypeScript module with zero framework or browser dependencies. The '), b('same code'), t(' runs in three places:')]),
      bullet([b('In the browser'), t(' — live, as heroes are picked, driving the UI.')]),
      bullet([b('On the backend'), t(' — for any server-side analysis.')]),
      bullet([b('In the offline backtest'), t(' — scoring thousands of historical drafts to validate the logic against real outcomes.')]),
      note([t('Why it matters for a pitch: the advice you see live is '), b('provably the same logic'), t(' that gets measured against 2,500 real pro games. There is no “demo logic vs. real logic” gap.')]),
      h2('Data: a hybrid of curated knowledge and live signal'),
      p([t('Two layers, intentionally separated:')]),
      bullet([b('A curated knowledge layer'), t(' — hand-authored hero interactions, mechanic profiles, and item-counter rules. This is the '), i('explanatory'), t(' layer: it knows '), i('why'), t(' Silver Edge answers Spectre, or why a silence ruins Enigma.')]),
      bullet([b('A live quantitative layer'), t(' — OpenDota win rates blended into the matchup signal behind a confidence threshold, with provenance labelling. This is the '), i('measured'), t(' layer.')]),
      p([t('The two are kept distinct on purpose (see “Live-Data Foundation” and “Validation” below): the curated layer carries the '), i('meaning'), t(', the data layer carries the '), i('magnitude'), t('.')]),

      // ── Core scoring ──
      h1('The Scoring Engine'),
      p([t('The heart is '), mono('analyzeTeam(myPicks, enemyPicks, …)'), t(', which scores a side across complementary categories — synergy, counters, lanes, role balance, power timing, objectives, and utility — and derives higher-level outputs: a named '), b('win condition'), t(' (teamfight, deathball, pick-off, split-push, late-game, physical domination), a '), b('power window'), t(' (early/mid/late peak), and a hero-specific, enemy-aware coach narrative.')]),
      note([b('Key consideration — the heuristic score is explanatory, not predictive. '), t('Backtesting showed the composite “draft-quality score” has '), b('no'), t(' predictive value (AUC ≈ 0.48, below a coin flip), because most of it is enemy-independent and cancels out between two pro teams. It was therefore '), b('demoted'), t(' in the UI: the real win % comes from the trained model; the heuristic total is kept only as an explanatory breakdown. Building the measurement and acting on a negative result is a core design principle here.')]),

      // ── Draft brain ──
      h1('The “Draft Brain” — Logic in Depth'),

      h2('Role assignment with flex'),
      p([t('Roles are treated as a coverage problem, not a fixed label per hero:')]),
      bullet([mono('inferRoles'), t(' — assigns an optimal 1:1 position map across five heroes (brute-force over role permutations, maximising fit by meta-role / preferred / flex), used to seed imported drafts that carry no lane data.')]),
      bullet([mono('roleOptions'), t(' — the '), i('set'), t(' of positions a hero can play (preferred ∪ flex ∪ meta-role; a user-assigned role locks it).')]),
      bullet([mono('coveredRoles'), t(' — runs '), b('bipartite matching'), t(' (Kuhn’s augmenting paths) over those option-sets to find the maximum number of roles the team can '), i('simultaneously'), t(' cover, so a flexible hero can shift to free a slot.')]),
      p([t('The payoff: a role only shows as “missing” when no maximum assignment can cover it (a carry/mid flex pick no longer makes mid look open), and pick suggestions score '), b('marginal coverage'), t(' — rewarding a hero that fills a genuinely open role or frees a flex teammate, penalising a structurally redundant pick.')]),

      h2('Free Game Check — counter-sensitivity'),
      p([t('For every picked hero: does it have a '), b('free game'), t(', or is it '), b('disrupted'), t(' — and by exactly which enemy? The signal is hybrid:')]),
      num([b('Curated hero↔hero counters'), t(' — hand-authored counter scores with reasons.')]),
      num([b('Mechanic-based counters'), t(' — the hero’s '), i('reliances'), t(' and '), i('vulnerabilities'), t(' (e.g. relies on channelling, invisibility, regen) are matched against an enemy whose kit '), i('provides'), t(' the answering mechanic. A '), mono('RELIANCE_ANSWERS'), t(' map connects the two: channelling is answered by hard control / silence / interrupt, invisibility by detection, regen by heal-reduction, and so on.')]),
      p([t('Crucially, this is weighted by '), b('fragility'), t(' — how badly a given hero minds counters. A fragile, single-mechanic, immobile hero is '), i('shut down'), t(' by a counter that a tanky, flexible teamfighter merely '), i('plays around'), t('. Fragility comes from a hand override table for the highest-signal heroes, falling back to a value derived from the hero’s mechanic profile. Status resolves to '), b('free / minor / contested / shut-down'), t(' via accumulated counter severity × the fragility multiplier.')]),
      note([b('Recent refinement (precision-safe recall). '), t('Counter detection originally used a small hand list of “providers”, so it under-reported and many heroes wrongly showed “free game”. It was broadened to also infer disruption from each enemy’s '), i('utility tags'), t(' (silence, lockdown, dispel) — but '), b('not'), t(' stun, which is too common and would flag every channelling hero. Precision is preserved because a provider only counts if the picked hero is '), i('actually vulnerable'), t(' to that mechanic.')]),

      h2('Draft-position timing'),
      p([t('The recommender knows '), i('where you are in the draft'), t('. '), mono('pickContextForTeam'), t(' computes, for your next pick, how many enemy picks can still respond and whether it is your last pick. From that:')]),
      bullet([b('Protected slot'), t(' (no enemy pick can respond) → it’s safe to commit your most counterable, greedy hero — a “free game”.')]),
      bullet([b('Exposed slot'), t(' (the enemy can still answer) → a fragile hero is flagged '), i('save for a later pick'), t('; a resilient hero is '), i('safe now'), t('.')]),
      bullet([b('Last pick'), t(' → never “save for later” (there’s nowhere later to save it).')]),
      p([t('These show as per-suggestion '), i('commit now'), t(' / '), i('save for last'), t(' badges and a draft-position note, plus inline highlights on the hero grid.')]),

      // ── Item & matchup ──
      h1('Item & Matchup Intelligence'),
      p([t('The item layer models '), b('mechanics, not hero×item pairs'), t('. Heroes tag what they rely on and are vulnerable to; items tag the mechanics they provide; a matcher connects them through the same '), mono('RELIANCE_ANSWERS'), t(' vocabulary. So “what to build vs. this enemy” generalises (Silver Edge breaks passives, MKB pierces evasion, Spirit Vessel cuts healing, Eul’s interrupts channels) without hard-coding every combination.')]),
      p([t('On top sit four '), b('graded matchup scales'), t(' (Team Synergy, Lane Duos, Lane vs Enemy, Game Counters), per-hero build orders pulled from OpenDota item popularity, a searchable counter-item reference, meta-tier badges, and a ranked must-ban list.')]),

      // ── Live data ──
      h1('Live-Data Foundation'),
      p([t('Live OpenDota win rates are blended into the engine’s matchup signal through a single, clean seam:')]),
      bullet([b('A register-once provider'), t(' — the frontend registers a win-rate accessor on boot; the backend and backtest register nothing, so they stay pure hand-data (and the test suite is unaffected).')]),
      bullet([b('A blended advantage'), t(' — when confident win-rate data exists, the matchup advantage is a weighted mix (~⅔ live, ⅓ hand); below the games threshold it falls back to hand data only.')]),
      bullet([b('Provenance'), t(' — any number a live win rate touched is badged '), mono('● live'), t(' in the UI, and an authored note is dropped if fresh data flipped the matchup’s direction, so the text never contradicts the number.')]),
      bullet([b('Graceful degradation'), t(' — every external call has a timeout; if OpenDota is slow or unreachable, the app silently falls back to the curated layer instead of hanging.')]),
      note([b('Consideration — confidence over coverage. '), t('A matchup is only treated as data-backed above a minimum sample size; thin samples are ignored rather than shown as fact. The hand layer remains the floor so the product is never empty.')]),

      // ── Win model ──
      h1('The Win-Probability Model'),
      p([t('A from-scratch logistic-regression model, trained and evaluated entirely in TypeScript:')]),
      bullet([b('Features'), t(' — per-hero presence (±1 by side) plus learned '), b('synergy'), t(' (same-team) and '), b('counter'), t(' (opposite-team) pair features above a support threshold.')]),
      bullet([b('Training'), t(' — L2-regularised gradient descent with '), b('5-fold cross-validation'), t('; the feature space is rebuilt from the training folds only, so there is no leakage.')]),
      bullet([b('Calibration'), t(' — '), b('temperature scaling'), t(' fit on held-out logits, so the displayed percentage is honest rather than over-confident.')]),
      bullet([b('Result'), t(' — held-out '), b('AUC ≈ 0.577'), t(' with log-loss below the base-rate baseline on ~2,500 pro matches. Modest by design: draft alone caps how predictable a pro game is, because execution decides most of them.')]),
      p([t('The model is served at '), mono('/api/model'), t(' and shown as a live win-probability bar during the draft and a banner on the post-draft report.')]),

      // ── Validation ──
      h1('Validation: Is the Coaching Brain Predictive or Explanatory?'),
      p([t('Rather than assume the heuristics improve prediction, the question was '), b('tested directly'), t(': turn the coaching signals — fragility/exposure, role coverage, lane advantage, '), i('and the four matchup grades'), t(' — into per-match features and backtest their AUC lift against the 0.577 baseline (same 5-fold CV, 2,500 pro matches).')]),
      expTable,
      p([t('')], { spacing: { after: 40 } }),
      p([b('No lift. '), t('Adding the full coaching layer (B), or the matchup grades alone (E), does not improve on the baseline; standalone (C) the heuristics are barely above a coin flip. The coaching-feature weights come out tiny and several are '), i('inverted'), t(' — the model is fitting noise once the hero and pair features already capture the real draft signal.')]),
      p([b('Conclusion. '), t('The coaching brain is the '), b('explanatory / UX layer'), t(' (the “why” and the in-draft guidance), '), b('not'), t(' a predictive lever. The win model is at its draft-only ceiling. Future accuracy has to come from '), b('different inputs'), t(' — opponent scouting / player hero pools and parsed in-game data — not more draft heuristics. This result de-risks where to invest next.')]),

      // ── Design considerations ──
      h1('Design Considerations & Decisions'),
      bullet([b('Separate meaning from magnitude'), t(' — curated knowledge explains; live data quantifies. Keeping them distinct lets each be improved (and trusted) independently.')]),
      bullet([b('Measure, then believe'), t(' — every claim of value (the heuristic score, the coaching features) was backtested. Two of them came back negative and the product was adjusted accordingly.')]),
      bullet([b('Name-keyed data to kill a bug class'), t(' — hero interactions are authored by readable short-names resolved to IDs at load (an unknown name throws), permanently closing an earlier silent hero-ID-mismatch bug class.')]),
      bullet([b('Provenance and confidence'), t(' — the UI labels what is data-backed, and thin samples are withheld rather than shown as fact.')]),
      bullet([b('Graceful degradation'), t(' — timeouts and hand-data fallbacks mean an unreachable API degrades the product, it never breaks it.')]),
      bullet([b('Dependency-light by necessity and by taste'), t(' — built-in SQLite, built-in test runner, pure-TS model: fewer moving parts, and it runs in a locked-down environment.')]),
      bullet([b('Tested core'), t(' — 61 tests cover scoring, role coverage, free-game/fragility, pick timing, the item matcher, the live-data blend, the model, and data integrity; the item-matcher tests double as living documentation of the counter rules.')]),

      // ── Feature summary ──
      h1('Functionality at a Glance'),
      h3('Draft flow'),
      bullet('Captains Mode + Manual drafting with full pick/ban order; all heroes with live portraits.'),
      bullet('Import any real match by ID and replay its draft; save/load drafts with scouting notes; undo and reset.'),
      bullet('A “your turn” card + inline grid highlights mark recommended picks (ranked rings) and top ban threats.'),
      h3('Prediction & verdict'),
      bullet('Calibrated live win-probability bar + post-draft banner.'),
      bullet('Draft verdict: win condition, power window, plain-English game plan, key threats, priority bans.'),
      h3('The draft brain'),
      bullet('Free Game Check (counter-sensitivity + fragility); flex-aware pick suggestions; draft-position timing.'),
      h3('Execution planning'),
      bullet('Minute-by-minute Game Plan Timeline; Rotations & Draft Health; per-lane predictions.'),
      h3('Item & matchup intelligence'),
      bullet('Mechanic-based “items to build vs. enemy”; graded matchup scales; editable builds; counter-item reference; meta-tier badges.'),

      // ── Roadmap ──
      h1('Status & Roadmap'),
      p([t('A working prototype with a validated model and a deep coaching layer. Honest framing for Q&A:')]),
      bullet([b('Data'), t(' — a hybrid of live OpenDota signals and a curated knowledge layer; the live layer activates wherever OpenDota is reachable.')]),
      bullet([b('Next predictive levers'), t(' (per the validation experiment) — opponent / player-pool scouting and parsed in-game data, not more draft heuristics.')]),
      bullet([b('Productionisation'), t(' — the backend base URL is already centralised behind one env variable; deployment is the next operational step.')]),

      p([i('Talking point: '), t('“We trained our own win model and then ran the experiment to check our own heuristics. We earned the right to say which parts are predictive and which are coaching.”')], { spacing: { before: 160 } }),
    ],
  }],
});

Packer.toBuffer(doc).then(buf => { fs.writeFileSync(OUT, buf); console.log('wrote', OUT, buf.length, 'bytes'); });
