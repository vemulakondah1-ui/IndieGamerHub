import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { gameService, authService } from '../services';
import './UserProfile.css';

// ─── Avatar gradient helpers ───────────────────────────────────────────────
const GRADIENTS = [
  'linear-gradient(135deg,#7c3aed,#06b6d4)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#10b981,#3b82f6)',
  'linear-gradient(135deg,#ec4899,#8b5cf6)',
  'linear-gradient(135deg,#f97316,#eab308)',
  'linear-gradient(135deg,#06b6d4,#6366f1)',
];
function avatarGradient(username = '') {
  return GRADIENTS[username.charCodeAt(0) % GRADIENTS.length];
}

// ─── Role config ───────────────────────────────────────────────────────────
const ROLE_META = {
  gamer:     { label: '🎮 Gamer',     cls: 'gamer' },
  developer: { label: '👨‍💻 Developer', cls: 'developer' },
  admin:     { label: '🛡️ Admin',     cls: 'admin' },
};

// ─── Time ago helper ───────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ─── Mini Game Card ────────────────────────────────────────────────────────
function UpGameCard({ game }) {
  return (
    <Link to={`/games/${game._id}`} className="up-game-card">
      <div className="up-game-thumb">
        {game.thumbnail
          ? <img src={game.thumbnail} alt={game.title} loading="lazy" />
          : <div className="up-game-thumb-placeholder">🎮</div>}
      </div>
      <div className="up-game-info">
        <div className="up-game-name">{game.title}</div>
        <div className="up-game-genre">{game.genre?.slice(0, 2).join(' · ') || 'Indie'}</div>
      </div>
    </Link>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function UserProfile() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [trending, setTrending]   = useState([]);
  const [featured, setFeatured]   = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Edit form state
  const [editForm, setEditForm]     = useState({ username: user?.username || '', bio: user?.bio || '', website: user?.website || '' });
  const [saving, setSaving]         = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError]   = useState('');

  const initials      = user?.username?.slice(0, 2).toUpperCase() || 'ME';
  const gradient      = avatarGradient(user?.username || '');
  const roleMeta      = ROLE_META[user?.role] || ROLE_META.gamer;
  const memberSince   = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'IndieHub Member';

  const greetHour  = new Date().getHours();
  const greeting   = greetHour < 12 ? '🌅 Good morning' : greetHour < 17 ? '☀️ Good afternoon' : '🌙 Good evening';

  useEffect(() => {
    gameService.getTrending()
      .then(({ data }) => setTrending((data.data || []).slice(0, 6)))
      .catch(() => setTrending([]));

    gameService.getFeatured()
      .then(({ data }) => setFeatured((data.data || []).slice(0, 6)))
      .catch(() => setFeatured([]));
  }, []);

  // Sync editForm when user changes
  useEffect(() => {
    if (user) setEditForm({ username: user.username || '', bio: user.bio || '', website: user.website || '' });
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      const { data } = await authService.updateProfile(editForm);
      updateUser(data.user);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Could not save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // ── Fake activity items derived from real data ───────────────────────────
  const activities = [
    ...(trending.slice(0, 2).map((g, i) => ({
      id: `t${i}`,
      icon: '🔥',
      iconBg: 'rgba(239,68,68,0.12)',
      title: `Checked out "${g.title}"`,
      sub: 'Viewed trending game',
      time: '2h ago',
    }))),
    ...(featured.slice(0, 2).map((g, i) => ({
      id: `f${i}`,
      icon: '⭐',
      iconBg: 'rgba(245,158,11,0.12)',
      title: `Explored "${g.title}"`,
      sub: 'Featured pick',
      time: '1d ago',
    }))),
    {
      id: 'join',
      icon: '🎉',
      iconBg: 'rgba(124,58,237,0.12)',
      title: `Joined IndieHub as ${roleMeta.label}`,
      sub: 'Account created',
      time: memberSince,
    },
  ];

  return (
    <div className="up-page">

      {/* ── Cover Banner ── */}
      <div className="up-cover">
        <div className="up-cover-glow" />
        <div className="up-cover-particles" />
      </div>

      {/* ── Identity Row ── */}
      <div className="up-identity">
        <div className="up-identity-inner">
          <div className="up-avatar-wrap">
            <div className="up-avatar" style={{ background: gradient }}>
              {user?.avatar
                ? <img src={user.avatar} alt={user.username} />
                : initials}
            </div>
            <div className="up-avatar-badge" title="Online" />
          </div>

          <div className="up-identity-info">
            <h1 className="up-name">{user?.username}</h1>
            <div className={`up-role-tag ${roleMeta.cls}`}>{roleMeta.label}</div>
            {user?.bio && <p className="up-bio">{user.bio}</p>}
          </div>

          <div className="up-identity-actions">
            <Link to="/games" className="btn btn-primary">🔍 Discover Games</Link>
            <Link to="/games?sort=-avgRating" className="btn btn-secondary">⭐ Top Rated</Link>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="up-container">

        {/* ── Sidebar ── */}
        <aside className="up-sidebar">

          {/* About card */}
          <div className="up-card">
            <div className="up-card-title">📋 About</div>
            <div className="up-info-list">
              <div className="up-info-item">
                <div className="up-info-icon" style={{ background: 'rgba(124,58,237,0.12)' }}>✉️</div>
                <div>
                  <div className="up-info-label">Email</div>
                  <div className="up-info-value">{user?.email}</div>
                </div>
              </div>
              <div className="up-info-item">
                <div className="up-info-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>📅</div>
                <div>
                  <div className="up-info-label">Member Since</div>
                  <div className="up-info-value">{memberSince}</div>
                </div>
              </div>
              {user?.website && (
                <div className="up-info-item">
                  <div className="up-info-icon" style={{ background: 'rgba(6,182,212,0.12)' }}>🌐</div>
                  <div>
                    <div className="up-info-label">Website</div>
                    <a className="up-info-value" href={user.website} target="_blank" rel="noreferrer" style={{ color: '#a78bfa' }}>
                      {user.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                </div>
              )}
              <div className="up-info-item">
                <div className="up-info-icon" style={{ background: 'rgba(245,158,11,0.12)' }}>🏷️</div>
                <div>
                  <div className="up-info-label">Role</div>
                  <div className="up-info-value">{roleMeta.label}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Mini stats */}
          <div className="up-card">
            <div className="up-card-title">📊 Stats</div>
            <div className="up-mini-stats">
              {[
                { val: trending.length || '—', label: 'Trending' },
                { val: featured.length || '—', label: 'Featured' },
                { val: '500+', label: 'Games' },
                { val: 'Live', label: 'Discussions' },
              ].map((s) => (
                <div key={s.label} className="up-mini-stat">
                  <div className="up-mini-stat-val">{s.val}</div>
                  <div className="up-mini-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Edit profile */}
          <div className="up-card">
            <div className="up-card-title">✏️ Edit Profile</div>
            <form onSubmit={handleSave} className="up-edit-form">
              <div className="up-form-group">
                <label className="up-form-label">Username</label>
                <input
                  className="up-form-input"
                  value={editForm.username}
                  onChange={(e) => setEditForm((f) => ({ ...f, username: e.target.value }))}
                  minLength={3} maxLength={30}
                  required
                />
              </div>
              <div className="up-form-group">
                <label className="up-form-label">Bio</label>
                <textarea
                  className="up-form-textarea"
                  value={editForm.bio}
                  onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                  placeholder="Tell the community about yourself..."
                  maxLength={300}
                />
              </div>
              <div className="up-form-group">
                <label className="up-form-label">Website</label>
                <input
                  className="up-form-input"
                  type="url"
                  value={editForm.website}
                  onChange={(e) => setEditForm((f) => ({ ...f, website: e.target.value }))}
                  placeholder="https://yoursite.com"
                />
              </div>
              {saveError && <div style={{ color: '#f87171', fontSize: '0.8rem' }}>{saveError}</div>}
              {saveSuccess && (
                <div className="up-save-success">✅ Profile saved!</div>
              )}
              <button type="submit" className="btn btn-primary up-save-btn" disabled={saving}>
                {saving ? 'Saving…' : '💾 Save Changes'}
              </button>
            </form>
          </div>

          {/* Quick links */}
          <div className="up-card">
            <div className="up-card-title">🚀 Quick Links</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { to: '/games', label: '🕹️ Browse All Games' },
                { to: '/games?sort=-avgRating', label: '⭐ Top Rated Games' },
                { to: '/games?isFree=true', label: '🆓 Free to Play' },
                ...(user?.role === 'developer' || user?.role === 'admin'
                  ? [{ to: '/dashboard', label: '👨‍💻 Developer Dashboard' }]
                  : []),
                ...(user?.role === 'admin'
                  ? [{ to: '/admin', label: '🛡️ Admin Panel' }]
                  : []),
              ].map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  style={{
                    display: 'block',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    transition: 'all 0.18s',
                  }}
                  onMouseEnter={(e) => { e.target.style.background = 'rgba(124,58,237,0.1)'; e.target.style.color = '#a78bfa'; }}
                  onMouseLeave={(e) => { e.target.style.background = 'var(--bg-surface)'; e.target.style.color = 'var(--text-secondary)'; }}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Logout */}
          <button className="up-logout-btn" onClick={handleLogout}>
            🚪 Sign Out
          </button>

        </aside>

        {/* ── Main ── */}
        <main className="up-main">

          {/* Greeting */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(6,182,212,0.08) 100%)',
            border: '1px solid rgba(124,58,237,0.2)',
            borderRadius: 'var(--radius-xl)',
            padding: '20px 24px',
          }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{greeting},</p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, background: 'linear-gradient(135deg,#e2e8f0,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {user?.username} 👾
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              Welcome to your personal gaming hub. Explore games, track trends, and connect with the community.
            </p>
          </div>

          {/* Stats row */}
          <div className="up-stats-row">
            {[
              { icon: '🎮', bg: 'rgba(124,58,237,0.12)', num: '500+', label: 'Games Available', color: '#a78bfa' },
              { icon: '🔥', bg: 'rgba(239,68,68,0.1)',  num: trending.length || '—', label: 'Trending Now', color: '#f87171' },
              { icon: '⭐', bg: 'rgba(245,158,11,0.1)', num: featured.length || '—', label: 'Featured Games', color: '#fbbf24' },
            ].map((s) => (
              <div key={s.label} className="up-stat-card">
                <div className="up-stat-icon-wrap" style={{ background: s.bg, fontSize: '1.4rem' }}>{s.icon}</div>
                <div>
                  <div className="up-stat-text-num" style={{ color: s.color }}>{s.num}</div>
                  <div className="up-stat-text-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Tab navigation */}
          <div className="up-tabs">
            {[
              { key: 'overview',  label: '🏠 Overview' },
              { key: 'trending',  label: '🔥 Trending' },
              { key: 'featured',  label: '⭐ Featured' },
              { key: 'activity',  label: '📋 Activity' },
            ].map((t) => (
              <button
                key={t.key}
                className={`up-tab ${activeTab === t.key ? 'active' : ''}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab: Overview */}
          {activeTab === 'overview' && (
            <>
              {/* Trending preview */}
              <div className="up-card">
                <div className="up-card-title" style={{ marginBottom: '18px' }}>🔥 Trending Now</div>
                {trending.length === 0 ? (
                  <div className="up-empty-state">
                    <span>🎮</span>
                    <p>No trending games yet — check back soon!</p>
                    <Link to="/games" className="btn btn-primary btn-sm">Browse Games</Link>
                  </div>
                ) : (
                  <div className="up-games-grid">
                    {trending.slice(0, 3).map((g) => <UpGameCard key={g._id} game={g} />)}
                  </div>
                )}
              </div>

              {/* Featured preview */}
              <div className="up-card">
                <div className="up-card-title" style={{ marginBottom: '18px' }}>⭐ Featured Games</div>
                {featured.length === 0 ? (
                  <div className="up-empty-state">
                    <span>⭐</span>
                    <p>No featured games yet.</p>
                    <Link to="/games" className="btn btn-primary btn-sm">Browse Games</Link>
                  </div>
                ) : (
                  <div className="up-games-grid">
                    {featured.slice(0, 3).map((g) => <UpGameCard key={g._id} game={g} />)}
                  </div>
                )}
              </div>

              {/* Quick actions */}
              <div className="up-card">
                <div className="up-card-title" style={{ marginBottom: '16px' }}>⚡ Quick Actions</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px' }}>
                  {[
                    { icon: '🔍', title: 'Browse Games', desc: 'Find your next favorite', to: '/games', color: '#7c3aed' },
                    { icon: '⭐', title: 'Top Rated',    desc: 'Community favourites',   to: '/games?sort=-avgRating', color: '#f59e0b' },
                    { icon: '🆕', title: 'New Releases', desc: 'Just dropped on Steam',  to: '/games?sort=releaseDate', color: '#10b981' },
                    { icon: '🆓', title: 'Free to Play', desc: 'Great games, zero cost', to: '/games?isFree=true', color: '#06b6d4' },
                  ].map((l) => (
                    <Link key={l.title} to={l.to} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '14px', borderRadius: 'var(--radius-lg)',
                      background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
                      textDecoration: 'none', color: 'inherit',
                      transition: 'all 0.2s',
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'none'; }}
                    >
                      <span style={{ fontSize: '1.6rem', color: l.color }}>{l.icon}</span>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{l.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{l.desc}</div>
                      </div>
                      <span style={{ marginLeft: 'auto', color: l.color, fontWeight: 900 }}>→</span>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Tab: Trending */}
          {activeTab === 'trending' && (
            <div className="up-card">
              <div className="up-card-title" style={{ marginBottom: '18px' }}>🔥 Trending Now — All</div>
              {trending.length === 0 ? (
                <div className="up-empty-state">
                  <span>🎮</span>
                  <p>No trending games yet.</p>
                  <Link to="/games" className="btn btn-primary btn-sm">Browse Games</Link>
                </div>
              ) : (
                <div className="up-games-grid">
                  {trending.map((g) => <UpGameCard key={g._id} game={g} />)}
                </div>
              )}
            </div>
          )}

          {/* Tab: Featured */}
          {activeTab === 'featured' && (
            <div className="up-card">
              <div className="up-card-title" style={{ marginBottom: '18px' }}>⭐ Featured Games — All</div>
              {featured.length === 0 ? (
                <div className="up-empty-state">
                  <span>⭐</span>
                  <p>No featured games yet.</p>
                  <Link to="/games" className="btn btn-primary btn-sm">Browse Games</Link>
                </div>
              ) : (
                <div className="up-games-grid">
                  {featured.map((g) => <UpGameCard key={g._id} game={g} />)}
                </div>
              )}
            </div>
          )}

          {/* Tab: Activity */}
          {activeTab === 'activity' && (
            <div className="up-card">
              <div className="up-card-title" style={{ marginBottom: '4px' }}>📋 Recent Activity</div>
              {activities.length === 0 ? (
                <div className="up-empty-state">
                  <span>💤</span>
                  <p>No activity yet. Start exploring games!</p>
                  <Link to="/games" className="btn btn-primary btn-sm">Explore Games</Link>
                </div>
              ) : (
                <div className="up-activity-list">
                  {activities.map((a) => (
                    <div key={a.id} className="up-activity-item">
                      <div className="up-activity-dot" style={{ background: a.iconBg }}>{a.icon}</div>
                      <div className="up-activity-content">
                        <div className="up-activity-title">{a.title}</div>
                        <div className="up-activity-sub">{a.sub}</div>
                      </div>
                      <div className="up-activity-time">{a.time}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
