import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const BACKEND = 'http://localhost:3001/api';

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
  kills: number;
  deaths: number;
  assists: number;
  net_worth: number;
  hero_damage: number;
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
