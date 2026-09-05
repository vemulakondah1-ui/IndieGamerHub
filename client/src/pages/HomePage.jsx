// src/pages/HomePage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);

  // Route numeric Steam App IDs to the rich SteamGamePage; others go to generic detail
  const goToGame = (id) => {
    const isSteamId = /^\d+$/.test(String(id));
    navigate(isSteamId ? `/steam/${id}` : `/games/${id}`);
  };
  const [selectedGenre, setSelectedGenre] = useState('All');

  // Curated blockbusters with accurate official imagery
  const blockbusterCatalog = [
    { _id: '2358720', title: 'Black Myth: Wukong', platform: 'Steam', developer: 'Game Science', price: '$59.99', thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2358720/header.jpg', section: 'featured' },
    { _id: '1245620', title: 'Elden Ring', platform: 'Steam', developer: 'FromSoftware', price: '$59.99', thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1245620/header.jpg', section: 'featured' },
    { _id: 'minecraft', title: 'Minecraft', platform: 'Epic Games / Multi', developer: 'Mojang Studios', price: '$29.99', thumbnail: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80', section: 'featured' },
    { _id: 'gta-6', title: 'Grand Theft Auto VI', platform: 'Rockstar / Epic', developer: 'Rockstar Games', price: '$69.99', thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80', section: 'featured' },
    { _id: '413150', title: 'Stardew Valley', platform: 'Steam', developer: 'ConcernedApe', price: '$14.99', thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/413150/header.jpg', section: 'topseller' },
    { _id: '105600', title: 'Terraria', platform: 'Steam', developer: 'Re-Logic', price: '$9.99', thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/105600/header.jpg', section: 'topseller' },
    { _id: '252490', title: 'Rust', platform: 'Steam', developer: 'Facepunch Studios', price: '$39.99', thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/252490/header.jpg', section: 'topseller' },
    { _id: '1501750', title: 'Lords of the Fallen', platform: 'Steam', developer: 'HexWorks', price: '$49.99', thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1501750/header.jpg', section: 'discovery' },
    { _id: 'wow', title: 'World of Warcraft', platform: 'Battle.net', developer: 'Blizzard Entertainment', price: '$49.99', thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80', section: 'discovery' },
    { _id: 'pragmata', title: 'Pragmata', platform: 'Capcom', developer: 'Capcom', price: '$59.99', thumbnail: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=600&q=80', section: 'discovery' }
  ];

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/games');
        if (res.data && res.data.data) {
          setGames([...blockbusterCatalog, ...res.data.data]);
        } else {
          setGames(blockbusterCatalog);
        }
      } catch (err) {
        setGames(blockbusterCatalog);
      }
    };
    fetchGames();
  }, []);

  const genres = ['All', 'Action', 'Adventure', 'RPG', 'Strategy', 'Simulation', 'Indie'];

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
          gap: '30px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ maxWidth: '550px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '16px' }}>
              ⚡ POWERED BY STEAM & EPIC
            </div>
            <h1 style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1.1, margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>
              Your Gateway to <span style={{ color: '#a78bfa' }}>Indie & Blockbuster</span> Gaming
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.6', margin: '0 0 24px 0' }}>
              Discover hidden gems, track top sellers, and shop the best sales—all powered by real store data updated every 5 minutes.
            </p>
            <button onClick={() => window.scrollTo({ top: 600, behavior: 'smooth' })} style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 700, background: '#7c3aed', border: 'none', color: '#fff', cursor: 'pointer' }}>
              Explore Games →
            </button>
          </div>

          <div style={{ flex: '1', minWidth: '300px', maxWidth: '420px', height: '240px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            <img src="https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2358720/header.jpg" alt="Featured Promo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: '50px' }}>

        {/* TOP SELLERS ON STEAM */}
        <div style={{ marginBottom: '50px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 4px 0' }}>🔥 Top Sellers on Steam</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>Best-selling games right now — updated live from Steam.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {blockbusterCatalog.filter(g => g.section === 'topseller').map((game) => (
              <div
                key={game._id}
                onClick={() => goToGame(game._id)}
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ height: '150px', background: '#000' }}>
                  <img src={game.thumbnail} alt={game.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '16px' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 6px 0' }}>{game.title}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>{game.developer}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, color: '#10b981' }}>{game.price}</span>
                    <button style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                      Buy on Steam
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FEATURED BLOCKBUSTERS */}
        <div style={{ marginBottom: '50px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '20px' }}>⭐ Featured Blockbusters</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            {blockbusterCatalog.filter(g => g.section === 'featured').map((game) => (
              <div
                key={game._id}
                onClick={() => goToGame(game._id)}
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer' }}
              >
                <div style={{ height: '130px', background: '#000' }}>
                  <img src={game.thumbnail} alt={game.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '16px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#a78bfa', fontWeight: 700, textTransform: 'uppercase' }}>{game.platform}</span>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: '4px 0 8px 0' }}>{game.title}</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{game.price}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>View Details →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DISCOVERY CATALOG */}
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '20px' }}>🎮 Discovery Catalog</h2>

          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '24px' }}>
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                style={{
                  background: selectedGenre === genre ? '#7c3aed' : 'var(--bg-card)',
                  color: '#fff',
                  border: '1px solid var(--border-color)',
                  padding: '8px 18px',
                  borderRadius: '20px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {genre}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
            {games.map((item, idx) => (
              <div
                key={item._id || idx}
                onClick={() => goToGame(item._id)}
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ height: '150px', background: '#000' }}>
                  <img src={item.thumbnail} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '16px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{item.platform || 'Steam'}</span>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '4px 0 6px 0' }}>{item.title}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>{item.developer || 'Studio Partner'}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, color: '#10b981' }}>{item.price || '$19.99'}</span>
                    <span style={{ fontSize: '0.8rem', color: '#a78bfa', fontWeight: 700 }}>View Details</span>
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