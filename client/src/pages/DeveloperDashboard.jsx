import { useState, useEffect, useRef } from 'react';
import { gameService } from '../services';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/getErrorMessage';
import './DeveloperDashboard.css';

const GENRES = [
  'Action', 'Adventure', 'RPG', 'Strategy', 'Puzzle',
  'Platformer', 'Horror', 'Simulation', 'Indie', 'Sports', 'Racing', 'Shooter',
];
const PLATFORMS = ['Windows', 'Mac', 'Linux', 'Web', 'Android', 'iOS'];

const emptyForm = {
  title: '', description: '', shortDescription: '', genre: [],
  tags: '', releaseDate: '', trailerUrl: '',
  storeLinks: { steam: '', epic: '', itch: '', gog: '' },
  steamAppId: '', price: '', isFree: false,
  platform: ['Windows'], thumbnail: null, thumbnailUrl: '', screenshots: [],
};

// Simple bar chart component (pure CSS/SVG, no external lib)
function BarChart({ playedData, soldData }) {
  const allValues = [...playedData.map((d) => d.value), ...soldData.map((d) => d.value)];
  const maxVal = Math.max(...allValues, 1);

  const renderBars = (data, colorClass) => (
    data.map((item, i) => {
      const pct = (item.value / maxVal) * 100;
      return (
        <div key={i} className="chart-bar-group">
          <div className="chart-bar-label" title={item.name}>{item.name}</div>
          <div className="chart-bar-track">
            <div
              className={`chart-bar-fill ${colorClass}`}
              style={{ width: `${pct}%` }}
            />
            <span className="chart-bar-value">{item.value}</span>
          </div>
        </div>
      );
    })
  );

  return (
    <div className="bar-chart-container">
      <div className="bar-chart-section">
        <div className="bar-chart-section-title">
          <span className="legend-dot played" />
          🎮 Most Played (Top 5)
        </div>
        {playedData.length === 0
          ? <p className="chart-empty">No data available for this genre</p>
          : renderBars(playedData, 'bar-played')}
      </div>
      <div className="bar-chart-section">
        <div className="bar-chart-section-title">
          <span className="legend-dot sold" />
          💰 Most Sold (Top 5)
        </div>
        {soldData.length === 0
          ? <p className="chart-empty">No paid games found for this genre</p>
          : renderBars(soldData, 'bar-sold')}
      </div>
    </div>
  );
}

