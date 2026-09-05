import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { steamService } from '../services';
import './SteamGamePage.css';

function LivePlayerBadge({ appId }) {
  const [count, setCount] = useState(null);

  useEffect(() => {
    steamService.getPlayerCount(appId)
      .then(({ data }) => setCount(data.data?.playerCount || 0))
      .catch(() => setCount(null));
  }, [appId]);

  if (count === null) return null;
  return (
    <div className="live-players">
      <span className="live-dot" />
      <span>{count.toLocaleString()} playing now</span>
    </div>
  );
}

function SteamReviewBar({ summary }) {
  if (!summary) return null;
  const total = summary.total_reviews || 0;
  const positive = summary.total_positive || 0;
  const pct = total > 0 ? Math.round((positive / total) * 100) : 0;
  const label = pct >= 95 ? 'Overwhelmingly Positive' : pct >= 85 ? 'Very Positive'
    : pct >= 70 ? 'Mostly Positive' : pct >= 40 ? 'Mixed' : 'Mostly Negative';
  const color = pct >= 70 ? '#66c0f4' : pct >= 40 ? '#a0a0a0' : '#c46c3c';

  return (
    <div className="steam-review-summary">
      <div className="srb-label" style={{ color }}>{label}</div>
      <div className="srb-track">
        <div className="srb-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="srb-meta">{pct}% of {total.toLocaleString()} reviews are positive</div>
    </div>
  );
}

