import { lazy, Suspense } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { store } from './store/store';
import DraftScreen from './components/DraftScreen';
import HeroDataLoader from './components/HeroDataLoader';

// The draft screen is the app's entry surface and stays in the main chunk;
// the info pages load on demand so their code (and page-only data like the
// tips collection) stays out of the initial bundle.
const HeroIndexPage = lazy(() => import('./pages/HeroIndexPage'));
const HeroDetailPage = lazy(() => import('./pages/HeroDetailPage'));
const TipsPage = lazy(() => import('./pages/TipsPage'));

function PageFallback() {
  return (
    <div className="flex flex-col min-h-screen bg-dota-bg items-center justify-center">
      <p className="text-gray-500 text-sm">Loading…</p>
    </div>
  );
}

// Provider and HeroDataLoader sit OUTSIDE the routes so the Redux draft
// state and the one-time hero fetch survive navigation between pages.
function App() {
  return (
    <Provider store={store}>
      <HeroDataLoader>
        <BrowserRouter>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<DraftScreen />} />
              <Route path="/heroes" element={<HeroIndexPage />} />
              <Route path="/heroes/:heroName" element={<HeroDetailPage />} />
              <Route path="/tips" element={<TipsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </HeroDataLoader>
    </Provider>
  );
}

export default App;
