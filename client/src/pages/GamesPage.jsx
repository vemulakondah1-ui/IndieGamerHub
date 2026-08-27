import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { steamService } from '../services';
import './GamesPage.css';

/* ── Genre categories with icons ──────────────────────────────────────── */
const GENRES = [
  { tag: 'Action', icon: '⚔️' },
  { tag: 'Adventure', icon: '🗺️' },
  { tag: 'RPG', icon: '🧙' },
  { tag: 'Strategy', icon: '♟️' },
  { tag: 'Simulation', icon: '🏙️' },
  { tag: 'Horror', icon: '👻' },
  { tag: 'Platformer', icon: '🏃' },
  { tag: 'Puzzle', icon: '🧩' },
  { tag: 'Shooter', icon: '🔫' },
  { tag: 'Sports', icon: '⚽' },
  { tag: 'Racing', icon: '🏎️' },
  { tag: 'Indie', icon: '💡' },
  { tag: 'Multiplayer', icon: '👥' },
  { tag: 'Open World', icon: '🌍' },
  { tag: 'Survival', icon: '🔥' },
  { tag: 'Fighting', icon: '🥊' },
];

const SORT_MODES = [
  { value: 'trending', label: '🔥 Top Sellers' },
  { value: 'new', label: '🆕 New Releases' },
  { value: 'sales', label: '🏷️ On Sale' },
  { value: 'upcoming', label: '⏰ Coming Soon' },
];

