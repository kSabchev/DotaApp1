// Builds the demo overview as a .docx (run with NODE_PATH=$(npm root -g)).
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  AlignmentType, LevelFormat, HeadingLevel, BorderStyle, WidthType, ShadingType,
  Footer, PageNumber,
} = require('docx');

const ROOT = 'D:\\coding\\claude\\dotaApp1';
const SHOTS = path.join(ROOT, 'docs', 'shots');
const OUT = path.join(ROOT, 'Dota2-Draft-Analyzer-Overview.docx');

const ACCENT = 'C8932A';   // dota gold
const DARK = '1A1A1A';

const img = (file, w = 540) => {
  const h = Math.round(w * 1348 / 1162);
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 60 },
    children: [new ImageRun({
      type: 'png', data: fs.readFileSync(path.join(SHOTS, file)),
      transformation: { width: w, height: h },
      altText: { title: file, description: 'Dota 2 Draft Analyzer screenshot', name: file },
    })],
  });
};
const caption = t => new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { after: 240 },
  children: [new TextRun({ text: t, italics: true, size: 18, color: '666666' })],
});
const h1 = t => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] });
const h2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
const p = (runs, opts = {}) => new Paragraph({ spacing: { after: 120 }, ...opts,
  children: Array.isArray(runs) ? runs : [new TextRun(runs)] });
const bullet = runs => new Paragraph({ numbering: { reference: 'b', level: 0 }, spacing: { after: 40 },
  children: Array.isArray(runs) ? runs : [new TextRun(runs)] });
const num = runs => new Paragraph({ numbering: { reference: 'n', level: 0 }, spacing: { after: 80 },
  children: Array.isArray(runs) ? runs : [new TextRun(runs)] });
const b = t => new TextRun({ text: t, bold: true });
const t = s => new TextRun(s);
const code = s => new Paragraph({ spacing: { after: 20 }, shading: { fill: 'F2F2F2', type: ShadingType.CLEAR },
  children: [new TextRun({ text: s, font: 'Consolas', size: 20 })] });

// ── Tech stack table ──
const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
const cell = (text, width, head = false) => new TableCell({
  borders, width: { size: width, type: WidthType.DXA },
  shading: { fill: head ? 'EFE3C8' : 'FFFFFF', type: ShadingType.CLEAR },
  margins: { top: 60, bottom: 60, left: 120, right: 120 },
  children: [new Paragraph({ children: [new TextRun({ text, bold: head, size: 20 })] })],
});
const techRow = (a, c) => new TableRow({ children: [cell(a, 2600), cell(c, 6760)] });
const techTable = new Table({
  width: { size: 9360, type: WidthType.DXA }, columnWidths: [2600, 6760],
  rows: [
    new TableRow({ children: [cell('Layer', 2600, true), cell('Technology', 6760, true)] }),
    techRow('Frontend', 'Vite + React + TypeScript, Redux Toolkit, Tailwind CSS'),
    techRow('Backend', 'Express + TypeScript (REST proxy + model server)'),
    techRow('Data', 'OpenDota API — heroes, matchup win rates, item popularity, pro & public matches'),
    techRow('Corpus & model', 'Built-in SQLite match corpus (~2,500 pro matches) + a pure-TypeScript L2 logistic-regression win model (no native dependencies)'),
    techRow('Shared core', 'Framework-free TypeScript scoring engine shared by the app, the backend, and the model backtest'),
    techRow('Testing', "Node’s built-in test runner — 58 tests across scoring, matchups, model, and data integrity"),
  ],
});

