import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { loadMeta } from './data/metaService'
import { loadWinModel } from './data/winModelService'
import { getApiMatchupAdvantage } from './data/matchupService'
import { setLiveMatchupProvider } from './utils/scoring'

loadMeta(); // kick off in background — no await needed, UI degrades gracefully
loadWinModel(); // fetch trained win model for live win-probability display
// Let the scoring engine blend live OpenDota win-rates into matchup advantage.
setLiveMatchupProvider(getApiMatchupAdvantage);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
