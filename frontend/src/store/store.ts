import { configureStore } from '@reduxjs/toolkit';
import draftReducer from './draftSlice';
import heroesReducer from './heroesSlice';
import { dotaApi } from '../services/api';

export const store = configureStore({
  reducer: {
    draft: draftReducer,
    heroes: heroesReducer,
    [dotaApi.reducerPath]: dotaApi.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(dotaApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
