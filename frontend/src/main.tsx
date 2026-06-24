import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { loadMeta } from './data/metaService'
import { loadWinModel } from './data/winModelService'

loadMeta(); // kick off in background — no await needed, UI degrades gracefully
loadWinModel(); // fetch trained win model for live win-probability display

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
