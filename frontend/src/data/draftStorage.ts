import type { DraftSlot, Role } from '../types';

export type DraftOutcome = 'radiant_win' | 'dire_win' | 'unknown';

export interface SavedDraft {
  id: string;
  name: string;
  notes: string;
  outcome: DraftOutcome;
  savedAt: number;
  // Snapshot of the slot array (preserves pick/ban order and team)
  slots: DraftSlot[];
  mode: 'captains' | 'manual';
  startingTeam: 'radiant' | 'dire';
  roleAssignments: Record<number, Role>;
}

const STORAGE_KEY = 'dota2_draft_history';

export function loadSavedDrafts(): SavedDraft[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedDraft[]) : [];
  } catch {
    return [];
  }
}

export function saveDraft(draft: SavedDraft): void {
  const drafts = loadSavedDrafts();
  // Replace if same id, otherwise prepend
  const idx = drafts.findIndex(d => d.id === draft.id);
  if (idx >= 0) drafts[idx] = draft;
  else drafts.unshift(draft);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

export function deleteDraft(id: string): void {
  const drafts = loadSavedDrafts().filter(d => d.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
