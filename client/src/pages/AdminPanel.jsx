import { useState, useEffect, useRef } from 'react';
import { adminService } from '../services';
import { getErrorMessage } from '../utils/getErrorMessage';
import { onImageError } from '../utils/imageFallback';
import { useAuth } from '../context/AuthContext';
import './AdminPanel.css';

export default function AdminPanel() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'games' | 'users'
  const [stats, setStats] = useState({
    totalGames: 0,
    featuredGames: 0,
    totalUsers: 1,
    totalReviews: 0,
    developers: 0
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const [games, setGames] = useState([]);
  const [users, setUsers] = useState([]);
  const [gamesSearch, setGamesSearch] = useState('');
  // Tracks which tabs' data has already been fetched so switching tabs back
  // and forth doesn't re-hit the API every time (A2).
  const loadedTabs = useRef(new Set());

  // Overview's featured cards are derived from `games` (single source of truth)
  // instead of a separately-fetched list, so toggling featured never drifts (A3).
  const featuredGames = games.filter((g) => g.isFeatured);

  const loadData = async () => {
    try {
      // Games is fetched here (not just in the [activeTab] effect) so the
      // Overview tab has real featured-game data even if the user never
      // visits the Games tab.
      const [statsRes, gamesRes] = await Promise.all([
        adminService.getStats().catch(() => null),
        adminService.getGames({ limit: 50 }).catch(() => null),
      ]);

      if (statsRes?.data?.data) {
        setStats(statsRes.data.data);
      }
      if (gamesRes?.data?.data) {
        setGames(gamesRes.data.data);
        loadedTabs.current.add('games');
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'games' && !loadedTabs.current.has('games')) {
      adminService.getGames({ limit: 50 })
        .then(({ data }) => {
          setGames(data.data || []);
          loadedTabs.current.add('games');
        })
        .catch(console.error);
    }
    if (activeTab === 'users' && !loadedTabs.current.has('users')) {
      adminService.getUsers({ limit: 50 })
        .then(({ data }) => {
          setUsers(data.data || []);
          loadedTabs.current.add('users');
        })
        .catch(console.error);
    }
  }, [activeTab]);

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
        text: getErrorMessage(err, 'Failed to fetch and feature game from Steam')
      });
    } finally {
      setLoading(false);
    }
  };

  // handleRemoveFeatured always un-features (it's only reachable from the
  // Overview tab's already-featured cards), so it patches isFeatured to
  // false directly rather than needing the toggled-from value.
  const handleRemoveFeatured = async (id) => {
    try {
      await adminService.toggleFeatured(id);
      setGames((prev) => prev.map((g) => g._id === id ? { ...g, isFeatured: false } : g));
    } catch (err) {
      console.error(err);
    }
  };

  // Shared shape for the 4 toggle/update handlers below: call the API,
  // then patch the matching item in the list optimistically; alert on failure.
  const makeToggle = (apiCall, setList, patchFn) => async (id, ...args) => {
    try {
      await apiCall(id, ...args);
      setList((prev) => prev.map((item) => item._id === id ? patchFn(item, ...args) : item));
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleToggleFeatured = makeToggle(
    (id) => adminService.toggleFeatured(id),
    setGames,
    (g, current) => ({ ...g, isFeatured: !current })
  );

  const handleTogglePublished = makeToggle(
    (id) => adminService.togglePublished(id),
    setGames,
    (g, current) => ({ ...g, isPublished: !current })
  );

  const handleUpdateRole = makeToggle(
    adminService.updateUserRole,
    setUsers,
    (u, role) => ({ ...u, role })
  );

  const handleToggleUserStatus = makeToggle(
    (id) => adminService.toggleUserStatus(id),
    setUsers,
    (u, current) => ({ ...u, isActive: !current })
  );

  const filteredGames = games.filter((g) =>
    !gamesSearch || g.title?.toLowerCase().includes(gamesSearch.toLowerCase())
  );

  return (
    <div className="page-wrapper admin-page" style={{ backgroundColor: 'var(--bg-primary)', color: '#fff', minHeight: '100vh', padding: '40px 24px 80px' }}>
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
          {['overview', 'games', 'users'].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                background: activeTab === t ? '#3b82f6' : '#1e293b',
                color: '#fff'
              }}
            >
              {{ overview: '📊 Overview', games: '🎮 Games', users: '👥 Users' }[t]}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
            {/* METRICS ROW */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
              <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '6px' }}>🎮</div>
                <div style={{ fontSize: '2.2rem', fontWeight: 900 }}>{stats.totalGames ?? featuredGames.length}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Total Games</div>
              </div>

              <div style={{ background: 'var(--bg-card)', border: '1px solid #f59e0b', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '6px' }}>⭐</div>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#f59e0b' }}>{featuredGames.length}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Featured Games</div>
              </div>

              <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '6px' }}>👥</div>
                <div style={{ fontSize: '2.2rem', fontWeight: 900 }}>{stats.totalUsers ?? 1}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Total Users</div>
              </div>

              <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '6px' }}>📝</div>
                <div style={{ fontSize: '2.2rem', fontWeight: 900 }}>{stats.totalReviews ?? 0}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Total Reviews</div>
              </div>
            </div>

            {/* FEATURE STEAM GAME PANEL */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '32px', marginBottom: '40px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: '0 0 8px 0', color: '#f59e0b' }}>
                ★ Add Game to Featured Blockbusters
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '0 0 24px 0' }}>
                Type any game name (e.g. <em>Elden Ring</em>, <em>Cyberpunk 2077</em>, <em>Sekiro</em>) or Steam App ID (e.g. <em>1245620</em>). The server will retrieve live media, description, and pricing from Steam and push it into the homepage <strong>Featured Blockbusters</strong> section.
              </p>

              <form onSubmit={handleFeatureSubmit} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  aria-label="Search by game name or Steam App ID"
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
                <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '12px', textAlign: 'center', color: '#94a3b8' }}>
                  No games are currently featured. Use the search bar above to feature one!
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
                  {featuredGames.map((g) => (
                    <div key={g._id} style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      <img src={g.thumbnail} alt={g.title} onError={onImageError(260, 130)} style={{ width: '100%', height: '130px', objectFit: 'cover' }} />
                      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', color: '#fff' }}>{g.title}</h3>
                          <span style={{ color: '#10b981', fontWeight: 800 }}>${Number(g.price ?? 0).toFixed(2)}</span>
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
          </>
        )}

        {/* GAMES MANAGEMENT TAB */}
        {activeTab === 'games' && (
          <div className="admin-content animate-fade-in">
            <div className="admin-toolbar">
              <input
                className="form-input"
                aria-label="Search games"
                placeholder="Search games..."
                value={gamesSearch}
                onChange={(e) => setGamesSearch(e.target.value)}
                style={{ maxWidth: '300px' }}
              />
              <p className="text-muted text-sm">{filteredGames.length} games</p>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Game</th>
                    <th>Developer</th>
                    <th>Rating</th>
                    <th>Featured</th>
                    <th>Published</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGames.map((game) => (
                    <tr key={game._id}>
                      <td>
                        <div className="table-game-cell">
                          <div className="table-thumb">
                            {game.thumbnail ? <img src={game.thumbnail} alt="" /> : <span>🎮</span>}
                          </div>
                          <span className="table-game-title">{game.title}</span>
                        </div>
                      </td>
                      <td className="text-secondary text-sm">{game.developer?.username ?? '—'}</td>
                      <td className="text-sm">⭐ {game.avgRating?.toFixed(1) ?? '0.0'} ({game.reviewCount ?? 0})</td>
                      <td>
                        <button
                          className={`toggle-btn ${game.isFeatured ? 'active' : ''}`}
                          onClick={() => handleToggleFeatured(game._id, game.isFeatured)}
                          title={game.isFeatured ? 'Remove from featured' : 'Feature this game'}
                        >
                          {game.isFeatured ? '⭐ Featured' : '☆ Feature'}
                        </button>
                      </td>
                      <td>
                        <button
                          className={`toggle-btn ${game.isPublished ? 'published' : 'hidden'}`}
                          onClick={() => handleTogglePublished(game._id, game.isPublished)}
                        >
                          {game.isPublished ? '✅ Published' : '🔒 Hidden'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredGames.length === 0 && (
                <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                  No games found.
                </div>
              )}
            </div>
          </div>
        )}

        {/* USERS MANAGEMENT TAB */}
        {activeTab === 'users' && (
          <div className="admin-content animate-fade-in">
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const isSelf = user._id === currentUser?._id;
                    return (
                    <tr key={user._id}>
                      <td className="font-bold text-sm">{user.username}{isSelf ? ' (you)' : ''}</td>
                      <td className="text-secondary text-sm">{user.email}</td>
                      <td>
                        <select
                          className="role-select"
                          value={user.role}
                          disabled={isSelf}
                          title={isSelf ? 'You cannot change your own role' : undefined}
                          onChange={(e) => handleUpdateRole(user._id, e.target.value)}
                        >
                          <option value="gamer">Gamer</option>
                          <option value="developer">Developer</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td>
                        <button
                          className={`toggle-btn ${user.isActive ? 'published' : 'hidden'}`}
                          disabled={isSelf}
                          title={isSelf ? 'You cannot deactivate your own account' : undefined}
                          onClick={() => handleToggleUserStatus(user._id, user.isActive)}
                        >
                          {user.isActive ? '✅ Active' : '🚫 Banned'}
                        </button>
                      </td>
                      <td className="text-muted text-xs">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
              {users.length === 0 && (
                <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                  No users found.
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
