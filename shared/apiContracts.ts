// Response shapes shared between backend routes and frontend services, so the
// two sides can't silently drift (backend tsconfig already compiles ../shared).

/** GET /api/players/:accountId/matches — one recent game of a player. */
export interface RecentMatchSummary {
  matchId: number;
  heroId: number;
  isRadiant: boolean;
  win: boolean;
  startTime: number;    // unix seconds
  durationSec: number;
  gameMode: number;     // OpenDota game_mode enum (2 = Captains Mode)
  lobbyType: number;
  kills: number;
  deaths: number;
  assists: number;
}

/** GET /api/heroes/:id/pros — a pro player who recently played this hero. */
export interface HeroProEntry {
  accountId: number;
  playerName: string;        // pro handle from /proPlayers
  teamName: string | null;
  recentMatches: { matchId: number; startTime: number; win: boolean }[]; // up to 3
}
