import { useEffect, useState } from 'react';
import { primeMatchups, getMatchupsVersion } from './matchupService';

// Primes OpenDota matchup win-rates for the given heroes and returns a version
// that advances as data streams in. Include the return value in an analyzeTeam
// memo's deps so the analysis recomputes (picking up the live-blended matchup
// advantage) once fresh win-rate data has loaded.
export function useMatchupVersion(heroIds: number[]): number {
  const [, setTick] = useState(0);
  useEffect(() => {
    primeMatchups(heroIds);
    // Win-rate fetches are async; nudge a re-render so the version is re-read.
    const t1 = setTimeout(() => setTick(n => n + 1), 700);
    const t2 = setTimeout(() => setTick(n => n + 1), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroIds.join(',')]);
  return getMatchupsVersion();
}
