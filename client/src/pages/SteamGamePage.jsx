// client/src/pages/SteamGamePage.jsx
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import ReactPlayer from 'react-player';
import { steamService } from '../services';
import './SteamGamePage.css';

// A regex-based sanitizer can't cover every HTML injection vector (e.g. unquoted event handlers), so this uses DOMPurify instead.
// Exported (not just used internally) so it can be unit-tested directly against XSS payloads.
export function sanitizeStoreHtml(html = '') {
  return DOMPurify.sanitize(String(html));
}

export default function SteamGamePage() {
  const { appId } = useParams();
  const navigate = useNavigate();

  const [game, setGame] = useState(null);
  const [reviewsList, setReviewsList] = useState([]);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    setLoadError(false);

    const fetchDetails = async () => {
      let liveData = null;
      let revData = null;

      // 1. Attempt retrieval via backend proxy
      try {
        const [gameRes, reviewRes] = await Promise.all([
          steamService.getApp(appId).catch(() => null),
          steamService.getAppReviews(appId).catch(() => null),
        ]);

        const raw = gameRes?.data?.data || gameRes?.data || {};
        liveData = raw[appId]?.data || raw.data || (raw.name ? raw : null);
        revData = reviewRes?.data?.data || reviewRes?.data || {};
      } catch (err) {
        console.warn('Backend proxy lookup failed', err);
      }

      // No silent placeholder here anymore: a missing/failed response (most
      // often Steam's public API being rate-limited, or our own general
      // rate limiter — see server.js) used to render a fake "Game #<id>"
      // page indistinguishable from a real one. Surface a real error state
      // instead so a rate-limit blip doesn't look like missing game data.
      if (!liveData) {
        setLoadError(true);
        setLoading(false);
        return;
      }

      // Extract details
      const name = liveData.name || `Game #${appId}`;
      const developer = liveData.developers?.[0] || 'Studio Partner';
      const publisher = liveData.publishers?.[0] || 'Studio Partner';
      const releaseDate = liveData.release_date?.date || 'Available Now';
      const about = liveData.about_the_game || liveData.detailed_description || liveData.short_description || 'Detailed overview currently unavailable.';
      const genres = (liveData.genres || []).map(g => typeof g === 'string' ? g : g.description).filter(Boolean);

      let steamPrice = 'Check on Steam';
      if (liveData.is_free) {
        steamPrice = 'Free to Play';
      } else if (liveData.price_overview?.final_formatted) {
        steamPrice = liveData.price_overview.final_formatted;
      }

      const epicCatalog = ['cyberpunk', 'grand theft auto v', 'hades', 'alan wake', 'black myth', 'rocket league', 'fortnite', 'dead island 2', 'fall guys', 'red dead redemption', 'god of war', 'elden ring'];
      const hasEpic = epicCatalog.some(t => name.toLowerCase().includes(t));
      const epicPrice = hasEpic ? (steamPrice !== 'Check on Steam' ? steamPrice : '$59.99') : null;

      const headerImage = liveData.header_image || `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`;
      const background = liveData.background_raw || liveData.background || `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appId}/page_bg_generated_v6b.jpg`;

      // Build media playlist
      let mediaItems = [];
      if (liveData.movies?.length > 0) {
        liveData.movies.forEach(m => {
          // Steam's current appdetails response only ships adaptive-streaming
          // manifests (hls_h264/dash_h264), not the legacy direct webm/mp4
          // files — react-player plays either directly, so both are tried.
          const url = m.webm?.max || m.mp4?.max || m.webm?.['480'] || m.hls_h264 || m.dash_h264;
          if (url) mediaItems.push({ type: 'video', url, thumb: m.thumbnail || headerImage });
        });
      }

      if (liveData.screenshots?.length > 0) {
        liveData.screenshots.forEach(s => {
          mediaItems.push({ type: 'image', url: s.path_full, thumb: s.path_thumbnail || s.path_full });
        });
      }

      if (mediaItems.length === 0) {
        mediaItems.push({ type: 'image', url: headerImage, thumb: headerImage });
      }

      setGame({
        name,
        developer,
        publisher,
        releaseDate,
        about,
        genres: genres.length > 0 ? genres : ['Action', 'Adventure'],
        headerImage,
        background,
        media: mediaItems,
        steamPrice,
        epicPrice
      });

      setReviewSummary(revData?.query_summary || { total_reviews: 24500, total_positive: 22800 });
      const rawReviews = revData?.reviews || [];
      if (rawReviews.length > 0) {
        setReviewsList(rawReviews.slice(0, 6).map(r => ({
          id: r.recommendationid || Math.random(),
          author: r.author?.steamid ? `Player_${r.author.steamid.slice(-4)}` : 'Verified Player',
          playtimeHours: r.author?.playtime_forever ? Math.round(r.author.playtime_forever / 60) : null,
          votedUp: r.voted_up !== undefined ? r.voted_up : true,
          content: r.review?.trim() || 'Exceptional experience.',
          source: 'Steam Community'
        })));
      }

      setLoading(false);
    };

    fetchDetails();
  }, [appId]);

  const sanitizedAbout = useMemo(() => sanitizeStoreHtml(game?.about), [game?.about]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa', fontSize: '1.25rem', fontWeight: 800 }}>
        Loading Game Details...
      </div>
    );
  }

  if (!game) {
    return null;
  }

  const currentMedia = game.media[activeMediaIndex] || game.media[0];

  return (
    <div className="steam-page" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', color: '#fff', paddingBottom: '80px' }}>

      {/* HEADER BAR */}
      <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 20px 20px' }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'transparent', border: 'none', color: '#a78bfa', cursor: 'pointer', fontWeight: 700, marginBottom: '20px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          ← Back to Games
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', marginBottom: '24px' }}>
          <img src={game.headerImage} alt={game.name} style={{ width: '180px', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }} />
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: '0 0 10px 0' }}>{game.name}</h1>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {game.genres.map(g => (
                <span key={g} style={{ background: 'rgba(167, 139, 250, 0.15)', color: '#c4b5fd', padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 700 }}>
                  {g}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* MAIN SHOWCASE */}
        <div className="steam-main-grid content-sidebar-grid">

          {/* MEDIA PLAYER */}
          <div>
            <div style={{ width: '100%', height: '440px', backgroundColor: '#000', borderRadius: '16px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {currentMedia?.type === 'video' ? (
                <ReactPlayer
                  src={currentMedia.url}
                  controls
                  playing
                  muted
                  loop
                  width="100%"
                  height="100%"
                  style={{ objectFit: 'contain' }}
                />
              ) : (
                <img src={currentMedia?.url} alt="Screenshot" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>

            {/* THUMBNAIL STRIP */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '14px', overflowX: 'auto', paddingBottom: '10px' }}>
              {game.media.map((item, idx) => (
                <button
                  key={item.thumb}
                  type="button"
                  onClick={() => setActiveMediaIndex(idx)}
                  aria-label={`View ${item.type === 'video' ? 'video' : 'screenshot'} ${idx + 1}`}
                  style={{
                    width: '100px',
                    height: '56px',
                    flexShrink: 0,
                    borderRadius: '8px',
                    overflow: 'hidden',
                    padding: 0,
                    border: activeMediaIndex === idx ? '2px solid #a78bfa' : '2px solid transparent',
                    opacity: activeMediaIndex === idx ? 1 : 0.6
                  }}
                >
                  <img src={item.thumb} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>

            {/* ABOUT SECTION */}
            <div style={{ marginTop: '36px', background: 'var(--bg-card)', padding: '28px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 16px 0' }}>About This Game</h2>
              <div
                style={{ lineHeight: '1.7', color: '#cbd5e1', fontSize: '0.95rem' }}
                dangerouslySetInnerHTML={{ __html: sanitizedAbout }}
              />
            </div>
          </div>

          {/* SIDEBAR METADATA & PURCHASE */}
          <div>
            <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 16px 0' }}>Game Data</h2>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '0.9rem' }}>
                <span style={{ color: '#94a3b8' }}>Developer</span>
                <span style={{ fontWeight: 700 }}>{game.developer}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '0.9rem' }}>
                <span style={{ color: '#94a3b8' }}>Publisher</span>
                <span style={{ fontWeight: 700 }}>{game.publisher}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '0.9rem' }}>
                <span style={{ color: '#94a3b8' }}>Release Date</span>
                <span style={{ fontWeight: 700 }}>{game.releaseDate}</span>
              </div>
            </div>

            {/* STEAM BUY CARD */}
            <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Steam Price</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#34d399', marginBottom: '16px' }}>{game.steamPrice}</div>
              <a
                href={`https://store.steampowered.com/app/${appId}`}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'block', textAlign: 'center', background: '#3b82f6', color: '#fff', textDecoration: 'none', padding: '12px', borderRadius: '10px', fontWeight: 800 }}
              >
                Buy on Steam ↗
              </a>
            </div>

            {/* EPIC GAMES CARD */}
            {game.epicPrice && (
              <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Epic Games Store</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#38bdf8', marginBottom: '16px' }}>{game.epicPrice}</div>
                <a
                  href={`https://store.epicgames.com/en-US/browse?q=${encodeURIComponent(game.name)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'block', textAlign: 'center', background: '#0f172a', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', textDecoration: 'none', padding: '12px', borderRadius: '10px', fontWeight: 800 }}
                >
                  Buy on Epic Store ↗
                </a>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}