import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { DraftSlot, DraftTeam, Role } from '../types';
import type { SavedDraft } from '../data/draftStorage';
import { buildCaptainsModeOrder, MANUAL_ORDER, MANUAL_PICKS_ONLY_ORDER } from '../data/draftOrder';

interface DraftState {
  slots: DraftSlot[];
  currentSlotIndex: number;
  history: { slotIndex: number; heroId: number }[];
  mode: 'captains' | 'manual';
  phase: 'drafting' | 'complete';
  bansEnabled: boolean;
  startingTeam: DraftTeam;
  roleAssignments: Record<number, Role>; // heroId -> assigned role
}

const buildSlots = (order: Omit<DraftSlot, 'heroId'>[]): DraftSlot[] =>
  order.map(s => ({ ...s, heroId: null }));

function buildOrder(mode: 'captains' | 'manual', startingTeam: DraftTeam, bansEnabled: boolean): Omit<DraftSlot, 'heroId'>[] {
  if (mode === 'captains') return buildCaptainsModeOrder(startingTeam);
  return bansEnabled ? MANUAL_ORDER : MANUAL_PICKS_ONLY_ORDER;
}

const initialState: DraftState = {
  slots: buildSlots(buildCaptainsModeOrder('radiant')),
  currentSlotIndex: 0,
  history: [],
  mode: 'captains',
  phase: 'drafting',
  bansEnabled: true,
  startingTeam: 'radiant',
  roleAssignments: {},
};

const draftSlice = createSlice({
  name: 'draft',
  initialState,
  reducers: {
    selectHero(state, action: PayloadAction<number>) {
      const heroId = action.payload;
      if (state.phase !== 'drafting') return;

      const slot = state.slots[state.currentSlotIndex];
      if (!slot || slot.heroId !== null) return;

      slot.heroId = heroId;
      state.history.push({ slotIndex: state.currentSlotIndex, heroId });

      if (state.currentSlotIndex < state.slots.length - 1) {
        state.currentSlotIndex++;
      } else {
        state.phase = 'complete';
      }
    },
    undoLastPick(state) {
      if (state.history.length === 0) return;
      const last = state.history.pop()!;
      const removedHeroId = state.slots[last.slotIndex].heroId;
      state.slots[last.slotIndex].heroId = null;
      state.currentSlotIndex = last.slotIndex;
      state.phase = 'drafting';
      // Remove role assignment for undone hero
      if (removedHeroId !== null) {
        delete state.roleAssignments[removedHeroId];
      }
    },
    resetDraft(state) {
      state.slots = buildSlots(buildOrder(state.mode, state.startingTeam, state.bansEnabled));
      state.currentSlotIndex = 0;
      state.history = [];
      state.phase = 'drafting';
      state.roleAssignments = {};
    },
    setMode(state, action: PayloadAction<'captains' | 'manual'>) {
      state.mode = action.payload;
      state.slots = buildSlots(buildOrder(action.payload, state.startingTeam, state.bansEnabled));
      state.currentSlotIndex = 0;
      state.history = [];
      state.phase = 'drafting';
      state.roleAssignments = {};
    },
    setBansEnabled(state, action: PayloadAction<boolean>) {
      if (state.mode !== 'manual') return;
      state.bansEnabled = action.payload;
      state.slots = buildSlots(buildOrder('manual', state.startingTeam, action.payload));
      state.currentSlotIndex = 0;
      state.history = [];
      state.phase = 'drafting';
      state.roleAssignments = {};
    },
    setStartingTeam(state, action: PayloadAction<DraftTeam>) {
      state.startingTeam = action.payload;
      state.slots = buildSlots(buildOrder(state.mode, action.payload, state.bansEnabled));
      state.currentSlotIndex = 0;
      state.history = [];
      state.phase = 'drafting';
      state.roleAssignments = {};
    },
    assignRole(state, action: PayloadAction<{ heroId: number; role: Role }>) {
      state.roleAssignments[action.payload.heroId] = action.payload.role;
    },
    loadDraft(state, action: PayloadAction<SavedDraft>) {
      const d = action.payload;
      state.mode = d.mode;
      state.startingTeam = d.startingTeam;
      state.slots = d.slots;
      state.roleAssignments = d.roleAssignments;
      // Reconstruct history from filled slots
      state.history = d.slots
        .map((s, i) => (s.heroId !== null ? { slotIndex: i, heroId: s.heroId } : null))
        .filter(Boolean) as { slotIndex: number; heroId: number }[];
      // Find first unfilled slot
      const firstEmpty = d.slots.findIndex(s => s.heroId === null);
      state.currentSlotIndex = firstEmpty >= 0 ? firstEmpty : d.slots.length - 1;
      state.phase = firstEmpty < 0 ? 'complete' : 'drafting';
      state.bansEnabled = d.slots.some(s => s.phase === 'ban');
    },
  },
});

export const { selectHero, undoLastPick, resetDraft, setMode, setBansEnabled, setStartingTeam, assignRole, loadDraft } = draftSlice.actions;
export default draftSlice.reducer;
