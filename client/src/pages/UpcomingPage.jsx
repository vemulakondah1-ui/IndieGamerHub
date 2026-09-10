import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { publicApi } from '../services/api';
import { onImageError } from '../utils/imageFallback';

const DEFAULT_UPCOMING_GAMES = [
  {
    _id: 'up-silksong',
    title: 'Hollow Knight: Silksong',
    platform: 'Steam',
    steamAppId: '1030300',
    expectedRelease: 'Coming Soon',
    thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1030300/header.jpg',
    description: 'Play as Hornet, princess-protector of Hallownest, and adventure through a whole new kingdom ruled by silk and song.'
  },
  {
    _id: 'up-gta6',
    title: 'Grand Theft Auto VI',
    platform: 'Epic Games & Steam',
    expectedRelease: '2026',
    thumbnail: 'https://images.igdb.com/igdb/image/upload/t_1080p/co7d4e.jpg',
    description: 'Grand Theft Auto VI heads to the state of Leonida, home to the neon-soaked streets of Vice City and beyond.'
  },
  {
    _id: 'up-doomdarkages',
    title: 'DOOM: The Dark Ages',
    platform: 'Steam',
    steamAppId: '3017860',
    expectedRelease: '2025 / 2026',
    thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/3017860/header.jpg',
    description: 'The single-player dark fantasy action FPS prequel to the critically acclaimed DOOM (2016) and DOOM Eternal.'
  },
  {
    _id: 'up-subnautica2',
    title: 'Subnautica 2',
    platform: 'Steam & Epic Games',
    steamAppId: '1962700',
    expectedRelease: '2026',
    thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1962700/header.jpg',
    description: 'Embark on a new adventure in an alien ocean world, featuring single player and up to 4-player co-op.'
  },
  {
    _id: 'up-dune',
    title: 'Dune: Awakening',
    platform: 'Steam',
    steamAppId: '1172710',
    expectedRelease: '2025 / 2026',
    thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1172710/header.jpg',
    description: 'An open-world survival MMO set on the most dangerous planet in the universe: Arrakis.'
  },
  {
    _id: 'up-arcraiders',
    title: 'ARC Raiders',
    platform: 'Steam & Epic Games',
    steamAppId: '1808500',
    expectedRelease: '2025',
    thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1808500/header.jpg',
    description: 'A third-person PvPvE extraction shooter set in a lethal, future earth infested by ruthless machines.'
  },
  {
    _id: 'up-mouse',
    title: 'MOUSE: P.I. For Hire',
    platform: 'Steam',
    steamAppId: '2416450',
    expectedRelease: '2026',
    thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2416450/header.jpg',
    description: 'Gritty 1930s noir FPS with visual style inspired by classic American cartoons of the rubber hose era.'
  },
  {
    _id: 'up-thewitcher4',
    title: 'The Witcher: Polaris',
    platform: 'Epic Games & Steam',
    expectedRelease: 'In Development',
    thumbnail: 'https://images.igdb.com/igdb/image/upload/t_1080p/co4j04.jpg',
    description: 'The beginning of a new saga in The Witcher universe built in collaboration with Epic on Unreal Engine 5.'
  },
  {
    _id: 'up-control2',
    title: 'Control 2',
    platform: 'Epic Games',
    expectedRelease: 'In Development',
    thumbnail: 'https://images.igdb.com/igdb/image/upload/t_1080p/co5j9l.jpg',
    description: 'A major action RPG sequel co-developed and published in partnership with Epic Games.'
  },
  {
    _id: 'up-skate',
    title: 'Skate.',
    platform: 'Steam & Epic Games',
    steamAppId: '2598710',
    expectedRelease: 'Coming Soon',
    thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2598710/header.jpg',
    description: 'The next evolution of the iconic skateboarding franchise with full cross-platform multiplayer.'
  }
];

