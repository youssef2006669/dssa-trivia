import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// 1. IMPORT ALL YOUR REAL COMPONENTS HERE
import Navbar from './components/layout/Navbar';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import CreatePack from './pages/CreatePack';
import MyPacks from './pages/MyPacks';
import Lobby from './pages/Lobby';
import GameRoom from './pages/GameRoom'; // <-- ADD THIS
import EditPack from './pages/EditPack';
import Landing from './pages/Landing';

// 2. KEEP ONLY THE PLACEHOLDERS WE HAVEN'T BUILT YET

function App() {
  const { user, loading, initAuthListener } = useAuthStore();

  // Listen for Firebase login state
  useEffect(() => {
    initAuthListener();
  }, [initAuthListener]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-dssa-blue font-bold">Loading DSSA...</div>;
  }

  return (
    <Router>
      <div className="min-h-screen bg-dssa-light font-sans">
        {/* Navbar sits outside the routes so it shows on every page */}
        <Navbar /> 
        
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={user ? <Navigate to="/dashboard" /> : <Auth />} />
          
          {/* Protected Routes - Only accessible if logged in */}
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/auth" />} />
          <Route path="/packs/create" element={user ? <CreatePack /> : <Navigate to="/auth" />} />
          <Route path="/packs" element={user ? <MyPacks /> : <Navigate to="/auth" />} />
          <Route path="/lobby" element={user ? <Lobby /> : <Navigate to="/auth" />} />
          <Route path="/room/:roomId" element={user ? <GameRoom /> : <Navigate to="/auth" />} />
       <Route path="/packs/edit/:packId" element={user ? <EditPack /> : <Navigate to="/auth" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;