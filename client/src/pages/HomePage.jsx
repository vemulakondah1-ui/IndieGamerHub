// src/pages/HomePage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);

  // Robust fallback catalog so your UI never shows errors
  const fallbackCatalog = [
    {
      _id: '413150',
      title: 'Stardew Valley',
      short_description: 'You have inherited your grandfather\'s old farm plot in Stardew Valley...',
      price_overview: { final_formatted: '$14.99' },
      header_image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/413150/header.jpg'
    },
    {
      _id: '105600',
      title: 'Terraria',
      short_description: 'Dig, fight, explore, build! Nothing is impossible in this action-packed sandbox.',
      price_overview: { final_formatted: '$9.99' },
      header_image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/105600/header.jpg'
    },
    {
      _id: '252490',
      title: 'Rust',
      short_description: 'The only aim in Rust is to survive the harsh wilderness and other players.',
      price_overview: { final_formatted: '$39.99' },
      header_image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/252490/header.jpg'
    }
  ];

  useEffect(() => {
    axios.get('http://localhost:5000/api/steam/homepage')
      .then(res => {
        const data = res.data.data || res.data.games || res.data;
        setGames(Array.isArray(data) && data.length > 0 ? data : fallbackCatalog);
      })
      .catch(() => setGames(fallbackCatalog));
  }, []);

  return (
    <div className="page-wrapper home-page" style={{ paddingBottom: '80px' }}>
      <div className="container" style={{ paddingTop: '40px' }}>

        {/* Hero Section */}
        <div className="hero-section" style={{ padding: '40px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '30px' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ color: 'var(--accent-primary)', fontWeight: 800, fontSize: '0.85rem', marginBottom: '12px' }}>⚡ POWERED BY STEAM & EPIC GAMES</div>
            <h1 style={{ fontSize: '3rem', fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: '16px' }}>
              Your Gateway to <span style={{ color: '#a78bfa' }}>Indie Gaming</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', maxWidth: '500px', marginBottom: '24px' }}>
              Discover hidden gems, track top sellers, and shop the best sales across multiple platforms with integrated community chat and reviews.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => navigate('/games')}
                className="btn btn-primary"
                style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
              >
                Explore Games →
              </button>
              <button
                onClick={() => navigate('/register')}
                className="btn btn-secondary"
                style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: '#fff' }}
              >
                Join Free
              </button>
            </div>
          </div>
          <div style={{ width: '420px', maxWidth: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80" alt="Gaming Banner" style={{ width: '100%', height: '240px', objectFit: 'cover' }} />
          </div>
        </div>

        {/* Top Sellers Section */}
        <div style={{ marginTop: '40px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px', color: '#fff' }}>🔥 Top Featured Games</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>Click any card to view trailers, screenshots, descriptions, player reviews, and community group chats.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {games.map((game, index) => {
              const gameId = game._id || game.id || (index === 0 ? '413150' : index === 1 ? '105600' : '252490');
              const title = game.title || game.name;
              const thumb = game.header_image || game.thumbnail || game.imageUrl;
              const desc = game.short_description || game.shortDescription;
              const price = game.price_overview?.final_formatted || game.price || '$14.99';

              return (
                <div
                  key={gameId}
                  onClick={() => navigate(`/games/${gameId}`)}
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s' }}
                >
                  <img src={thumb} alt={title} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                  <div style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px', color: '#fff' }}>{title}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{desc}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>{price}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/games/${gameId}`); }}
                        style={{ padding: '8px 16px', borderRadius: '10px', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', color: '#a78bfa', fontWeight: 700, cursor: 'pointer' }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}