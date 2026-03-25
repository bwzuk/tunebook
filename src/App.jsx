import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LibraryProvider } from './contexts/LibraryContext';
import { SetsProvider } from './contexts/SetsContext';
import Layout from './components/Layout';
import SearchPage from './pages/SearchPage';
import LibraryPage from './pages/LibraryPage';
import TuneDetailPage from './pages/TuneDetailPage';
import SetsPage from './pages/SetsPage';
import SetDetailPage from './pages/SetDetailPage';
import CheatbookPage from './pages/CheatbookPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <LibraryProvider>
        <SetsProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<SearchPage />} />
              <Route path="library" element={<LibraryPage />} />
              <Route path="library/:id" element={<TuneDetailPage />} />
              <Route path="sets" element={<SetsPage />} />
              <Route path="sets/:id" element={<SetDetailPage />} />
              <Route path="cheatbook" element={<CheatbookPage />} />
              <Route path="cheatbook/:setId" element={<CheatbookPage />} />
            </Route>
          </Routes>
        </SetsProvider>
      </LibraryProvider>
    </BrowserRouter>
  );
}

export default App;
