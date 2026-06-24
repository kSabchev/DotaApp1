import { useEffect } from 'react';
import { useAppDispatch } from '../store/hooks';
import { setHeroes } from '../store/heroesSlice';
import { useGetHeroesQuery } from '../services/api';
import { buildHeroFromOpenDota, sortHeroes } from '../data/heroBuilder';

export default function HeroDataLoader({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { data: openDotaHeroes, isError } = useGetHeroesQuery();

  useEffect(() => {
    if (openDotaHeroes && openDotaHeroes.length > 0) {
      const built = sortHeroes(openDotaHeroes.map(buildHeroFromOpenDota));
      dispatch(setHeroes(built));
    }
  }, [openDotaHeroes, dispatch]);

  if (isError) {
    // Backend down — silently continue with local data
    console.warn('OpenDota API unavailable, using local hero data');
  }

  return <>{children}</>;
}
