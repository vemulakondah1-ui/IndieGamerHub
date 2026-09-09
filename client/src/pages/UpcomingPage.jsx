import { useState, useEffect } from 'react';
import { publicApi } from '../services/api';
import { onImageError } from '../utils/imageFallback';

const DEFAULT_UPCOMING_GAMES = [
    {
        _id: 'up-gta6',
        title: 'Grand Theft Auto VI',
        platform: 'Epic Games & Steam',
        expectedRelease: '2026',
        thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80',
        description: 'Return to Vice City in the next evolution of open-world gaming.'
    },
    {
        _id: 'up-silksong',
        title: 'Hollow Knight: Silksong',
        platform: 'Steam',
        expectedRelease: 'Coming Soon',
        thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80',
        description: 'Play as Hornet and ascend to the peak of a haunted kingdom.'
    },
    {
        _id: 'up-thewitcher4',
        title: 'The Witcher: Polaris',
        platform: 'Epic Games',
        expectedRelease: 'In Development',
        thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80',
        description: 'A new saga in The Witcher universe built on Unreal Engine 5.'
    },
    {
        _id: 'up-control2',
        title: 'Control 2',
        platform: 'Epic Games',
        expectedRelease: '2026 / 2027',
        thumbnail: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=600&q=80',
        description: 'A major action sequel co-published by Remedy and Epic Games.'
    }
];

export default function UpcomingPage() {
    const [games, setGames] = useState(DEFAULT_UPCOMING_GAMES);
    const [loading, setLoading] = useState(true);

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
            <div className="container" style={{ maxWidth: '1300px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: '0 0 10px', color: '#38bdf8' }}>
                        🚀 Anticipated & Upcoming Games
                    </h1>
                    <p style={{ color: '#94a3b8' }}>Upcoming releases hitting Steam and Epic Games Stores</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                    {games.map((game) => (
                        <div
                            key={game._id}
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
                                src={game.thumbnail}
                                alt={game.title}
                                onError={onImageError(280, 150)}
                                style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                            />
                            <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '4px 8px', borderRadius: '6px', background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc' }}>
                                        {game.platform || 'Steam & Epic'}
                                    </span>
                                    <h3 style={{ margin: '12px 0 6px', fontSize: '1.2rem' }}>{game.title}</h3>
                                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.4' }}>{game.description}</p>
                                </div>
                                <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Expected:</span>
                                    <span style={{ color: '#10b981', fontWeight: 800, fontSize: '0.85rem' }}>
                                        {game.expectedRelease || 'Coming Soon'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}