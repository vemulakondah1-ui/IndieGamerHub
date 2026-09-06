// src/pages/HomePage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();
  const [featuredGames, setFeaturedGames] = useState([]);

  const goToGame = (id) => {
    const isSteamId = /^\d+$/.test(String(id));
    navigate(isSteamId ? `/steam/${id}` : `/games/${id}`);
  };

  const defaultFeatured = [
    { _id: '2358720', title: 'Black Myth: Wukong', platform: 'Steam', developer: 'Game Science', price: '$59.99', thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2358720/header.jpg' },
    { _id: '1245620', title: 'Elden Ring', platform: 'Steam', developer: 'FromSoftware', price: '$59.99', thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1245620/header.jpg' },
    { _id: '413150', title: 'Stardew Valley', platform: 'Steam', developer: 'ConcernedApe', price: '$14.99', thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/413150/header.jpg' },
    { _id: '105600', title: 'Terraria', platform: 'Steam', developer: 'Re-Logic', price: '$9.99', thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/105600/header.jpg' }
  ];

  useEffect(() => {
    axios.get('http://localhost:5000/api/games/featured')
      .then(res => {
        const fetched = res.data?.data || res.data?.games || [];
        setFeaturedGames(fetched.length > 0 ? fetched : defaultFeatured);
      })
      .catch(() => setFeaturedGames(defaultFeatured));
  }, []);

  return (
    <div className="page-wrapper home-page" style={{ backgroundColor: 'var(--bg-main)', color: '#fff', minHeight: '100vh', paddingBottom: '80px' }}>

      {/* HERO BANNER SECTION */}
      <div className="container" style={{ paddingTop: '40px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #18122B 0%, #111019 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '24px',
          padding: '40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '30px'
        }}>
          <div style={{ maxWidth: '550px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '16px' }}>
              ⚡ POWERED BY STEAM & EPIC
            </div>
            <h1 style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1.1, margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>
              Your Gateway to <span style={{ color: '#a78bfa' }}>Indie & Blockbuster</span> Gaming
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.6', margin: '0 0 24px 0' }}>
              Discover hidden gems, track top sellers, and shop the best sales—all powered by real store data updated live.
            </p>
            <button onClick={() => window.scrollTo({ top: 400, behavior: 'smooth' })} style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 700, background: '#7c3aed', border: 'none', color: '#fff', cursor: 'pointer' }}>
              Explore Games →
            </button>
          </div>

          <div style={{ flex: '1', minWidth: '300px', maxWidth: '420px', height: '240px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            <img src="https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2358720/header.jpg" alt="Featured Promo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>
      </div>

      {/* FEATURED BLOCKBUSTERS */}
      <div className="container" style={{ marginTop: '50px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ★ Featured Blockbusters
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
            {featuredGames.map((game) => (
              <div
                key={game._id}
                onClick={() => goToGame(game.steamAppId || game._id)}
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ height: '140px', background: '#000' }}>
                  <img src={game.thumbnail} alt={game.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '16px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#a78bfa', fontWeight: 700, textTransform: 'uppercase' }}>{game.platform || 'Steam'}</span>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '4px 0 8px 0' }}>{game.title}</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, color: '#10b981' }}>{typeof game.price === 'number' ? `$${game.price.toFixed(2)}` : game.price}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>View Details →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}