export default function SteamGamePage() {
  const { appId } = useParams();
  const [game, setGame] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeScreen, setActiveScreen] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    setError('');

    Promise.all([
      steamService.getApp(appId),
      steamService.getAppReviews(appId),
    ]).then(([gameRes, reviewRes]) => {
      setGame(gameRes.data.data);
      setReviews(reviewRes.data.reviews || []);
      setReviewSummary(reviewRes.data.summary || null);
    }).catch((err) => {
      setError(err.response?.data?.message || 'Failed to load game from Steam');
    }).finally(() => setLoading(false));
  }, [appId]);

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="container" style={{ paddingTop: 'calc(var(--nav-height) + 40px)' }}>
          <div className="skeleton" style={{ height: '60px', width: '60%', marginBottom: '20px' }} />
          <div className="skeleton" style={{ aspectRatio: '16/9', marginBottom: '20px' }} />
          <div className="skeleton" style={{ height: '200px' }} />
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="page-wrapper loading-center">
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '4rem' }}>😔</p>
          <h2 style={{ margin: '16px 0 8px' }}>{error || 'Game not found'}</h2>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '16px', display: 'inline-flex' }}>← Back to Home</Link>
        </div>
      </div>
    );
  }

  const storeUrl = `https://store.steampowered.com/app/${appId}/`;

  return (
    <div className="page-wrapper">
      {/* ── Hero with background ── */}
      <div className="sgp-hero">
        {game.backgroundImage && (
          <img src={game.backgroundImage} alt="" className="sgp-hero-bg" />
        )}
        <div className="sgp-hero-overlay" />
        <div className="container sgp-hero-content">
          <nav className="breadcrumb">
            <Link to="/">Home</Link>
            <span>›</span>
            <Link to="/games">Browse</Link>
            <span>›</span>
            <span>{game.title}</span>
          </nav>
          <div className="sgp-hero-info">
            {/* Game Logo / Capsule Art */}
            {game.logoUrl && (
              <img
                src={game.logoUrl}
                alt={`${game.title} logo`}
                className="sgp-hero-logo"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            )}
            <div className="sgp-hero-badges">
              {game.genre?.slice(0, 3).map((g) => (
                <span key={g} className="badge badge-primary">{g}</span>
              ))}
              {game.comingSoon && <span className="badge" style={{ background: '#f59e0b', color: '#000' }}>Coming Soon</span>}
            </div>
            <h1 className="sgp-hero-title">{game.title}</h1>
            {game.developers?.length > 0 && (
              <p className="sgp-hero-dev">by <strong>{game.developers.join(', ')}</strong></p>
            )}
            <LivePlayerBadge appId={appId} />
          </div>
        </div>
      </div>

      <div className="container sgp-layout">
        {/* ── Main ── */}
        <main className="sgp-main">

          {/* Trailer */}
          {game.trailerUrl && (
            <section className="sgp-section">
              <h2 className="sgp-section-title">🎬 Trailer</h2>
              <div className="sgp-video-wrapper">
                <ReactPlayer
                  url={game.trailerUrl}
                  width="100%"
                  height="100%"
                  controls
                  light={game.thumbnail || true}
                  className="react-player"
                />
              </div>
            </section>
          )}

          {/* Screenshots */}
          {game.screenshots?.length > 0 && (
            <section className="sgp-section">
              <h2 className="sgp-section-title">📸 Screenshots</h2>
              <div className="sgp-screenshots">
                <div className="sgp-main-screen">
                  <img
                    src={game.screenshots[activeScreen]}
                    alt={`Screenshot ${activeScreen + 1}`}
                  />
                </div>
                <div className="sgp-thumb-strip">
                  {game.screenshots.slice(0, 10).map((src, i) => (
                    <button
                      key={i}
                      className={`sgp-thumb ${i === activeScreen ? 'active' : ''}`}
                      onClick={() => setActiveScreen(i)}
                    >
                      <img src={src} alt={`Thumb ${i + 1}`} loading="lazy" />
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Description */}
          <section className="sgp-section">
            <h2 className="sgp-section-title">📖 About</h2>
            <div
              className="sgp-description"
              dangerouslySetInnerHTML={{ __html: game.description }}
            />
          </section>

          {/* Steam Reviews */}
          {reviews.length > 0 && (
            <section className="sgp-section">
              <h2 className="sgp-section-title">💬 Steam Community Reviews</h2>
              <SteamReviewBar summary={reviewSummary} />
              <div className="sgp-reviews-list">
                {reviews.slice(0, 8).map((r) => (
                  <div key={r.id} className={`sgp-review ${r.voted_up ? 'positive' : 'negative'}`}>
                    <div className="sgp-review-header">
                      <span className="sgp-review-thumb">{r.voted_up ? '👍' : '👎'}</span>
                      <div>
                        <div className="sgp-review-author">Steam User</div>
                        <div className="sgp-review-hours">{r.playtimeHours}h on record</div>
                      </div>
                    </div>
                    <p className="sgp-review-body">{r.body}</p>
                    {r.votes_helpful > 0 && (
                      <div className="sgp-review-helpful">{r.votes_helpful} found this helpful</div>
                    )}
                  </div>
                ))}
              </div>
              <a
                href={`https://store.steampowered.com/app/${appId}/#app_reviews_hash`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '16px', display: 'inline-flex' }}
              >
                View all reviews on Steam ↗
              </a>
            </section>
          )}
        </main>

        {/* ── Sidebar ── */}
        <aside className="sgp-sidebar">
          {/* Thumbnail */}
          {game.thumbnail && (
            <div className="sgp-sidebar-thumb">
              <img src={game.thumbnail} alt={game.title} />
            </div>
          )}

          {/* Buy on Steam */}
          <div className="sgp-buy-card">
            <div className="sgp-price-row">
              {game.isFree ? (
                <span className="sgp-price-free">Free to Play</span>
              ) : game.discountPercent > 0 ? (
                <div className="sgp-price-discount">
                  <span className="sgp-discount-badge">-{game.discountPercent}%</span>
                  <div>
                    <span className="sgp-price-original">${game.originalPrice?.toFixed(2)}</span>
                    <span className="sgp-price-final">${game.price?.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <span className="sgp-price-final">${game.price?.toFixed(2)}</span>
              )}
            </div>

            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="sgp-buy-btn"
            >
              🛒 {game.isFree ? 'Play on Steam — Free' : 'Buy on Steam'}
              <span className="sgp-buy-arrow">↗</span>
            </a>

            {game.comingSoon && (
              <a
                href={storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="sgp-wishlist-btn"
              >
                ♡ Add to Wishlist
              </a>
            )}

            <p className="sgp-steam-note">
              You'll be redirected to the official Steam store to complete your purchase.
            </p>
          </div>

          {/* Game Info */}
          <div className="sgp-info-card">
            <h4 className="sgp-info-title">Game Info</h4>
            <div className="sgp-info-list">
              {game.releaseDateText && (
                <div className="sgp-info-row">
                  <span>Release</span>
                  <span>{game.releaseDateText}</span>
                </div>
              )}
              {game.developers?.length > 0 && (
                <div className="sgp-info-row">
                  <span>Developer</span>
                  <span>{game.developers.slice(0, 2).join(', ')}</span>
                </div>
              )}
              {game.publishers?.length > 0 && (
                <div className="sgp-info-row">
                  <span>Publisher</span>
                  <span>{game.publishers.slice(0, 1).join(', ')}</span>
                </div>
              )}
              {game.platform?.length > 0 && (
                <div className="sgp-info-row">
                  <span>Platforms</span>
                  <span>{game.platform.join(', ')}</span>
                </div>
              )}
              {game.metacritic && (
                <div className="sgp-info-row">
                  <span>Metacritic</span>
                  <a
                    href={game.metacritic.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sgp-metacritic"
                    style={{ color: game.metacritic.score >= 75 ? '#6cbe45' : game.metacritic.score >= 50 ? '#fc3' : '#f00' }}
                  >
                    {game.metacritic.score}
                  </a>
                </div>
              )}
              {game.totalAchievements > 0 && (
                <div className="sgp-info-row">
                  <span>Achievements</span>
                  <span>🏆 {game.totalAchievements}</span>
                </div>
              )}
            </div>
          </div>

          {/* Categories */}
          {game.categories?.length > 0 && (
            <div className="sgp-info-card">
              <h4 className="sgp-info-title">Features</h4>
              <div className="sgp-tags">
                {game.categories.map((c) => (
                  <span key={c} className="sgp-tag">{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Genre Tags */}
          {game.genre?.length > 0 && (
            <div className="sgp-info-card">
              <h4 className="sgp-info-title">Genres</h4>
              <div className="sgp-tags">
                {game.genre.map((g) => (
                  <span key={g} className="sgp-tag sgp-tag--genre">{g}</span>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
