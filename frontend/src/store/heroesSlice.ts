import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Hero } from '../types';
import { HEROES as LOCAL_HEROES } from '../data/heroes';

interface HeroesState {
  heroes: Hero[];
  loaded: boolean;
}

const initialState: HeroesState = {
  heroes: LOCAL_HEROES, // start with local data, replace when API loads
  loaded: false,
};

const heroesSlice = createSlice({
  name: 'heroes',
  initialState,
  reducers: {
    setHeroes(state, action: PayloadAction<Hero[]>) {
      state.heroes = action.payload;
      state.loaded = true;
    },
  },
});

export const { setHeroes } = heroesSlice.actions;
export default heroesSlice.reducer;
