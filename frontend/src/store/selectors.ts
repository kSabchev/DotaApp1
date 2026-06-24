import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from './store';

export const selectDraft = (state: RootState) => state.draft;
export const selectAllHeroes = (state: RootState) => state.heroes.heroes;

export const selectRadiantPicks = createSelector(selectDraft, draft =>
  draft.slots
    .filter(s => s.phase === 'pick' && s.team === 'radiant' && s.heroId !== null)
    .map(s => s.heroId!),
);

export const selectDirePicks = createSelector(selectDraft, draft =>
  draft.slots
    .filter(s => s.phase === 'pick' && s.team === 'dire' && s.heroId !== null)
    .map(s => s.heroId!),
);

export const selectBans = createSelector(selectDraft, draft =>
  draft.slots
    .filter(s => s.phase === 'ban' && s.heroId !== null)
    .map(s => s.heroId!),
);

export const selectUsedHeroIds = createSelector(selectDraft, draft =>
  draft.slots.filter(s => s.heroId !== null).map(s => s.heroId!),
);

export const selectAvailableHeroes = createSelector(
  selectAllHeroes,
  selectUsedHeroIds,
  (heroes, usedIds) => heroes.filter(h => !usedIds.includes(h.id)),
);

export const selectCurrentSlot = createSelector(selectDraft, draft =>
  draft.slots[draft.currentSlotIndex] ?? null,
);

export const selectHeroById = (id: number) =>
  createSelector(selectAllHeroes, heroes => heroes.find(h => h.id === id));
