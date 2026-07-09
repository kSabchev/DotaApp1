import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE as BACKEND } from '../config';

export interface OpenDotaHero {
  id: number;
  name: string; // npc_dota_hero_antimage
  localized_name: string;
  primary_attr: 'str' | 'agi' | 'int' | 'all';
  attack_type: 'Melee' | 'Ranged';
  roles: string[];
  img: string;
  icon: string;
  base_health: number;
  base_mana: number;
  move_speed: number;
}

export interface OpenDotaMatch {
  match_id: number;
  radiant_win: boolean;
  duration: number;
  start_time: number;
  game_mode?: number;   // OpenDota enum: 2 = Captains Mode, 16 = Captains Draft, 22 = ranked AP, 23 = Turbo
  lobby_type?: number;
  radiant_team?: { name: string; tag: string };
  dire_team?: { name: string; tag: string };
  league?: { name: string };
  picks_bans: PickBan[] | null;
  players: MatchPlayer[];
  radiant_score: number;
  dire_score: number;
}

export interface PickBan {
  is_pick: boolean;
  hero_id: number;
  team: 0 | 1; // 0=radiant, 1=dire
  order: number;
}

export interface MatchPlayer {
  account_id: number;
  hero_id: number;
  personaname: string | null;
  team_number: 0 | 1;
  player_slot?: number;   // <128 = radiant, >=128 = dire
  isRadiant?: boolean;
  kills: number;
  deaths: number;
  assists: number;
  net_worth: number;
  hero_damage: number;
  gold_per_min?: number;
  xp_per_min?: number;
  level?: number;
  item_0?: number;        // final inventory, numeric item ids (0 = empty slot)
  item_1?: number;
  item_2?: number;
  item_3?: number;
  item_4?: number;
  item_5?: number;
}

export interface ProMatch {
  match_id: number;
  start_time: number;
  duration: number;
  radiant_team_id: number;
  dire_team_id: number;
  radiant_name: string;
  dire_name: string;
  leagueid: number;
  league_name: string;
  radiant_win: boolean;
  series_id: number;
  series_type: number;
}

export const dotaApi = createApi({
  reducerPath: 'dotaApi',
  baseQuery: fetchBaseQuery({ baseUrl: BACKEND }),
  endpoints: builder => ({
    getHeroes: builder.query<OpenDotaHero[], void>({
      query: () => '/heroes',
    }),
    getMatch: builder.query<OpenDotaMatch, string>({
      query: matchId => `/matches/${matchId}`,
    }),
    getProMatches: builder.query<ProMatch[], void>({
      query: () => '/pro-matches',
    }),
  }),
});

export const { useGetHeroesQuery, useGetMatchQuery, useGetProMatchesQuery } = dotaApi;

export function heroShortName(name: string): string {
  return name.replace('npc_dota_hero_', '');
}

export function heroImageUrl(name: string): string {
  const short = heroShortName(name);
  return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${short}.png`;
}

export function heroIconUrl(name: string): string {
  const short = heroShortName(name);
  return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/icons/${short}.png`;
}
