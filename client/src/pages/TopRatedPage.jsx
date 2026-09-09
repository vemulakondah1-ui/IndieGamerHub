import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { publicApi } from '../services/api';
import { onImageError } from '../utils/imageFallback';

const cleanDescription = (text) => {
    if (!text) return 'Critically acclaimed hit available on PC.';
    const clean = text.replace(/<[^>]*>?/gm, '').replace(/\[\/?\w+\]/g, '');
    return clean.length > 130 ? clean.slice(0, 130) + '...' : clean;
};

const DEFAULT_TOP_GAMES = [
    {
        _id: 'steam-1091500',
        steamAppId: '1091500',
        title: 'Cyberpunk 2077',
        platform: 'Steam & Epic',
        rating: 4.8,
        thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1091500/header.jpg',
        description: 'Open-world action RPG set in Night City.'
    },
    {
        _id: 'steam-2358720',
        steamAppId: '2358720',
        title: 'Black Myth: Wukong',
        platform: 'Epic Games & Steam',
        rating: 4.9,
        thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2358720/header.jpg',
        description: 'Action RPG rooted in Chinese mythology exploring the legend of Sun Wukong.'
    },
    {
        _id: 'steam-1245620',
        steamAppId: '1245620',
        title: 'Elden Ring',
        platform: 'Steam',
        rating: 4.9,
        thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1245620/header.jpg',
        description: 'Rise, Tarnished, and be guided by grace to become an Elden Lord.'
    },
    {
        _id: 'steam-105600',
        steamAppId: '105600',
        title: 'Terraria',
        platform: 'Steam',
        rating: 4.9,
        thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/105600/header.jpg',
        description: 'Dig, fight, explore, build! Nothing is impossible in this classic adventure.'
    }
];

export default function TopRatedPage() {
    const [games, setGames] = useState(DEFAULT_TOP_GAMES);
    const [loading, setLoading] = useState(true);
    const [platformFilter, setPlatformFilter] = useState('All');

    useEffect(() => {
        publicApi.get('/games/top-rated')
            .then((res) => {
                if (res.data?.data && res.data.data.length > 0) {
                    setGames(res.data.data);
                }
            })
            .catch((err) => {
                console.error('Failed to load top rated games, using default list:', err);
            })
            .finally(() => setLoading(false));
    }, []);

    const filtered = (games || []).filter((g) => {
        if (!g) return false;
        if (!platformFilter || platformFilter === 'All') return true;

        const target = String(platformFilter).toLowerCase();
        const rawPlatform = String(g.platform || g.store || '').toLowerCase();

        // 1. Direct platform match
        if (rawPlatform.includes(target)) return true;

        // 2. ID prefix and feed indicators
        const idStr = String(g._id || g.id || '').toLowerCase();
        if (target.includes('epic') && (idStr.includes('epic') || g.namespace || g.appId?.toString().startsWith('epic'))) {
            return true;
        }
        if (target.includes('steam') && (g.steamAppId || (/^\d+$/.test(idStr) && !idStr.includes('epic')))) {
            return true;
        }

        // 3. Fallback for specific Epic titles if platform is set to "Windows"
        const title = String(g.title || '').toLowerCase();
        if (target.includes('epic') && (title.includes('cyberpunk') || title.includes('wukong'))) {
            return true;
        }

        return false;
    });

    return (
        <div className="page-wrapper" style={{ minHeight: '100vh', paddingTop: '110px', paddingBottom: '80px', paddingLeft: '24px', paddingRight: '24px', backgroundColor: 'var(--bg-primary, #0d0d0f)', color: '#fff' }}>
            <div className="container" style={{ maxWidth: '1300px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: '0 0 10px', color: '#f59e0b' }}>
                        ⭐ Top Rated Games
                    </h1>
                    <p style={{ color: '#94a3b8' }}>Critically acclaimed masterpieces from Steam and Epic Games</p>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                        {['All', 'Steam', 'Epic'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setPlatformFilter(p)}
                                style={{
                                    padding: '8px 18px',
                                    borderRadius: '20px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    backgroundColor: platformFilter === p ? '#f59e0b' : '#1e293b',
                                    color: platformFilter === p ? '#000' : '#fff'
                                }}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                    {filtered.map((game) => {
                        // Safe detail URL generation
                        const cleanSteamAppId = String(game.steamAppId || game._id || '').replace(/^steam-/, '');
                        const detailUrl = game.detailUrl || (game.platform === 'Epic Games' || String(game._id).startsWith('epic-')
                            ? `/games/${String(game._id)}`
                            : `/steam/${cleanSteamAppId}`);

                        // Safe description fallback
                        const rawDesc = game.description || game.short_description || 'No description available.';
                        const safeDesc = typeof cleanDescription === 'function' ? cleanDescription(rawDesc) : rawDesc;

                        return (
                            <div
                                key={game._id || game.id || game.title}
                                style={{
                                    background: '#16161e',
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                            >
                                <img
                                    src={game.thumbnail || game.header_image || ''}
                                    alt={game.title}
                                    onError={onImageError(280, 150)}
                                    style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                                />
                                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
                                            {game.platform || 'Steam / Epic'}
                                        </span>
                                        <h3 style={{ margin: '12px 0 6px', fontSize: '1.2rem', color: '#fff' }}>{game.title}</h3>
                                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.4' }}>
                                            {safeDesc}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '16px' }}>
                                        <span style={{ color: '#f59e0b', fontWeight: 800 }}>★ {game.rating || '4.8'}</span>
                                        <Link
                                            to={detailUrl}
                                            style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 700 }}
                                        >
                                            View Details &rarr;
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}