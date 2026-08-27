import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { steamService } from '../services';
import './HomePage.css';

// ─── Steam Game Card (links to /steam/:appId) ──────────────────────────────
function SteamCard({ game }) {
  return (
    <Link to={`/steam/${game.steamAppId}`} className="steam-card">
      <div className="steam-card__thumb">
        <img
          src={game.thumbnail}
          alt={game.title}
          loading="lazy"
          onError={(e) => { e.target.src = `https://cdn.akamai.steamstatic.com/steam/apps/${game.steamAppId}/header.jpg`; }}
        />
        {game.discountPercent > 0 && (
          <span className="steam-card__discount">-{game.discountPercent}%</span>
        )}
      </div>
      <div className="steam-card__body">
        <h4 className="steam-card__title">{game.title}</h4>
        <div className="steam-card__platforms">
          {game.platforms?.windows && <span title="Windows">🖥️</span>}
          {game.platforms?.mac && <span title="Mac">🍎</span>}
          {game.platforms?.linux && <span title="Linux">🐧</span>}
        </div>
        <div className="steam-card__price">
          {game.isFree ? (
            <span className="price-free">Free to Play</span>
          ) : game.discountPercent > 0 ? (
            <>
              <span className="price-original">${game.originalPrice?.toFixed(2)}</span>
              <span className="price-final">${game.price?.toFixed(2)}</span>
            </>
          ) : (
            <span className="price-final">${game.price?.toFixed(2)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function SteamSaleCard({ game }) {
  return (
    <Link to={`/steam/${game.steamAppId}`} className="sale-card">
      <img
        src={game.thumbnail}
        alt={game.title}
        className="sale-card__img"
        loading="lazy"
        onError={(e) => { e.target.src = `https://cdn.akamai.steamstatic.com/steam/apps/${game.steamAppId}/header.jpg`; }}
      />
      <div className="sale-card__info">
        <h4 className="sale-card__title">{game.title}</h4>
        <div className="sale-card__pricing">
          <span className="sale-badge">-{game.discountPercent}%</span>
          <span className="sale-original">${game.originalPrice?.toFixed(2)}</span>
          <span className="sale-final">${game.price?.toFixed(2)}</span>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton" style={{ aspectRatio: '460/215', width: '100%' }} />
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="skeleton" style={{ height: '16px', width: '60%' }} />
        <div className="skeleton" style={{ height: '20px', width: '90%' }} />
        <div className="skeleton" style={{ height: '14px', width: '40%' }} />
      </div>
    </div>
  );
}

export default function HomePage() {
  const [steamData, setSteamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fetchTick, setFetchTick] = useState(0);

  const retry = () => setFetchTick((t) => t + 1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    steamService.getHomepage()
      .then(({ data }) => { if (!cancelled) setSteamData(data.data); })
      .catch(() => {
        if (!cancelled) {
          setError('Steam data could not be loaded.');
          // Auto-retry once after 4 seconds in case server just started
          setTimeout(() => {
            if (!cancelled) setFetchTick((t) => t + 1);
          }, 4000);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [fetchTick]);

  const trending = steamData?.trending || [];
  const sales = steamData?.sales || [];
  const upcoming = steamData?.upcoming || [];
  const newReleases = steamData?.newReleases || [];


  return (
    <div className="page-wrapper">
      {/* ── Hero ── */}
      <section className="hero-section">
        <div className="hero-bg" />
        <div className="container hero-content">
          <div className="hero-text animate-fade-in">
            <span className="hero-eyebrow display-font">🎮 Powered by Steam</span>
            <h1 className="hero-title">
              Your Gateway to <span className="text-gradient">Indie Gaming</span>
            </h1>
            <p className="hero-subtitle">
              Discover hidden gems, track top sellers, and shop the best sales — all powered by
              real Steam store data updated every 5 minutes.
            </p>
            <div className="hero-actions">
              <Link to="/games" className="btn btn-primary btn-lg">Explore Games →</Link>
              <Link to="/register" className="btn btn-secondary btn-lg">Join Free</Link>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="hero-stat__num">50K+</span>
                <span className="hero-stat__label">Steam Games</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <span className="hero-stat__num">Live</span>
                <span className="hero-stat__label">Player Counts</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <span className="hero-stat__num">Real</span>
                <span className="hero-stat__label">Steam Prices</span>
              </div>
            </div>
          </div>
          <div className="hero-visual animate-fade-in">
            <div className="hero-game-preview">
              <div className="hero-preview-glow" />
              <div className="hero-preview-card">
                <div className="preview-screen">
                  <img
                    src="https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg"
                    alt="Steam featured game"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="container" style={{ paddingTop: '24px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '16px',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '14px', padding: '16px 24px', color: '#fca5a5', fontSize: '0.875rem'
          }}>
            <span style={{ fontSize: '1.3rem' }}>⚠️</span>
            <p style={{ flex: 1, margin: 0 }}>{error} Auto-retrying...</p>
            <button className="btn btn-primary btn-sm" onClick={retry}>↺ Retry now</button>
          </div>
        </div>
      )}


      <div className="container">

        {/* ── 🔥 Top Sellers / Trending ── */}
        <section className="section">
          <div className="section-header">
            <div>
              <h2 className="section-title">🔥 Top Sellers on Steam</h2>
              <p className="section-subtitle">Best-selling games right now — updated live from Steam</p>
            </div>
          </div>
          {loading ? (
            <div className="games-grid">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : trending.length > 0 ? (
            <div className="games-grid">
              {trending.slice(0, 6).map((game) => <SteamCard key={game.steamAppId} game={game} />)}
            </div>
          ) : (
            <div className="empty-state"><p>Steam data unavailable right now.</p></div>
          )}
        </section>

        {/* ── 🏷️ On Sale Now ── */}
        {(loading || sales.length > 0) && (
          <section className="section">
            <div className="section-header">
              <div>
                <h2 className="section-title">🏷️ Hot Deals — On Sale Now</h2>
                <p className="section-subtitle">Best discounts active on the Steam store today</p>
              </div>
            </div>
            {loading ? (
              <div className="sales-grid">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: '90px', borderRadius: '12px' }} />
                ))}
              </div>
            ) : (
              <div className="sales-grid">
                {sales.slice(0, 8).map((game) => <SteamSaleCard key={game.steamAppId} game={game} />)}
              </div>
            )}
          </section>
        )}

        {/* ── 🆕 New Releases ── */}
        {(loading || newReleases.length > 0) && (
          <section className="section">
            <div className="section-header">
              <div>
                <h2 className="section-title">🆕 New Releases</h2>
                <p className="section-subtitle">Just dropped on Steam</p>
              </div>
            </div>
            {loading ? (
              <div className="games-grid">
                {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : (
              <div className="games-grid">
                {newReleases.slice(0, 6).map((game) => <SteamCard key={game.steamAppId} game={game} />)}
              </div>
            )}
          </section>
        )}

        {/* ── ⏰ Coming Soon ── */}
        {(loading || upcoming.length > 0) && (
          <section className="section">
            <div className="section-header">
              <div>
                <h2 className="section-title">⏰ Coming Soon</h2>
                <p className="section-subtitle">Upcoming releases to wishlist</p>
              </div>
            </div>
            {loading ? (
              <div className="games-grid">
                {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : (
              <div className="games-grid">
                {upcoming.slice(0, 6).map((game) => <SteamCard key={game.steamAppId} game={game} />)}
              </div>
            )}
          </section>
        )}

        {/* ── Dev CTA ── */}
        <section className="section dev-cta-section">
          <div className="dev-cta">
            <div className="dev-cta__content">
              <span className="dev-cta__eyebrow">For Indie Developers</span>
              <h2 className="dev-cta__title">Get Your Game Discovered</h2>
              <p className="dev-cta__desc">
                List your indie game on IndieHub alongside Steam's top titles.
                Connect with passionate gamers, collect reviews, and grow your audience for free.
              </p>
              <div className="dev-cta__actions">
                <Link to="/register?role=developer" className="btn btn-primary btn-lg">Submit Your Game</Link>
                <Link to="/games" className="btn btn-secondary btn-lg">Browse Platform</Link>
              </div>
            </div>
            <div className="dev-cta__features">
              {[
                { icon: '🚀', title: 'Free Listing', desc: 'No upfront cost to get listed' },
                { icon: '🎮', title: 'Steam Data', desc: 'Real player counts & reviews' },
                { icon: '💬', title: 'Community', desc: 'Built-in forum for your game' },
                { icon: '⭐', title: 'Reviews', desc: 'Collect real player feedback' },
              ].map((f) => (
                <div key={f.title} className="dev-feature">
                  <span className="dev-feature__icon">{f.icon}</span>
                  <div>
                    <p className="dev-feature__title">{f.title}</p>
                    <p className="dev-feature__desc">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
