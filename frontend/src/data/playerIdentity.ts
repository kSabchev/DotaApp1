// The user's Dota identity. Today this is a manually-entered Friend ID
// (numeric 32-bit account id, public OpenDota data — no auth); the provider
// field reserves the slot for a real Steam OpenID login later without a
// storage migration.
export interface PlayerIdentity {
  provider: 'friend_id' | 'steam_openid';
  accountId: number;
  personaName?: string;
  linkedAt: number;
}

const STORAGE_KEY = 'dota2_player_identity';

export function getPlayerIdentity(): PlayerIdentity | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlayerIdentity;
    return typeof parsed?.accountId === 'number' ? parsed : null;
  } catch {
    return null;
  }
}

export function setPlayerIdentity(identity: PlayerIdentity): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
}

export function clearPlayerIdentity(): void {
  localStorage.removeItem(STORAGE_KEY);
}
