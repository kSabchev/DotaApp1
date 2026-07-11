import { useParams, Link } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { selectAllHeroes } from '../store/selectors';
import PageShell from '../components/layout/PageShell';
import HeroPortrait from '../components/HeroPortrait';
import PlaystyleBadges from '../components/hero/PlaystyleBadges';
import HeroMatchupSection from '../components/hero/HeroMatchupSection';
import HeroItemBuildSection from '../components/hero/HeroItemBuildSection';
import HeroCounterItemsSection from '../components/hero/HeroCounterItemsSection';
import HeroProsSection from '../components/hero/HeroProsSection';
import { computeTeamCapabilities, CAPABILITY_ORDER, CAPABILITY_LABELS } from '../../../shared/capabilities';
import { getHeroMeta, getProHeroMeta, getProMetaWindow, TIER_LABEL, TIER_COLOR } from '../data/metaService';

const ATTR_LABEL: Record<string, string> = {
  strength: 'Strength', agility: 'Agility', intelligence: 'Intelligence', universal: 'Universal',
};
const ATTR_COLOR: Record<string, string> = {
  strength: 'text-red-400', agility: 'text-green-400', intelligence: 'text-blue-400', universal: 'text-purple-400',
};

export default function HeroDetailPage() {
  const { heroName } = useParams<{ heroName: string }>();
  const heroes = useAppSelector(selectAllHeroes);
  const loaded = useAppSelector(s => s.heroes.loaded);

  const hero = heroes.find(h => h.name === heroName);

  if (!hero) {
    return (
      <PageShell title={loaded ? 'Hero not found' : 'Loading…'}>
        {loaded ? (
          <p className="text-gray-400 text-sm">
            No hero named “{heroName}”. <Link to="/heroes" className="text-dota-accent hover:underline">Back to all heroes</Link>
          </p>
        ) : (
          <p className="text-gray-500 text-sm">Loading hero data…</p>
        )}
      </PageShell>
    );
  }

  const caps = computeTeamCapabilities([hero], 0);
  const meta = getHeroMeta(hero.id);
  const proMeta = getProHeroMeta(hero.id);
  const proWindow = getProMetaWindow();

  return (
    <PageShell>
      {/* Identity header */}
      <div className="flex items-start gap-4 mb-4 flex-wrap">
        <HeroPortrait hero={hero} size="lg" />
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-dota-accent font-black text-2xl">{hero.displayName}</h1>
            {meta && (
              <span className={['text-[10px] px-1.5 py-0.5 rounded font-bold border', TIER_COLOR[meta.tier]].join(' ')}>
                {TIER_LABEL[meta.tier]}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
            <span className={ATTR_COLOR[hero.attribute]}>{ATTR_LABEL[hero.attribute]}</span>
            <span>·</span>
            <span className="capitalize">{hero.attack}</span>
            <span>·</span>
            <span>Complexity {'★'.repeat(hero.complexity)}</span>
            {hero.metaRole && (<><span>·</span><span className="uppercase">{hero.metaRole}</span></>)}
          </div>
          <PlaystyleBadges hero={hero} />
          {proMeta && proWindow && proMeta.picks + proMeta.bans > 0 && (
            <p className="text-[10px] text-amber-300/90">
              Tournament meta: picked {proMeta.picks}× / banned {proMeta.bans}× ({Math.round(proMeta.contestRate * 100)}% contest,
              {' '}{Math.round(proMeta.winRate * 100)}% win rate) across {proWindow.matches} pro games from {proWindow.leagues} recent leagues
            </p>
          )}
        </div>
        <Link to="/heroes" className="ml-auto text-[10px] text-gray-500 hover:text-dota-accent transition-colors shrink-0">
          ← all heroes
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Strengths / weaknesses / spikes */}
        <div className="bg-dota-surface rounded-lg border border-dota-border p-4 flex flex-col gap-3">
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-green-500 mb-1.5">Strengths</h4>
            <ul className="flex flex-col gap-1">
              {hero.strengths.map((s, i) => (
                <li key={i} className="text-xs text-green-300 flex gap-1.5"><span className="text-green-600 mt-0.5">+</span><span>{s}</span></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-red-500 mb-1.5">Weaknesses</h4>
            <ul className="flex flex-col gap-1">
              {hero.weaknesses.map((w, i) => (
                <li key={i} className="text-xs text-red-300 flex gap-1.5"><span className="text-red-600 mt-0.5">–</span><span>{w}</span></li>
              ))}
            </ul>
          </div>
          {hero.powerSpikes.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1.5">Power Spikes</h4>
              <div className="flex gap-1.5 flex-wrap">
                {hero.powerSpikes.map((p, i) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-300 border border-amber-800/40">{p}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* What this hero contributes (capability axes) */}
        <div className="bg-dota-surface rounded-lg border border-dota-border p-4">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">What {hero.displayName} brings</h4>
          <div className="flex flex-col gap-1.5">
            {CAPABILITY_ORDER.map(id => {
              const axis = caps[id];
              if (axis.score === 0) return null;
              return (
                <div key={id} className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 w-20 shrink-0">{CAPABILITY_LABELS[id]}</span>
                  <div className="flex-1 h-1.5 bg-dota-bg rounded overflow-hidden">
                    <div className="h-full bg-dota-accent/70 rounded" style={{ width: `${axis.score * 10}%` }} />
                  </div>
                  <span className="text-[10px] text-gray-500 w-5 text-right">{axis.score}</span>
                </div>
              );
            })}
          </div>
          <p className="text-[9px] text-gray-600 mt-2">Solo contribution on a 0–10 team scale — combine with teammates to fill the rest.</p>
        </div>

        {/* Items that counter this hero */}
        <HeroCounterItemsSection hero={hero} />

        {/* Item progression (live) */}
        <HeroItemBuildSection hero={hero} />
      </div>

      <div className="flex flex-col gap-4 mt-4">
        {/* Matchups: curated + live */}
        <HeroMatchupSection hero={hero} heroes={heroes} />

        {/* Pros to watch + loadable replays */}
        <HeroProsSection hero={hero} />
      </div>
    </PageShell>
  );
}
