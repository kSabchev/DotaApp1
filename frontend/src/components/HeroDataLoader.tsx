import { useEffect } from 'react';
import { useAppDispatch } from '../store/hooks';
import { setHeroes } from '../store/heroesSlice';
import { useGetHeroesQuery } from '../services/api';
import { buildHeroFromOpenDota, sortHeroes } from '../data/heroBuilder';
import { useBackendStatus } from '../data/backendStatus';

export default function HeroDataLoader({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { data: openDotaHeroes, isError, refetch } = useGetHeroesQuery();
  const backendStatus = useBackendStatus();

  useEffect(() => {
    if (openDotaHeroes && openDotaHeroes.length > 0) {
      const built = sortHeroes(openDotaHeroes.map(buildHeroFromOpenDota));
      dispatch(setHeroes(built));
    }
  }, [openDotaHeroes, dispatch]);

  // Cold start: the boot fetch fails while the free-tier backend is waking.
  // Refetch once it comes up so the session gets the full roster instead of
  // being stuck on the bundled fallback pool.
  useEffect(() => {
    if (backendStatus === 'ok' && isError) refetch();
  }, [backendStatus, isError, refetch]);

  if (isError) {
    // Backend down — silently continue with local data
    console.warn('OpenDota API unavailable, using local hero data');
  }

  return <>{children}</>;
}
