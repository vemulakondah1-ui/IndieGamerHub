// client/src/pages/AdminPanel.jsx
import { useState, useEffect } from 'react';
import { adminService } from '../services';
import './AdminPanel.css';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'games' | 'users'
  const [stats, setStats] = useState({
    totalGames: 0,
    featuredGames: 0,
    totalUsers: 1,
    totalReviews: 0,
    developers: 0
  });

  // Feature input state
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [featuredGames, setFeaturedGames] = useState([]);

  const loadData = async () => {
    try {
      const [statsRes, featuredRes] = await Promise.all([
        adminService.getStats().catch(() => null),
        adminService.getFeaturedGames().catch(() => null),
      ]);

      if (statsRes?.data?.data) {
        setStats(statsRes.data.data);
      }
      if (featuredRes?.data?.data) {
        setFeaturedGames(featuredRes.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFeatureSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setFeedback({ type: '', text: '' });

    try {
      const res = await adminService.featureSteamGame(searchQuery);
      setFeedback({ type: 'success', text: res.data?.message ?? 'Game featured successfully!' });
      setSearchQuery('');
      loadData();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to fetch and feature game from Steam'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFeatured = async (id) => {
    try {
      await adminService.toggleFeatured(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="page-wrapper admin-page" style={{ backgroundColor: '#0b0f19', color: '#fff', minHeight: '100vh', padding: '40px 24px 80px' }}>
      <div className="container" style={{ maxWidth: '1400px', margin: '0 auto' }}>

        {/* HEADER */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#f59e0b', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            ⚡ Admin Panel
          </h1>
          <p style={{ color: '#94a3b8', margin: 0 }}>Platform management and featured curation dashboard</p>
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '36px' }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'overview' ? '#3b82f6' : '#1e293b',
              color: '#fff'
            }}
          >
            📊 Overview
          </button>
        </div>

        {/* METRICS ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '6px' }}>🎮</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900 }}>{stats.totalGames ?? featuredGames.length}</div>
            <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Total Games</div>
          </div>

          <div style={{ background: '#111827', border: '1px solid #f59e0b', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '6px' }}>⭐</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#f59e0b' }}>{featuredGames.length}</div>
            <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Featured Games</div>
          </div>

          <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '6px' }}>👥</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900 }}>{stats.totalUsers || 1}</div>
            <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Total Users</div>
          </div>

          <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '6px' }}>📝</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900 }}>{stats.totalReviews || 0}</div>
            <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Total Reviews</div>
          </div>
        </div>

        {/* FEATURE STEAM GAME PANEL */}
        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '32px', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: '0 0 8px 0', color: '#f59e0b' }}>
            ★ Add Game to Featured Blockbusters
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '0 0 24px 0' }}>
            Type any game name (e.g. <em>Elden Ring</em>, <em>Cyberpunk 2077</em>, <em>Sekiro</em>) or Steam App ID (e.g. <em>1245620</em>). The server will retrieve live media, description, and pricing from Steam and push it into the homepage <strong>Featured Blockbusters</strong> section.
          </p>

          <form onSubmit={handleFeatureSubmit} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search by game name or Steam App ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                minWidth: '280px',
                padding: '14px 20px',
                borderRadius: '10px',
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '14px 28px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                border: 'none',
                color: '#000',
                fontWeight: 900,
                fontSize: '1rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s'
              }}
            >
              {loading ? 'Fetching Steam Data...' : '★ Fetch & Feature'}
            </button>
          </form>

          {feedback.text && (
            <div style={{
              marginTop: '20px',
              padding: '12px 16px',
              borderRadius: '8px',
              background: feedback.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              border: `1px solid ${feedback.type === 'success' ? '#10b981' : '#ef4444'}`,
              color: feedback.type === 'success' ? '#34d399' : '#f87171',
              fontWeight: 600
            }}>
              {feedback.text}
            </div>
          )}
        </div>

        {/* ACTIVE FEATURED CARDS */}
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px' }}>
            Active Featured Games ({featuredGames.length})
          </h2>

          {featuredGames.length === 0 ? (
            <div style={{ background: '#111827', padding: '32px', borderRadius: '12px', textAlign: 'center', color: '#94a3b8' }}>
              No games are currently featured. Use the search bar above to feature one!
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
              {featuredGames.map((g) => (
                <div key={g._id} style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <img src={g.thumbnail} alt={g.title} style={{ width: '100%', height: '130px', objectFit: 'cover' }} />
                  <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', color: '#fff' }}>{g.title}</h4>
                      <span style={{ color: '#10b981', fontWeight: 800 }}>${Number(g.price || 0).toFixed(2)}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveFeatured(g._id)}
                      style={{
                        marginTop: '16px',
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        color: '#f87171',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.85rem'
                      }}
                    >
                      Unfeature Game
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}