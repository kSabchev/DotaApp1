import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { store } from './store/store';
import DraftScreen from './components/DraftScreen';
import HeroDataLoader from './components/HeroDataLoader';
import HeroIndexPage from './pages/HeroIndexPage';
import HeroDetailPage from './pages/HeroDetailPage';
import TipsPage from './pages/TipsPage';

// Provider and HeroDataLoader sit OUTSIDE the routes so the Redux draft
// state and the one-time hero fetch survive navigation between pages.
function App() {
  return (
    <Provider store={store}>
      <HeroDataLoader>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<DraftScreen />} />
            <Route path="/heroes" element={<HeroIndexPage />} />
            <Route path="/heroes/:heroName" element={<HeroDetailPage />} />
            <Route path="/tips" element={<TipsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </HeroDataLoader>
    </Provider>
  );
}

export default App;
