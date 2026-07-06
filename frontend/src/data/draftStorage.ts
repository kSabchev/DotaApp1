// localStorage persistence for saved drafts. The SavedDraft type moved to the
// shared core (shared/types.ts) so showcase drafts and future server-side
// persistence use the same shape; re-exported here so existing imports keep
// working unchanged.
import type { SavedDraft } from '../types';

export type { SavedDraft, DraftOutcome } from '../types';

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
