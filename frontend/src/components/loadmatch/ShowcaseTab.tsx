import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectAllHeroes } from '../../store/selectors';
import { loadDraft } from '../../store/draftSlice';
import { SHOWCASE_DRAFTS } from '../../../../shared/showcaseDrafts';
import HeroPortrait from '../HeroPortrait';

/** Curated teaching drafts — load instantly, no network needed. */
export default function ShowcaseTab({ onLoaded }: { onLoaded: () => void }) {
  const dispatch = useAppDispatch();
  const heroes = useAppSelector(selectAllHeroes);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-gray-500 text-[10px]">
        Predefined drafts that each demonstrate one drafting archetype — load one and read the analysis.
      </p>
      {SHOWCASE_DRAFTS.map(sc => {
        const radiantIds = sc.draft.slots.filter(s => s.team === 'radiant').map(s => s.heroId);
        const direIds = sc.draft.slots.filter(s => s.team === 'dire').map(s => s.heroId);
        const portraits = (ids: (number | null)[]) =>
          ids.map(id => heroes.find(h => h.id === id)).filter(Boolean);
        return (
          // div, not button: HeroPortrait renders its own <button> and nested
          // buttons are invalid HTML (React logs hydration errors).
          <div
            key={sc.id}
            role="button"
            tabIndex={0}
            onClick={() => { dispatch(loadDraft(sc.draft)); onLoaded(); }}
            onKeyDown={e => { if (e.key === 'Enter') { dispatch(loadDraft(sc.draft)); onLoaded(); } }}
            className="flex flex-col gap-1.5 p-2.5 rounded border border-dota-border bg-dota-bg/40 hover:border-dota-accent/60 hover:bg-dota-bg transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-200">{sc.title}</span>
              <span className="text-[10px] text-dota-accent font-bold">load →</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {portraits(radiantIds).map(h => <HeroPortrait key={h!.id} hero={h!} size="sm" />)}
              </div>
              <span className="text-[9px] text-gray-600 font-bold">vs</span>
              <div className="flex gap-0.5">
                {portraits(direIds).map(h => <HeroPortrait key={h!.id} hero={h!} size="sm" />)}
              </div>
            </div>
            <p className="text-[10px] text-gray-500 leading-snug">{sc.blurb}</p>
          </div>
        );
      })}
    </div>
  );
}