const doc = new Document({
  creator: 'Dota 2 Draft Analyzer',
  title: 'Dota 2 Draft Analyzer — Overview',
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
    paragraphStyles: [
      { id: 'Title', name: 'Title', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 44, bold: true, color: DARK, font: 'Arial' },
        paragraph: { spacing: { after: 60 } } },
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 30, bold: true, color: ACCENT, font: 'Arial' },
        paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 0,
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 2 } } } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, color: DARK, font: 'Arial' },
        paragraph: { spacing: { before: 160, after: 80 }, outlineLevel: 1 } },
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
      children: [new TextRun({ text: 'Dota 2 Draft Analyzer  ·  ', size: 16, color: '999999' }),
        new TextRun({ text: 'Page ', size: 16, color: '999999' }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '999999' })] })] }) },
    children: [
      new Paragraph({ style: 'Title', children: [new TextRun('Dota 2 Draft Analyzer')] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: 'A real-time drafting assistant and draft coach', size: 24, color: ACCENT, bold: true })] }),

      p([t('As heroes are picked and banned, the analyzer reads '), b('both teams at once'), t(' — predicting win probability, naming the win condition, mapping role coverage, flagging counters, and advising '), b('who'), t(' and '), b('when'), t(' to pick — then lays out a minute-by-minute game plan.')]),
      p('It is built to be useful to a real drafter, not just a hero picker: every output is hero-specific and reacts to the opposing draft.'),

      h1('Tech Stack'),
      techTable,
      p([new TextRun({ text: 'The analysis engine lives in one framework-free module, so the live app and the offline model evaluation run the exact same logic.', italics: true, size: 20, color: '555555' })], { spacing: { before: 120 } }),

      h1('Key Features'),
      h2('Draft flow'),
      bullet('Captains Mode and Manual drafting with full pick/ban order'),
      bullet('Import any real match by ID and replay its draft'),
      bullet('Save / load drafts with scouting notes; undo and reset'),
      h2('Prediction & verdict'),
      bullet([b('Win probability'), t(' from a model trained on thousands of pro matches, calibrated and shown as a live bar and a post-draft banner')]),
      bullet([b('Draft verdict'), t(' — names the win condition (teamfight, deathball, pick-off, split-push, late-game, physical), the power window, and a plain-English game plan with key threats and priority bans')]),
      h2('The “Draft Brain”'),
      bullet([b('Free Game Check'), t(' — which heroes can play freely vs. are disrupted, weighted by how badly each hero minds counters (an invisibility-reliant Riki is “shut down” by enemy detection; a tanky teamfighter plays through it)')]),
      bullet([b('Flex-aware pick suggestions'), t(' — what roles you still need, honouring flexible heroes, with reasoning like “fills the open support slot”')]),
      bullet([b('Draft-position timing'), t(' — commit a counterable hero on a protected late slot (“free game”) vs. open with a safe, flexible one')]),
      h2('Execution planning'),
      bullet([b('Game Plan Timeline'), t(' — laning → power spikes → objectives → late game, with tempo and power-peak markers')]),
      bullet([b('Rotations & Draft Health'), t(' — rune control, gate rotations, blink timings, combo call-outs, farm balance, and lanes to avoid')]),
      bullet([b('Lane predictions'), t(' — per-lane (safe / mid / off) matchup cards')]),
      h2('Item & matchup intelligence'),
      bullet([b('Items to build vs. the enemy'), t(' — mechanic-based, not hard-coded (Silver Edge breaks passives, MKB pierces evasion, Spirit Vessel cuts healing, …)')]),
      bullet('Graded matchup scales, editable per-hero builds, a searchable counter-item reference, meta-tier badges, and a ranked must-ban list'),

      h1('The App in Action'),
      h2('Live draft analysis'),
      p('Both teams are scored the moment heroes hit the board: a calibrated win-probability bar, role assignments, and a coach’s verdict per side.'),
      img('01-analysis.png'),
      caption('Post-draft analysis — win probability, team rosters, and the draft verdict for each side.'),

      new Paragraph({ pageBreakBefore: true, heading: HeadingLevel.HEADING_2, children: [new TextRun('Free Game Check')] }),
      p('For every picked hero: a free game, or disrupted — and by exactly which enemy. Counter-sensitivity means a fragile hero is “shut down” where a resilient one merely plays around it.'),
      img('02-freegame.png'),
      caption('Free Game Check — status badges, fragility, and the specific enemies disrupting each hero.'),

      new Paragraph({ pageBreakBefore: true, heading: HeadingLevel.HEADING_2, children: [new TextRun('Game Plan Timeline')] }),
      p('The draft turned into a plan: what to do from the laning phase through the late game, with tempo and the team’s power peak called out.'),
      img('03-timeline.png'),
      caption('Game Plan Timeline — a minute-by-minute plan with tempo and power-peak markers.'),

      h1('Demo Walkthrough'),
      p('Four scenarios, a couple of minutes each.'),
      num([b('Scout a real pro draft.'), t(' Open Import, paste a recent pro match ID, and load it. The full report — win probability, win condition, lanes, counters, and item builds — generates instantly for both teams.')]),
      num([b('Draft live and get coached.'), t(' Start a Captains Mode draft and assign roles as you pick. Suggestions update in real time (“still need: support”, “fills the open offlane slot”), and the timing note tells you when it’s safe to commit your greediest hero.')]),
      num([b('Show “free game vs. countered.”'), t(' Pick a counter-sensitive carry (Riki, Medusa), then add its counter to the enemy team (Bounty Hunter, Doom). Watch the hero flip from Free Game to Shut Down, with the reason named.')]),
      num([b('“What do I build?”'), t(' With a draft on the board, open the item panel for mechanic-matched recommendations — the right detection, break, anti-heal, or magic-resist item for that enemy lineup.')]),

      h1('Running It Locally'),
      p('Two dev servers; then open the app in a browser.'),
      code('# Backend (port 3001)'),
      code('cd backend && npm run dev'),
      code(''),
      code('# Frontend (port 5173)'),
      code('cd frontend && npm run dev'),
      p([t('Then open '), new TextRun({ text: 'http://localhost:5173', font: 'Consolas', size: 20 }), t('.')], { spacing: { before: 120 } }),

      h1('A Note on the Prediction Model'),
      p([t('The win probability is a '), b('draft-signal model'), t(' — trained and cross-validated on real pro matches and properly calibrated, but best read as a '), new TextRun({ text: 'lean', italics: true }), t(', not a guarantee. Draft alone caps how predictable a pro game is, because execution decides most of them. The surrounding “draft brain” is an expert coaching layer that turns draft knowledge into actionable advice.')]),
    ],
  }],
});

Packer.toBuffer(doc).then(buf => { fs.writeFileSync(OUT, buf); console.log('wrote', OUT, buf.length, 'bytes'); });
