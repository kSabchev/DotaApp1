// Eyeball the item matcher without the UI.
//   npm run checkmatchups -- antimage,crystal_maiden vs phantom_assassin,tidehunter,zuus
import { getHeroPool } from '../ingest/heroPool';
import { computeItemMatchups, type ItemRec } from '../../../shared/matchups';
import type { Hero } from '../../../shared/types';

function resolve(pool: Hero[], token: string): Hero | undefined {
  const t = token.trim().toLowerCase().replace(/\s+/g, '_');
  return pool.find(h => h.name === t)
    ?? pool.find(h => h.displayName.toLowerCase().replace(/\s+/g, '_') === t)
    ?? pool.find(h => h.name.includes(t) || h.displayName.toLowerCase().includes(token.trim().toLowerCase()));
}

function printRecs(title: string, recs: ItemRec[]) {
  console.log(`\n══ ${title} ══`);
  if (!recs.length) { console.log('  (nothing notable)'); return; }
  for (const r of recs) {
    const tag = r.priority === 'core' ? 'CORE' : 'situational';
    console.log(`\n  ${r.itemName}  [${tag}] → ${r.buyerRole}${r.buyerInTeam ? '' : ' (no natural buyer on team)'}`);
    for (const a of r.answers) console.log(`     • ${a.reason}`);
  }
}

async function main() {
  const joined = process.argv.slice(2).join(' ');
  const [left, right] = joined.split(/\s+vs\s+/i);
  if (!left || !right) {
    console.error('Usage: npm run checkmatchups -- hero,hero,... vs hero,hero,...');
    process.exit(1);
  }
  const pool = await getHeroPool();
  const mine = left.split(',').map(s => resolve(pool, s)).filter(Boolean) as Hero[];
  const theirs = right.split(',').map(s => resolve(pool, s)).filter(Boolean) as Hero[];

  console.log('MY TEAM   :', mine.map(h => h.displayName).join(', '));
  console.log('ENEMY TEAM:', theirs.map(h => h.displayName).join(', '));

  const { recommended, threats } = computeItemMatchups(mine, theirs);
  printRecs('ITEMS TO BUILD (answer their lineup)', recommended);
  printRecs("ITEMS THEY'LL BUILD (answer your lineup)", threats);
}

main().catch(err => { console.error(err); process.exit(1); });