export default function UpcomingPage() {
  const [games, setGames] = useState(DEFAULT_UPCOMING_GAMES);
  const [loading, setLoading] = useState(true);
  const [activePlatform, setActivePlatform] = useState('ALL'); // 'ALL' | 'STEAM' | 'EPIC'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    publicApi.get('/games/upcoming')
      .then((res) => {
        if (res.data?.data && res.data.data.length > 0) {
          setGames(res.data.data);
        }
      })
      .catch((err) => {
        console.error('Failed to load upcoming games, using default list:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      const platformMatch =
        activePlatform === 'ALL' ||
        (activePlatform === 'STEAM' && (game.platform?.toLowerCase().includes('steam') || game.steamAppId)) ||
        (activePlatform === 'EPIC' && game.platform?.toLowerCase().includes('epic'));

      const queryMatch =
        !searchQuery.trim() ||
        game.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.description?.toLowerCase().includes(searchQuery.toLowerCase());

      return platformMatch && queryMatch;
    });
  }, [games, activePlatform, searchQuery]);

  const getPlatformStyle = (platform = '') => {
    const p = platform.toLowerCase();
    if (p.includes('epic') && p.includes('steam')) {
      return {
        bg: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(168, 85, 247, 0.25))',
        color: '#e0e7ff',
        border: '1px solid rgba(168, 85, 247, 0.4)'
      };
    }
    if (p.includes('epic')) {
      return {
        bg: 'rgba(236, 72, 153, 0.18)',
        color: '#f472b6',
        border: '1px solid rgba(236, 72, 153, 0.35)'
      };
    }
    return {
      bg: 'rgba(56, 189, 248, 0.18)',
      color: '#38bdf8',
      border: '1px solid rgba(56, 189, 248, 0.35)'
    };
  };

  return (
    <div
      className="page-wrapper"
      style={{
        minHeight: '100vh',
        paddingTop: '110px',
        paddingBottom: '80px',
        paddingLeft: '24px',
        paddingRight: '24px',
        backgroundColor: 'var(--bg-primary, #0d0d0f)',
        color: '#fff'
      }}
    >
      <div className="container" style={{ maxWidth: '1350px', margin: '0 auto' }}>
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '999px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.9rem' }}>🎮 Live Store Rosters</span>
          </div>
          <h1 style={{ fontSize: '2.8rem', fontWeight: 900, margin: '0 0 12px', background: 'linear-gradient(135deg, #38bdf8 0%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Anticipated & Upcoming Games
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', maxWidth: '650px', margin: '0 auto' }}>
            Track the most anticipated titles and upcoming releases directly from Steam and Epic Games Stores.
          </p>
        </div>

        {/* Filter Controls */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '32px',
            background: 'rgba(22, 22, 30, 0.7)',
            padding: '16px 20px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          {/* Platform Switcher */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: `All Releases (${games.length})` },
              { id: 'STEAM', label: 'Steam' },
              { id: 'EPIC', label: 'Epic Games' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActivePlatform(tab.id)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '10px',
                  border: activePlatform === tab.id ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: activePlatform === tab.id ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
                  color: activePlatform === tab.id ? '#38bdf8' : '#94a3b8',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', minWidth: '240px', flex: '1', maxWidth: '360px' }}>
            <input
              type="text"
              placeholder="Search upcoming games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: '10px',
                background: 'rgba(10, 10, 15, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Games Grid */}
        {filteredGames.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            <h3>No upcoming games found matching "{searchQuery}"</h3>
            <p>Try switching platform filters or clearing your search.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {filteredGames.map((game) => {
              const badgeStyle = getPlatformStyle(game.platform);
              const isSteam = !!game.steamAppId || (game.platform && game.platform.toLowerCase().includes('steam') && !game.platform.toLowerCase().includes('epic'));
              const linkUrl = game.steamAppId ? `/steam/${game.steamAppId}` : null;

              return (
                <div
                  key={game._id}
                  style={{
                    background: '#16161e',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.45)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.25)';
                  }}
                >
                  {/* Game Panel Image */}
                  <div style={{ position: 'relative', width: '100%', height: '175px', backgroundColor: '#09090c', overflow: 'hidden' }}>
                    <img
                      src={game.thumbnail}
                      alt={game.title}
                      onError={onImageError(460, 215)}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                      loading="lazy"
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: badgeStyle.bg,
                        color: badgeStyle.color,
                        border: badgeStyle.border,
                        backdropFilter: 'blur(8px)'
                      }}
                    >
                      {game.platform || 'Steam'}
                    </div>

                    <div
                      style={{
                        position: 'absolute',
                        bottom: '10px',
                        right: '10px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        background: 'rgba(0, 0, 0, 0.75)',
                        color: '#10b981',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        backdropFilter: 'blur(4px)'
                      }}
                    >
                      {game.expectedRelease || 'Coming Soon'}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', lineHeight: 1.3 }}>
                        {game.title}
                      </h3>
                      <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.5', margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {game.description}
                      </p>
                    </div>

                    {/* Action Footer */}
                    <div style={{ marginTop: '18px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>
                        {isSteam ? 'Steam Store' : 'Epic Games Store'}
                      </span>

                      {linkUrl ? (
                        <Link
                          to={linkUrl}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            background: 'rgba(56, 189, 248, 0.15)',
                            color: '#38bdf8',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          View Details →
                        </Link>
                      ) : (
                        <a
                          href="https://store.epicgames.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            background: 'rgba(236, 72, 153, 0.15)',
                            color: '#f472b6',
                            border: '1px solid rgba(236, 72, 153, 0.3)',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          Visit Store ↗
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}