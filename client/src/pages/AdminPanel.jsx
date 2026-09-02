import { useState, useEffect } from 'react';
import { adminService } from '../services';
import './AdminPanel.css';

export default function AdminPanel() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [games, setGames] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gamesSearch, setGamesSearch] = useState('');

  useEffect(() => {
    adminService.getStats()
      .then(({ data }) => setStats(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 'games') {
      adminService.getGames({ limit: 50 })
        .then(({ data }) => setGames(data.data || []))
        .catch(console.error);
    }
    if (tab === 'users') {
      adminService.getUsers({ limit: 50 })
        .then(({ data }) => setUsers(data.data || []))
        .catch(console.error);
    }
  }, [tab]);

  const handleToggleFeatured = async (id, current) => {
    try {
      await adminService.toggleFeatured(id);
      setGames((prev) => prev.map((g) => g._id === id ? { ...g, isFeatured: !current } : g));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleTogglePublished = async (id, current) => {
    try {
      await adminService.togglePublished(id);
      setGames((prev) => prev.map((g) => g._id === id ? { ...g, isPublished: !current } : g));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleUpdateRole = async (id, role) => {
    try {
      await adminService.updateUserRole(id, role);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, role } : u));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleToggleUserStatus = async (id, current) => {
    try {
      await adminService.toggleUserStatus(id);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, isActive: !current } : u));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const filteredGames = games.filter((g) =>
    !gamesSearch || g.title?.toLowerCase().includes(gamesSearch.toLowerCase())
  );

  if (loading) return <div className="page-wrapper loading-center"><div className="spinner" /></div>;

  return (
    <div className="page-wrapper">
      <div className="container admin-container">
        <div className="admin-header">
          <div>
            <h1 className="admin-title">⚡ Admin Panel</h1>
            <p className="text-muted text-sm">Platform management dashboard</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          {['overview', 'games', 'users'].map((t) => (
            <button
              key={t}
              className={`admin-tab ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'overview' ? '📊' : t === 'games' ? '🎮' : '👥'} {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && stats && (
          <div className="admin-content animate-fade-in">
            <div className="stats-grid">
              {[
                { label: 'Total Games', value: stats.totalGames, icon: '🎮', color: 'var(--accent-primary)' },
                { label: 'Featured Games', value: stats.featuredGames, icon: '⭐', color: 'var(--accent-gold)' },
                { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: 'var(--accent-secondary)' },
                { label: 'Total Reviews', value: stats.totalReviews, icon: '📝', color: 'var(--accent-green)' },
                { label: 'Developers', value: stats.developerCount, icon: '👨‍💻', color: '#f472b6' },
              ].map((s) => (
                <div key={s.label} className="stat-card" style={{ '--stat-color': s.color }}>
                  <div className="stat-card__icon">{s.icon}</div>
                  <div className="stat-card__value">{s.value?.toLocaleString()}</div>
                  <div className="stat-card__label">{s.label}</div>
                </div>
              ))}
            </div>

            <h3 className="admin-section-title">Recent Games</h3>
            <div className="recent-games-list">
              {stats.recentGames?.map((game) => (
                <div key={game._id} className="recent-game-row">
                  <div className="recent-game-thumb">
                    {game.thumbnail ? <img src={game.thumbnail} alt={game.title} /> : <span>🎮</span>}
                  </div>
                  <div className="recent-game-info">
                    <p className="recent-game-title">{game.title}</p>
                    <p className="text-muted text-xs">by {game.developer?.username}</p>
                  </div>
                  {game.isFeatured && <span className="badge badge-gold">Featured</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Games Management */}
        {tab === 'games' && (
          <div className="admin-content animate-fade-in">
            <div className="admin-toolbar">
              <input
                className="form-input"
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
                      <td className="text-secondary text-sm">{game.developer?.username || '—'}</td>
                      <td className="text-sm">⭐ {game.avgRating?.toFixed(1) || '0.0'} ({game.reviewCount})</td>
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
            </div>
          </div>
        )}

        {/* Users Management */}
        {tab === 'users' && (
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
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td className="font-bold text-sm">{user.username}</td>
                      <td className="text-secondary text-sm">{user.email}</td>
                      <td>
                        <select
                          className="role-select"
                          value={user.role}
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
                          onClick={() => handleToggleUserStatus(user._id, user.isActive)}
                        >
                          {user.isActive ? '✅ Active' : '🚫 Banned'}
                        </button>
                      </td>
                      <td className="text-muted text-xs">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
