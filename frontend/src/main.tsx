import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { loadMeta, metaPickBoost } from './data/metaService'
import { loadWinModel } from './data/winModelService'
import { getApiMatchupAdvantage, bumpMatchupsVersion } from './data/matchupService'
import { warmBackend } from './data/backendStatus'
import { setLiveMatchupProvider, setMetaPickProvider } from './utils/scoring'

// Fast path: kick the one-shot loaders immediately (no await — UI degrades
// gracefully). Cold-start path: warmBackend() pings /health right away, which
// is what triggers the free-tier host to spin up; once it answers, re-run the
// loaders (they're idempotent, so this is a no-op when the fast path worked)
// and bump the live-data version so open analyses recompute.
loadMeta().then(() => bumpMatchupsVersion());
loadWinModel();
warmBackend().then(ok => {
  if (!ok) return;
  loadMeta().then(() => bumpMatchupsVersion());
  loadWinModel();
});
// Let the scoring engine blend live OpenDota win-rates into matchup advantage
// and weigh patch-meta popularity in pick suggestions.
setLiveMatchupProvider(getApiMatchupAdvantage);
setMetaPickProvider(metaPickBoost);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
