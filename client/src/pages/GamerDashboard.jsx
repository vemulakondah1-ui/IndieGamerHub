import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { gameService, reviewService } from '../services';
import './GamerDashboard.css';

const AVATAR_COLORS = [
  'linear-gradient(135deg,#7c3aed,#06b6d4)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#10b981,#06b6d4)',
  'linear-gradient(135deg,#ec4899,#8b5cf6)',
];

function getAvatarGradient(username = '') {
  const idx = username.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function GameCard({ game }) {
  return (
    <Link to={`/games/${game._id}`} className="gd-game-card">
      <div className="gd-game-thumb">
        {game.thumbnail
          ? <img src={game.thumbnail} alt={game.title} />
          : <div className="gd-game-thumb-placeholder">🎮</div>}
        <div className="gd-game-overlay">
          <span className="gd-game-play">▶ View</span>
        </div>
      </div>
      <div className="gd-game-body">
        <h4 className="gd-game-title">{game.title}</h4>
        <div className="gd-game-meta">
          {game.genre?.slice(0, 2).map((g) => (
            <span key={g} className="gd-badge">{g}</span>
          ))}
        </div>
        <div className="gd-game-stats">
          {game.avgRating > 0 && (
            <span className="gd-rating">⭐ {Number(game.avgRating).toFixed(1)}</span>
          )}
          <span className="gd-price">
            {game.isFree ? <span className="gd-free">FREE</span> : `$${Number(game.price || 0).toFixed(2)}`}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function GamerDashboard() {
  const { user } = useAuth();

  const [trending, setTrending] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    gameService.getTrending()
      .then(({ data }) => setTrending((data.data || []).slice(0, 6)))
      .catch(() => setTrending([]))
      .finally(() => setTrendingLoading(false));

    gameService.getFeatured()
      .then(({ data }) => setFeatured((data.data || []).slice(0, 6)))
      .catch(() => setFeatured([]))
      .finally(() => setFeaturedLoading(false));
  }, []);

  const initials = user?.username?.slice(0, 2).toUpperCase() || 'GR';
  const avatarGradient = getAvatarGradient(user?.username);

  return (
    <div className="page-wrapper">
      <div className="container gd-container">

        {/* ── Hero Welcome Banner ── */}
        <div className="gd-hero">
          <div className="gd-hero-glow" />
          <div className="gd-hero-content">
            <div className="gd-avatar-large" style={{ background: avatarGradient }}>
              {user?.avatar
                ? <img src={user.avatar} alt={user.username} />
                : initials}
            </div>
            <div className="gd-hero-text">
              <p className="gd-greeting">{greeting}, <span className="gd-username">{user?.username}</span> 👾</p>
              <h1 className="gd-hero-title">Your Gaming Hub</h1>
              <p className="gd-hero-sub">Discover, review and discuss the best indie games</p>
            </div>
          </div>
          <div className="gd-hero-actions">
            <Link to="/games" className="btn btn-primary gd-hero-btn">
              🔍 Discover Games
            </Link>
            <Link to="/games" className="btn btn-secondary gd-hero-btn">
              ⭐ Top Rated
            </Link>
          </div>
        </div>

        {/* ── Quick Stats Row ── */}
        <div className="gd-stats-row">
          {[
            { icon: '🎮', label: 'Games Available', value: '500+', color: '#7c3aed' },
            { icon: '🔥', label: 'Trending This Week', value: trending.length || '—', color: '#ef4444' },
            { icon: '⭐', label: 'Featured Games', value: featured.length || '—', color: '#f59e0b' },
            { icon: '💬', label: 'Active Discussions', value: 'Live', color: '#10b981' },
          ].map((stat) => (
            <div key={stat.label} className="gd-stat-card">
              <div className="gd-stat-icon" style={{ color: stat.color }}>{stat.icon}</div>
              <div className="gd-stat-value" style={{ color: stat.color }}>{stat.value}</div>
              <div className="gd-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ── Trending Games ── */}
        <section className="gd-section">
          <div className="gd-section-header">
            <div>
              <h2 className="gd-section-title">🔥 Trending Now</h2>
              <p className="gd-section-sub">Most active games this week</p>
            </div>
            <Link to="/games?sort=-trending" className="btn btn-secondary btn-sm">View All →</Link>
          </div>
          {trendingLoading ? (
            <div className="gd-loading">
              {[...Array(6)].map((_, i) => <div key={i} className="gd-skeleton" />)}
            </div>
          ) : trending.length === 0 ? (
            <div className="gd-empty">
              <span>🎮</span>
              <p>No trending games yet — check back soon!</p>
              <Link to="/games" className="btn btn-primary btn-sm">Browse All Games</Link>
            </div>
          ) : (
            <div className="gd-games-grid">
              {trending.map((game) => <GameCard key={game._id} game={game} />)}
            </div>
          )}
        </section>

        {/* ── Featured Games ── */}
        <section className="gd-section">
          <div className="gd-section-header">
            <div>
              <h2 className="gd-section-title">⭐ Featured Games</h2>
              <p className="gd-section-sub">Hand-picked by our editors</p>
            </div>
            <Link to="/games?featured=true" className="btn btn-secondary btn-sm">View All →</Link>
          </div>
          {featuredLoading ? (
            <div className="gd-loading">
              {[...Array(6)].map((_, i) => <div key={i} className="gd-skeleton" />)}
            </div>
          ) : featured.length === 0 ? (
            <div className="gd-empty">
              <span>⭐</span>
              <p>No featured games yet.</p>
              <Link to="/games" className="btn btn-primary btn-sm">Browse All Games</Link>
            </div>
          ) : (
            <div className="gd-games-grid">
              {featured.map((game) => <GameCard key={game._id} game={game} />)}
            </div>
          )}
        </section>

        {/* ── Quick Links ── */}
        <section className="gd-quicklinks">
          <h2 className="gd-section-title" style={{ marginBottom: '20px' }}>🚀 Quick Actions</h2>
          <div className="gd-quicklinks-grid">
            {[
              { icon: '🔍', title: 'Browse Games', desc: 'Find your next favorite indie game', to: '/games', color: '#7c3aed' },
              { icon: '⭐', title: 'Top Rated', desc: 'Best rated games by the community', to: '/games?sort=-avgRating', color: '#f59e0b' },
              { icon: '🆕', title: 'Upcoming', desc: 'Exciting games coming soon', to: '/games?sort=releaseDate', color: '#10b981' },
              { icon: '🆓', title: 'Free to Play', desc: 'Great games that cost nothing', to: '/games?isFree=true', color: '#06b6d4' },
            ].map((link) => (
              <Link key={link.title} to={link.to} className="gd-quicklink-card">
                <div className="gd-quicklink-icon" style={{ color: link.color }}>{link.icon}</div>
                <div>
                  <div className="gd-quicklink-title">{link.title}</div>
                  <div className="gd-quicklink-desc">{link.desc}</div>
                </div>
                <span className="gd-quicklink-arrow" style={{ color: link.color }}>→</span>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
