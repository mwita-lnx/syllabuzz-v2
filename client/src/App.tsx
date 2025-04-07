import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotesProvider } from './contexts/NotesContext';

// Import pages
import HomePage from './pages/home';
import UnitsPage from './pages/units';
import UnitDetailPage from './pages/units/Detail';
import NotesPage from './pages/notes';
import NoteDetailPage from './pages/notes/NotesDeatail';
import UploadPage from './pages/upload';

import LoginPage from './pages/auth/login';
import RegisterPage from './pages/auth/register';

import AdvancedSearchPage from './pages/search/AdvancedSearch';




import RevisionRoomListPage from './pages/revisionroom/rooms';
import RevisionRoomDetailPage from './pages/revisionroom/detail';
import PastPaperPage from './pages/pastpapers';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotesProvider>
      <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/units" element={<UnitsPage />} />
        <Route path="/units/:unitId" element={<UnitDetailPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/notes/:noteId" element={<NoteDetailPage />} />

        {/* Revision Room Routes */}
        <Route path="/revision" element={<RevisionRoomListPage />} />
        <Route path="/revision/:roomId" element={<RevisionRoomDetailPage />} />
        <Route path="/pastpapers" element={<PastPaperPage />} />

        <Route path="/upload" element={<UploadPage />} />

        {/* Auth Routes */}

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Search Routes */}
        <Route path="/search" element={<AdvancedSearchPage />} />
        <Route path="/search/:query" element={<AdvancedSearchPage />} />

      
        {/* Add more routes as needed */}

      </Routes>
    </Router>
      </NotesProvider>
    </AuthProvider>
  );
};

export default App;