/* ── Steam Game Card ──────────────────────────────────────────────────── */
function SteamCard({ game }) {
  const [imgError, setImgError] = useState(false);
  const fallback = `https://cdn.akamai.steamstatic.com/steam/apps/${game.steamAppId}/header.jpg`;

  return (
    <Link to={`/steam/${game.steamAppId}`} className="dp-card">
      <div className="dp-card-thumb">
        <img
          src={imgError ? fallback : (game.thumbnail || fallback)}
          alt={game.title}
          loading="lazy"
          onError={() => setImgError(true)}
        />
        {game.discountPercent > 0 && (
          <span className="dp-discount">-{game.discountPercent}%</span>
        )}
        <div className="dp-card-hover-overlay">
          <span className="dp-hover-btn">View Details →</span>
        </div>
      </div>
      <div className="dp-card-body">
        <h4 className="dp-card-title">{game.title}</h4>
        <div className="dp-card-platforms">
          {game.platforms?.windows && <span title="Windows">🖥️</span>}
          {game.platforms?.mac && <span title="Mac">🍎</span>}
          {game.platforms?.linux && <span title="Linux">🐧</span>}
        </div>
        <div className="dp-card-footer">
          <div className="dp-price">
            {game.isFree ? (
              <span className="dp-price-free">Free to Play</span>
            ) : game.discountPercent > 0 ? (
              <div className="dp-price-deal">
                <span className="dp-price-orig">${Number(game.originalPrice || 0).toFixed(2)}</span>
                <span className="dp-price-now">${Number(game.price || 0).toFixed(2)}</span>
              </div>
            ) : game.price > 0 ? (
              <span className="dp-price-now">${Number(game.price).toFixed(2)}</span>
            ) : (
              <span className="dp-price-tba">TBA</span>
            )}
          </div>
          <span className="dp-steam-badge">Steam</span>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="dp-skeleton-card">
      <div className="skeleton" style={{ aspectRatio: '460/215' }} />
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="skeleton" style={{ height: '14px', width: '50%' }} />
        <div className="skeleton" style={{ height: '18px', width: '85%' }} />
        <div className="skeleton" style={{ height: '12px', width: '40%' }} />
      </div>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────────────────── */
export default function GamesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [mode, setMode] = useState('trending');
  // Bump this to force a reload (e.g. retry button)
  const [fetchTick, setFetchTick] = useState(0);

  // Search state
  const [searchInput, setSearchInput] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestTimer = useRef(null);
  const searchRef = useRef(null);

  // Filter state from URL
  const activeGenre = searchParams.get('genre') || '';
  const searchQuery = searchParams.get('q') || '';

  /* ── Data fetching ── */
  // fetchTick is included so Retry button always triggers a real refetch
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    const run = async () => {
      try {
        let data = [];

        if (searchQuery) {
          const res = await steamService.search(searchQuery);
          data = res.data.data || [];
          setIsSearchMode(true);
        } else if (activeGenre) {
          const res = await steamService.getByGenre(activeGenre);
          data = res.data.data || [];
          setIsSearchMode(false);
        } else {
          let res;
          if (mode === 'trending') res = await steamService.getTrending();
          else if (mode === 'new') res = await steamService.getNewReleases();
          else if (mode === 'sales') res = await steamService.getSales();
          else if (mode === 'upcoming') res = await steamService.getUpcoming();
          else res = await steamService.getTrending();
          data = res.data.data || [];
          setIsSearchMode(false);
        }

        if (!cancelled) {
          setGames(data);
          setTotalCount(data.length);
        }
      } catch {
        if (!cancelled) {
          setError('Could not reach Steam. Check your connection and try again.');
          setGames([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, activeGenre, mode, fetchTick]);

  const retry = () => setFetchTick((t) => t + 1);

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  /* ── Live search suggestions (debounced) ── */
  const handleSearchInput = (val) => {
    setSearchInput(val);
    clearTimeout(suggestTimer.current);

    if (val.trim().length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    suggestTimer.current = setTimeout(async () => {
      try {
        const res = await steamService.search(val.trim());
        setSearchSuggestions((res.data.data || []).slice(0, 6));
        setShowSuggestions(true);
      } catch {
        setSearchSuggestions([]);
      }
    }, 350);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (!searchInput.trim()) {
      const next = new URLSearchParams(searchParams);
      next.delete('q');
      setSearchParams(next);
      return;
    }
    const next = new URLSearchParams(searchParams);
    next.set('q', searchInput.trim());
    next.delete('genre');
    setSearchParams(next);
  };

  const pickSuggestion = (game) => {
    setShowSuggestions(false);
    setSearchInput(game.title);
    const next = new URLSearchParams(searchParams);
    next.set('q', game.title);
    next.delete('genre');
    setSearchParams(next);
  };

  const setGenre = (tag) => {
    const next = new URLSearchParams(searchParams);
    if (tag) { next.set('genre', tag); next.delete('q'); }
    else { next.delete('genre'); next.delete('q'); }
    setSearchParams(next);
  };

  const clearAll = () => {
    setSearchInput('');
    setSearchParams({});
    setMode('trending');
    setIsSearchMode(false);
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pageTitle = searchQuery
    ? `Results for "${searchQuery}"`
    : activeGenre
    ? `${activeGenre} Games`
    : SORT_MODES.find((m) => m.value === mode)?.label || '🔥 Top Sellers';

  return (
    <div className="page-wrapper">
      {/* ── Discovery Hero ── */}
      <div className="dp-hero">
        <div className="dp-hero-bg" />
        <div className="container dp-hero-inner">
          <h1 className="dp-hero-title">
            🎮 <span className="text-gradient">Discover Games</span>
          </h1>
          <p className="dp-hero-sub">
            Search {totalCount > 0 ? `${totalCount}+` : 'thousands of'} games from the Steam store — real prices, trailers & reviews
          </p>

          {/* ── Big Search Bar ── */}
          <div className="dp-search-wrap" ref={searchRef}>
            <form className="dp-search-form" onSubmit={handleSearch}>
              <span className="dp-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search any game on Steam… (e.g. Hollow Knight, Elden Ring)"
                className="dp-search-input"
                value={searchInput}
                onChange={(e) => handleSearchInput(e.target.value)}
                onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)}
                id="steam-search"
                autoComplete="off"
              />
              {searchInput && (
                <button
                  type="button"
                  className="dp-search-clear"
                  onClick={() => { setSearchInput(''); setShowSuggestions(false); }}
                >✕</button>
              )}
              <button type="submit" className="dp-search-btn">Search Steam</button>
            </form>

            {/* Suggestions dropdown */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="dp-suggestions">
                {searchSuggestions.map((game) => (
                  <button
                    key={game.steamAppId}
                    className="dp-suggestion-item"
                    onMouseDown={() => pickSuggestion(game)}
                  >
                    <img
                      src={`https://cdn.akamai.steamstatic.com/steam/apps/${game.steamAppId}/capsule_sm_120.jpg`}
                      alt={game.title}
                      className="dp-sug-thumb"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div className="dp-sug-info">
                      <span className="dp-sug-title">{game.title}</span>
                      <span className="dp-sug-price">
                        {game.isFree ? 'Free' : game.price > 0 ? `$${game.price.toFixed(2)}` : 'TBA'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Genre pills */}
          <div className="dp-genre-pills">
            <button
              className={`dp-genre-pill ${!activeGenre && !searchQuery ? 'active' : ''}`}
              onClick={clearAll}
            >All</button>
            {GENRES.map(({ tag, icon }) => (
              <button
                key={tag}
                className={`dp-genre-pill ${activeGenre === tag ? 'active' : ''}`}
                onClick={() => setGenre(activeGenre === tag ? '' : tag)}
              >
                {icon} {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container dp-content">

        {/* ── Sort Mode Tabs (only when not searching / genre filtering) ── */}
        {!searchQuery && !activeGenre && (
          <div className="dp-mode-tabs">
            {SORT_MODES.map((m) => (
              <button
                key={m.value}
                className={`dp-mode-tab ${mode === m.value ? 'active' : ''}`}
                onClick={() => setMode(m.value)}
              >{m.label}</button>
            ))}
          </div>
        )}

        {/* ── Active filter chips ── */}
        {(searchQuery || activeGenre) && (
          <div className="dp-active-filters">
            <span className="dp-filter-label">Showing:</span>
            {searchQuery && (
              <div className="dp-chip">
                <span>🔍 "{searchQuery}"</span>
                <button onClick={() => { setSearchInput(''); const n = new URLSearchParams(searchParams); n.delete('q'); setSearchParams(n); }}>✕</button>
              </div>
            )}
            {activeGenre && (
              <div className="dp-chip">
                <span>{GENRES.find(g => g.tag === activeGenre)?.icon} {activeGenre}</span>
                <button onClick={() => setGenre('')}>✕</button>
              </div>
            )}
            {totalCount > 0 && <span className="dp-count">{totalCount} results</span>}
          </div>
        )}

        {error && (
          <div className="dp-error-box">
            <span>⚠️</span>
            <p>{error}</p>
            <button className="btn btn-primary btn-sm" onClick={retry}>↺ Retry</button>
          </div>
        )}

        {/* ── Game Grid ── */}
        {loading ? (
          <div className="dp-grid">
            {[...Array(12)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : games.length === 0 ? (
          <div className="dp-empty">
            <span>🎮</span>
            <h3>No games found</h3>
            <p>Try a different search or browse by genre</p>
            <button className="btn btn-primary" onClick={clearAll}>Clear filters</button>
          </div>
        ) : (
          <>
            <div className="dp-grid">
              {games.map((game) => <SteamCard key={game.steamAppId} game={game} />)}
            </div>
            <div className="dp-steam-footer">
              <p>All data fetched live from <strong>Steam</strong> · Prices in USD · Clicking a game opens full details with trailer & reviews</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
