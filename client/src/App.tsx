import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Import pages
import HomePage from './pages/home';
import UnitsPage from './pages/units';
import UnitDetailPage from './pages/units/Detail';
import NotesPage from './pages/notes';

import LoginPage from './pages/auth/login';
import RegisterPage from './pages/auth/register';




import RevisionRoomListPage from './pages/revisionroom/rooms';
import RevisionRoomDetailPage from './pages/revisionroom/detail';
import PastPaperPage from './pages/pastpapers';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/units" element={<UnitsPage />} />
        <Route path="/units/:unitId" element={<UnitDetailPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/revision" element={<RevisionRoomListPage />} />
        <Route path="/revision/:roomId" element={<RevisionRoomDetailPage />} />
        <Route path="/pastpapers" element={<PastPaperPage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      
        {/* Add more routes as needed */}

      </Routes>
    </Router>
    </AuthProvider>
  );
};

export default App;