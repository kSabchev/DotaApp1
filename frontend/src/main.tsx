import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { loadMeta, metaPickBoost } from './data/metaService'
import { loadWinModel } from './data/winModelService'
import { getApiMatchupAdvantage, bumpMatchupsVersion } from './data/matchupService'
import { setLiveMatchupProvider, setMetaPickProvider } from './utils/scoring'

// Kick off in background — no await needed, UI degrades gracefully. Bump the
// live-data version once meta arrives so open analyses pick up the meta boost.
loadMeta().then(() => bumpMatchupsVersion());
loadWinModel(); // fetch trained win model for live win-probability display
// Let the scoring engine blend live OpenDota win-rates into matchup advantage
// and weigh patch-meta popularity in pick suggestions.
setLiveMatchupProvider(getApiMatchupAdvantage);
setMetaPickProvider(metaPickBoost);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