export default function DeveloperDashboard() {
  const { user } = useAuth();

  // My Games state
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [prefilling, setPrefilling] = useState(false);

  // Upload dropdown state
  const [uploadDropdown, setUploadDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Genre explorer state
  const [selectedGenre, setSelectedGenre] = useState('Action');
  const [genreStats, setGenreStats] = useState({ mostPlayed: [], mostSold: [] });
  const [genreLoading, setGenreLoading] = useState(false);

  // Active tab state
  const [activeTab, setActiveTab] = useState('explorer'); // 'explorer' | 'mygames'

  // Fetch my games
  useEffect(() => {
    if (user?._id) {
      gameService.getDeveloperGames(user._id)
        .then(({ data }) => setGames(data.data || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  // Fetch genre stats when genre changes
  useEffect(() => {
    setGenreLoading(true);
    gameService.getGenreStats(selectedGenre)
      .then(({ data }) => setGenreStats(data.data || { mostPlayed: [], mostSold: [] }))
      .catch(() => setGenreStats({ mostPlayed: [], mostSold: [] }))
      .finally(() => setGenreLoading(false));
  }, [selectedGenre]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUploadDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSteamPrefill = async () => {
    const cleanAppId = form.steamAppId.trim().replace(/^steam-/, '');
    if (!cleanAppId) {
      setError('Enter a Steam App ID first');
      return;
    }
    setPrefilling(true);
    setError('');

    const cleanHtml = (str) => (!str ? '' : String(str).replace(/<[^>]*>?/gm, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim());

    const applyGameData = (d, sourceLabel = 'Steam') => {
      const rawDesc = d.description || d.detailed_description || d.about_the_game || '';
      const rawShort = d.shortDescription || d.short_description || '';
      const cleanDesc = cleanHtml(rawDesc).slice(0, 4900);
      const cleanShort = cleanHtml(rawShort || rawDesc).slice(0, 290);
      const headerImg = d.thumbnail || d.header_image || (cleanAppId ? `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${cleanAppId}/header.jpg` : '');

      setForm((f) => ({
        ...f,
        title: d.title || d.name || f.title,
        description: cleanDesc || f.description,
        shortDescription: cleanShort || f.shortDescription,
        genre: d.genre || (d.genres ? d.genres.map((g) => (typeof g === 'string' ? g : g.description)) : f.genre),
        tags: Array.isArray(d.tags) ? d.tags.join(', ') : (d.tags || f.tags),
        releaseDate: d.releaseDate
          ? new Date(d.releaseDate).toISOString().split('T')[0]
          : d.release_date?.date
            ? new Date(d.release_date.date).toISOString().split('T')[0]
            : f.releaseDate,
        trailerUrl: d.trailerUrl || (d.movies?.[0]?.mp4?.max || d.movies?.[0]?.webm?.max || f.trailerUrl),
        price: d.price ?? (d.is_free ? 0 : d.price_overview?.final ? (d.price_overview.final / 100).toFixed(2) : f.price),
        isFree: d.isFree ?? (d.is_free || false),
        platform: d.platform || (d.platforms ? Object.keys(d.platforms).filter((k) => d.platforms[k]).map((k) => k.charAt(0).toUpperCase() + k.slice(1)) : f.platform),
        storeLinks: {
          ...f.storeLinks,
          steam: `https://store.steampowered.com/app/${cleanAppId}`,
        },
        thumbnailUrl: headerImg || f.thumbnailUrl,
      }));
      setSuccess(`✅ Auto-filled from ${sourceLabel}!`);
    };

    // 1. First attempt: gameService.steamPrefill
    try {
      const { data } = await gameService.steamPrefill(cleanAppId);
      if (data?.data) {
        applyGameData(data.data, data.source === 'rawg' ? 'RAWG.io' : 'Steam');
        setPrefilling(false);
        return;
      }
    } catch (e) {
      console.warn('gameService.steamPrefill failed, trying direct steam route...', e);
    }

    // 2. Second attempt: internal /api/steam/details route
    try {
      const res = await fetch(`/api/steam/details/${cleanAppId}`);
      if (res.ok) {
        const json = await res.json();
        const steamData = json.data || json;
        if (steamData && (steamData.name || steamData.title)) {
          applyGameData(steamData, 'Steam API');
          setPrefilling(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Internal /api/steam/details route failed, trying corsproxy fallback...', e);
    }

    // 3. Third attempt: corsproxy.io (reliable for Steam store JSON)
    try {
      const target = encodeURIComponent(`https://store.steampowered.com/api/appdetails?appids=${cleanAppId}&cc=us&l=en`);
      const proxyRes = await fetch(`https://corsproxy.io/?url=${target}`);
      if (proxyRes.ok) {
        const parsed = await proxyRes.json();
        const steamData = parsed[cleanAppId]?.data;
        if (steamData) {
          applyGameData(steamData, 'Steam Store');
          setPrefilling(false);
          return;
        }
      }
    } catch (e) {
      console.error('All fetch strategies exhausted:', e);
    }

    setError('Could not fetch Steam details. Please verify the ID or fill in details manually.');
    setPrefilling(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    const fd = new FormData();
    const fields = ['title', 'description', 'shortDescription', 'trailerUrl', 'steamAppId', 'releaseDate'];
    fields.forEach((k) => fd.append(k, form[k] || ''));
    fd.append('price', form.price || '0');
    fd.append('isFree', form.isFree);
    form.genre.forEach((g) => fd.append('genre', g));
    fd.append('tags', form.tags);
    form.platform.forEach((p) => fd.append('platform', p));
    fd.append('storeLinks', JSON.stringify(form.storeLinks));
    if (form.thumbnail) fd.append('thumbnail', form.thumbnail);
    if (form.thumbnailUrl) fd.append('thumbnailUrl', form.thumbnailUrl);
    form.screenshots.forEach((s) => fd.append('screenshots', s));

    try {
      let res;
      if (editingId) {
        res = await gameService.updateGame(editingId, fd);
        setGames((prev) => prev.map((g) => g._id === editingId ? res.data.data : g));
        setSuccess('Game updated successfully!');
      } else {
        res = await gameService.createGame(fd);
        setGames((prev) => [res.data.data, ...prev]);
        setSuccess('Game created successfully!');
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save game'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (game) => {
    setEditingId(game._id);
    setForm({
      ...emptyForm,
      title: game.title || '',
      description: game.description || '',
      shortDescription: game.shortDescription || '',
      genre: game.genre || [],
      tags: (game.tags || []).join(', '),
      releaseDate: game.releaseDate ? new Date(game.releaseDate).toISOString().split('T')[0] : '',
      trailerUrl: game.trailerUrl || '',
      storeLinks: game.storeLinks || emptyForm.storeLinks,
      steamAppId: game.steamAppId || '',
      price: game.price ?? '', // price defaults to 0 in the schema (a real, valid price), so || would blank the field for a $0 game that isn't flagged isFree
      isFree: game.isFree || false,
      platform: game.platform || ['Windows'],
    });
    setShowForm(true);
    setActiveTab('mygames');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this game? This cannot be undone.')) return;
    try {
      await gameService.deleteGame(id);
      setGames((prev) => prev.filter((g) => g._id !== id));
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to delete game'));
    }
  };

  const toggleGenre = (g) => setForm((f) => ({
    ...f,
    genre: f.genre.includes(g) ? f.genre.filter((x) => x !== g) : [...f.genre, g],
  }));

  const togglePlatform = (p) => setForm((f) => ({
    ...f,
    platform: f.platform.includes(p) ? f.platform.filter((x) => x !== p) : [...f.platform, p],
  }));

  const openUploadNew = () => {
    setUploadDropdown(false);
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setActiveTab('mygames');
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openUpdateExisting = () => {
    setUploadDropdown(false);
    setActiveTab('mygames');
    setShowForm(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Build chart data
  const playedChartData = (genreStats.mostPlayed || []).map((g) => ({
    name: g.title?.length > 20 ? g.title.slice(0, 18) + '…' : g.title,
    value: g.reviewCount || 0,
  }));
  const soldChartData = (genreStats.mostSold || []).map((g) => ({
    name: g.title?.length > 20 ? g.title.slice(0, 18) + '…' : g.title,
    value: Number((g.price || 0).toFixed(2)),
  }));

  return (
    <div className="page-wrapper">
      <div className="container dashboard-container">

        {/* ─── Header ─── */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Developer Studio</h1>
            <p className="text-muted text-sm">Welcome back, <strong>{user?.username}</strong> 👾</p>
          </div>

          {/* Upload Game Dropdown */}
          <div className="upload-dropdown-wrapper" ref={dropdownRef}>
            <button
              className="btn btn-primary upload-trigger-btn"
              onClick={() => setUploadDropdown((v) => !v)}
            >
              <span className="upload-icon">⬆</span>
              Upload Game
              <span className={`upload-caret ${uploadDropdown ? 'open' : ''}`}>▾</span>
            </button>
            {uploadDropdown && (
              <div className="upload-dropdown-menu animate-fade-in">
                <button className="upload-dropdown-item" onClick={openUploadNew}>
                  <span className="ddi-icon">🚀</span>
                  <div>
                    <div className="ddi-label">Upload New Game</div>
                    <div className="ddi-desc">Publish a brand new listing</div>
                  </div>
                </button>
                <div className="upload-dropdown-divider" />
                <button className="upload-dropdown-item" onClick={openUpdateExisting}>
                  <span className="ddi-icon">✏️</span>
                  <div>
                    <div className="ddi-label">Update Existing Game</div>
                    <div className="ddi-desc">Edit one of your current games</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ─── Tabs ─── */}
        <div className="dev-tabs">
          <button
            className={`dev-tab ${activeTab === 'explorer' ? 'active' : ''}`}
            onClick={() => setActiveTab('explorer')}
          >
            🔍 Genre Explorer
          </button>
          <button
            className={`dev-tab ${activeTab === 'mygames' ? 'active' : ''}`}
            onClick={() => setActiveTab('mygames')}
          >
            🎮 My Games <span className="dev-tab-badge">{games.length}</span>
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            TAB: GENRE EXPLORER
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'explorer' && (
          <div className="genre-explorer animate-fade-in">

            {/* Genre Selector */}
            <div className="genre-selector-card">
              <div className="genre-selector-header">
                <h2 className="genre-selector-title">Select a Game Genre</h2>
                <p className="genre-selector-sub">Explore market trends before you start building</p>
              </div>
              <div className="genre-pill-grid">
                {GENRES.map((g) => (
                  <button
                    key={g}
                    className={`genre-pill ${selectedGenre === g ? 'active' : ''}`}
                    onClick={() => setSelectedGenre(g)}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Genre Stats */}
            {genreLoading ? (
              <div className="loading-center" style={{ minHeight: '300px' }}>
                <div className="spinner" />
              </div>
            ) : (
              <>
                {/* Top Cards Row */}
                <div className="genre-stats-header">
                  <div className="genre-stats-badge">
                    <span className="genre-badge-label">Exploring</span>
                    <span className="genre-badge-value">{selectedGenre}</span>
                  </div>
                </div>

                <div className="genre-top-row">
                  {/* Most Played */}
                  <div className="genre-top-card">
                    <div className="genre-top-card-header played">
                      <span className="gtc-icon">🎮</span>
                      <div>
                        <h3 className="gtc-title">Most Played</h3>
                        <p className="gtc-sub">Highest player engagement</p>
                      </div>
                    </div>
                    <div className="gtc-list">
                      {(genreStats.mostPlayed || []).length === 0 ? (
                        <div className="gtc-empty">No games found for <strong>{selectedGenre}</strong></div>
                      ) : (
                        (genreStats.mostPlayed || []).map((game, idx) => (
                          <div key={game._id} className="gtc-item">
                            <span className={`gtc-rank rank-${idx + 1}`}>{idx + 1}</span>
                            {game.thumbnail
                              ? <img src={game.thumbnail} alt={game.title} className="gtc-thumb" />
                              : <div className="gtc-thumb gtc-thumb-placeholder">🎮</div>}
                            <div className="gtc-info">
                              <div className="gtc-name">{game.title}</div>
                              <div className="gtc-meta">
                                {game.reviewCount || 0} reviews
                                {game.avgRating > 0 && <> · ⭐ {game.avgRating.toFixed(1)}</>}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Most Sold */}
                  <div className="genre-top-card">
                    <div className="genre-top-card-header sold">
                      <span className="gtc-icon">💰</span>
                      <div>
                        <h3 className="gtc-title">Most Sold</h3>
                        <p className="gtc-sub">Top revenue generators</p>
                      </div>
                    </div>
                    <div className="gtc-list">
                      {(genreStats.mostSold || []).length === 0 ? (
                        <div className="gtc-empty">No paid games found for <strong>{selectedGenre}</strong></div>
                      ) : (
                        (genreStats.mostSold || []).map((game, idx) => (
                          <div key={game._id} className="gtc-item">
                            <span className={`gtc-rank rank-${idx + 1}`}>{idx + 1}</span>
                            {game.thumbnail
                              ? <img src={game.thumbnail} alt={game.title} className="gtc-thumb" />
                              : <div className="gtc-thumb gtc-thumb-placeholder">💎</div>}
                            <div className="gtc-info">
                              <div className="gtc-name">{game.title}</div>
                              <div className="gtc-meta">
                                ${Number(game.price || 0).toFixed(2)}
                                {game.reviewCount > 0 && <> · {game.reviewCount} sales</>}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Bar Chart */}
                <div className="genre-chart-card">
                  <div className="genre-chart-header">
                    <h3 className="genre-chart-title">📊 Comparative Overview — {selectedGenre}</h3>
                    <p className="genre-chart-sub">Top 5 most played vs most sold in this genre</p>
                  </div>
                  <BarChart playedData={playedChartData} soldData={soldChartData} />
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB: MY GAMES
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'mygames' && (
          <div className="animate-fade-in">
            {/* Success / Error banners */}
            {success && <div className="alert alert-success mb-md">{success}</div>}
            {error && <div className="alert alert-error mb-md">{error}</div>}

            {/* Game Form */}
            {showForm && (
              <div className="game-form-wrapper animate-fade-in">
                <div className="game-form-header">
                  <h2 className="game-form__title">{editingId ? '✏️ Edit Game' : '🚀 Publish New Game'}</h2>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}>✕ Close</button>
                </div>

                {/* Steam Prefill */}
                <div className="steam-prefill-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label" htmlFor="dp-steam-app-id">Steam App ID (Auto-fill)</label>
                    <input
                      id="dp-steam-app-id"
                      className="form-input"
                      placeholder="e.g. 1091500 (Cyberpunk 2077)"
                      value={form.steamAppId}
                      onChange={(e) => setForm((f) => ({ ...f, steamAppId: e.target.value }))}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary steam-prefill-btn"
                    onClick={handleSteamPrefill}
                    disabled={prefilling}
                  >
                    {prefilling ? '⏳ Fetching...' : '🎮 Fetch from Steam'}
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="game-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="dp-title">Game Title *</label>
                      <input id="dp-title" className="form-input" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="My Awesome Game" />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="dp-release-date">Release Date</label>
                      <input id="dp-release-date" type="date" className="form-input" value={form.releaseDate} onChange={(e) => setForm((f) => ({ ...f, releaseDate: e.target.value }))} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="dp-short-desc">Short Description (max 300 chars)</label>
                    <input id="dp-short-desc" className="form-input" value={form.shortDescription} onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))} placeholder="A brief description for cards and listings" maxLength={300} />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="dp-description">Full Description *</label>
                    <textarea id="dp-description" className="form-input form-textarea" required rows={6} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Describe your game in detail..." />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="dp-price">Price ($)</label>
                      <input id="dp-price" type="number" className="form-input" min={0} step={0.01} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="0.00" disabled={form.isFree} />
                      <label className="form-label" htmlFor="dp-is-free" style={{ flexDirection: 'row', display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <input id="dp-is-free" type="checkbox" checked={form.isFree} onChange={(e) => setForm((f) => ({ ...f, isFree: e.target.checked, price: e.target.checked ? '0' : f.price }))} /> Free to Play
                      </label>
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="dp-trailer">Trailer URL (YouTube / mp4)</label>
                      <input id="dp-trailer" className="form-input" value={form.trailerUrl} onChange={(e) => setForm((f) => ({ ...f, trailerUrl: e.target.value }))} placeholder="https://youtube.com/..." />
                    </div>
                  </div>

                  {/* Genre */}
                  <fieldset className="form-group" style={{ border: 'none', padding: 0, margin: 0 }}>
                    <legend className="form-label" style={{ padding: 0 }}>Genres</legend>
                    <div className="multi-select">
                      {GENRES.map((g) => (
                        <button type="button" key={g} className={`multi-chip ${form.genre.includes(g) ? 'selected' : ''}`} onClick={() => toggleGenre(g)}>{g}</button>
                      ))}
                    </div>
                  </fieldset>

                  {/* Platform */}
                  <fieldset className="form-group" style={{ border: 'none', padding: 0, margin: 0 }}>
                    <legend className="form-label" style={{ padding: 0 }}>Platform</legend>
                    <div className="multi-select">
                      {PLATFORMS.map((p) => (
                        <button type="button" key={p} className={`multi-chip ${form.platform.includes(p) ? 'selected' : ''}`} onClick={() => togglePlatform(p)}>{p}</button>
                      ))}
                    </div>
                  </fieldset>

                  {/* Tags */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="dp-tags">Tags (comma-separated)</label>
                    <input id="dp-tags" className="form-input" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder="open-world, co-op, pixel-art..." />
                  </div>

                  {/* Store Links */}
                  <fieldset className="form-group" style={{ border: 'none', padding: 0, margin: 0 }}>
                    <legend className="form-label" style={{ padding: 0 }}>Store Links</legend>
                    <div className="store-links-grid">
                      {['steam', 'epic', 'itch', 'gog'].map((store) => (
                        <input key={store} className="form-input" aria-label={`${store.charAt(0).toUpperCase() + store.slice(1)} URL`} placeholder={`${store.charAt(0).toUpperCase() + store.slice(1)} URL`} value={form.storeLinks[store] || ''} onChange={(e) => setForm((f) => ({ ...f, storeLinks: { ...f.storeLinks, [store]: e.target.value } }))} />
                      ))}
                    </div>
                  </fieldset>

                  {/* Media uploads */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="dp-thumbnail">Thumbnail Image</label>
                      <input id="dp-thumbnail" type="file" className="form-input" accept="image/*" onChange={(e) => setForm((f) => ({ ...f, thumbnail: e.target.files[0] }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="dp-screenshots">Screenshots (up to 10)</label>
                      <input id="dp-screenshots" type="file" className="form-input" accept="image/*" multiple onChange={(e) => setForm((f) => ({ ...f, screenshots: Array.from(e.target.files) }))} />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
                      {submitting ? 'Saving...' : editingId ? '💾 Update Game' : '🚀 Publish Game'}
                    </button>
                    <button type="button" className="btn btn-secondary btn-lg" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* My Games List */}
            <h2 className="dashboard-section-title">My Games ({games.length})</h2>
            {loading ? (
              <div className="loading-center"><div className="spinner" /></div>
            ) : games.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎮</div>
                <h3>No games listed yet</h3>
                <p>Use the <strong>Upload Game</strong> button above to get started.</p>
                <button className="btn btn-primary" onClick={openUploadNew}>🚀 Publish Your First Game</button>
              </div>
            ) : (
              <div className="dev-games-list">
                {games.map((game) => (
                  <div key={game._id} className="dev-game-row">
                    <div className="dev-game-thumb">
                      {game.thumbnail ? <img src={game.thumbnail} alt={game.title} /> : <span>🎮</span>}
                    </div>
                    <div className="dev-game-info">
                      <h3 className="dev-game-title">{game.title}</h3>
                      <div className="dev-game-meta">
                        {game.genre?.slice(0, 2).map((g) => <span key={g} className="badge badge-primary" style={{ fontSize: '10px' }}>{g}</span>)}
                        {game.isFeatured && <span className="badge badge-gold" style={{ fontSize: '10px' }}>⭐ Featured</span>}
                        <span className="text-muted text-xs">{game.reviewCount || 0} reviews · ⭐ {game.avgRating?.toFixed(1) || '0.0'}</span>
                      </div>
                    </div>
                    <div className="dev-game-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(game)}>✏️ Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(game._id)}>🗑️ Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
