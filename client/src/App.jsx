import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Navbar from './components/Navbar/Navbar';
import HomePage from './pages/HomePage';
import GamesPage from './pages/GamesPage';
import GameDetailPage from './pages/GameDetailPage';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { ForumPage, ThreadPage } from './pages/ForumPages';
import DeveloperDashboard from './pages/DeveloperDashboard';
import GamerDashboard from './pages/GamerDashboard';
import SteamGamePage from './pages/SteamGamePage';
import AdminPanel from './pages/AdminPanel';

function NotFound() {
  return (
    <div className="page-wrapper loading-center" style={{ flexDirection: 'column', gap: '24px' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '6rem', lineHeight: 1 }}>🎮</p>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: '16px 0 8px' }}>404 — Game Over</h1>
        <p style={{ color: 'var(--text-muted)' }}>This page doesn't exist or was removed.</p>
        <a href="/" className="btn btn-primary" style={{ marginTop: '24px', display: 'inline-flex' }}>← Back to Home</a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/games/:id" element={<GameDetailPage />} />
          <Route path="/steam/:appId" element={<SteamGamePage />} />
          <Route path="/games/:gameId/forum" element={<ForumPage />} />
          <Route path="/threads/:threadId" element={<ThreadPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={['developer', 'admin']}>
                <DeveloperDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gamer-dashboard"
            element={
              <ProtectedRoute roles={['gamer', 'developer', 'admin']}>
                <GamerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
