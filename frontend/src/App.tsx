import { Provider } from 'react-redux';
import { store } from './store/store';
import DraftScreen from './components/DraftScreen';
import HeroDataLoader from './components/HeroDataLoader';

function App() {
  return (
    <Provider store={store}>
      <HeroDataLoader>
        <DraftScreen />
      </HeroDataLoader>
    </Provider>
  );
}

export default App;
