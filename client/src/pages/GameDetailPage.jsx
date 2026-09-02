// src/pages/GameDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './GameDetailPage.css';

export default function GameDetailPage() {
  const { id } = useParams();
  const { user, isLoggedIn } = useAuth();
  const [game, setGame] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Dynamically fetches all live game data & reviews from your backend / Steam API
    axios.get(`http://localhost:5000/api/games/${id}`)
      .then(res => {
        if (res.data && res.data.data) {
          setGame(res.data.data);
        }
      })
      .catch(err => console.error('Failed to load live Steam game data:', err))
      .finally(() => setLoading(false));

    // Fetch live community group chat messages
    axios.get(`http://localhost:5000/api/games/${id}/chat`)
      .then(res => setChatMessages(res.data.data || []))
      .catch(() => setChatMessages([]));
  }, [id]);

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      const { data } = await axios.post(`http://localhost:5000/api/games/${id}/chat`, { content: newMessage }, { withCredentials: true });
      setChatMessages(prev => [...prev, data.data]);
      setNewMessage('');
    } catch {
      setChatMessages(prev => [...prev, { sender: { username: user?.username || 'You' }, content: newMessage, createdAt: new Date() }]);
      setNewMessage('');
    }
  };

  if (loading) return <div className="page-wrapper loading-center"><div className="spinner" /></div>;
  if (!game) return <div className="page-wrapper loading-center"><h2>Game data could not be retrieved from Steam.</h2></div>;

  return (
    <div className="page-wrapper game-detail-page" style={{ paddingBottom: '80px' }}>

      {/* Hero Header Banner */}
      <div className="game-hero" style={{ position: 'relative', height: '340px', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', marginBottom: '40px' }}>
        <img src={game.bannerUrl || game.thumbnail} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(8px) brightness(0.35)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--bg-primary, #0d0d0f) 0%, transparent 100%)' }} />
        <div className="container" style={{ position: 'relative', zIndex: 1, paddingBottom: '30px', width: '100%' }}>
          <nav className="breadcrumb" style={{ display: 'flex', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            <Link to="/">Home</Link><span>›</span><Link to="/games">Games</Link><span>›</span><span style={{ color: '#fff' }}>{game.title}</span>
          </nav>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>{game.title}</h1>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <span>Developer: <b style={{ color: '#fff' }}>{game.developer}</b></span>
            <span>⭐ <b style={{ color: '#f59e0b' }}>{game.rating}</b> ({game.reviewCount} reviews)</span>
          </div>
        </div>
      </div>

      <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '32px', alignItems: 'start' }}>

        {/* Main Content Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

          {/* Trailers & Screenshots Gallery */}
          <section>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '16px', color: '#fff' }}>🎬 Trailers & Screenshots</h2>
            {game.trailerUrl ? (
              <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)', background: '#000', marginBottom: '16px', aspectRatio: '16/9' }}>
                <video controls src={game.trailerUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : null}

            {game.screenshots && game.screenshots.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                {game.screenshots.slice(0, 4).map((imgSrc, idx) => (
                  <div key={idx} style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', height: '120px' }}>
                    <img src={imgSrc} alt="Screenshot" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* About The Game Description */}
          <section style={{ background: 'var(--bg-card)', padding: '28px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '16px', color: '#fff' }}>📖 About The Game</h2>
            <div style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '0.95rem' }} dangerouslySetInnerHTML={{ __html: game.description }} />
          </section>

          {/* Live Steam Player Reviews Section */}
          <section style={{ background: 'var(--bg-card)', padding: '28px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px', color: '#fff' }}>⭐ Live Steam Player Reviews</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {(game.reviews || []).map((rev, idx) => (
                <div key={idx} style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{rev.author}</span>
                    <span style={{ color: '#f59e0b', fontSize: '0.9rem' }}>{'⭐'.repeat(rev.rating)}</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>"{rev.comment}"</p>
                </div>
              ))}
            </div>
          </section>

          {/* Community Group Chat Widget */}
          <section style={{ background: 'var(--bg-card)', padding: '28px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px', color: '#fff' }}>💬 Community Group Chat</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>Chat live with other players discussing {game.title}.</p>

            <div style={{ height: '260px', overflowY: 'auto', background: 'var(--bg-surface)', padding: '16px', borderRadius: '14px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid var(--border-color)' }}>
              {chatMessages.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', margin: 'auto', textAlign: 'center' }}>No messages yet. Say hi to the community!</p>
              ) : (
                chatMessages.map((msg, index) => (
                  <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem', color: '#fff', flexShrink: 0 }}>
                      {msg.sender?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>{msg.sender?.username || 'Gamer'}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {isLoggedIn ? (
              <form onSubmit={handleSendChatMessage} style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Type a message to the group chat..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: '#fff', outline: 'none' }}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0 24px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>Send</button>
              </form>
            ) : (
              <p style={{ fontSize: '0.85rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>Sign in</Link> to participate in the community chat.
              </p>
            )}
          </section>

        </div>

        {/* Sidebar: Large Store Checkout Buttons */}
        <aside style={{ position: 'sticky', top: '24px' }}>
          <div style={{ background: 'var(--bg-card)', padding: '28px', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px' }}>Store Checkout & Pricing</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              <div style={{ background: 'var(--bg-surface)', padding: '18px', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>Steam Store</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#60a5fa' }}>${game.prices?.steam || '14.99'}</span>
                </div>
                <a
                  href={game.storeLinks?.steam || 'https://store.steampowered.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block', textAlign: 'center', padding: '14px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff',
                    fontWeight: 800, fontSize: '1rem', textDecoration: 'none',
                    boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4)'
                  }}
                >
                  Buy Now on Steam →
                </a>
              </div>

              <div style={{ background: 'var(--bg-surface)', padding: '18px', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>Epic Games Store</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#86efac' }}>${game.prices?.epic || '14.99'}</span>
                </div>
                <a
                  href={game.storeLinks?.epic || 'https://store.epicgames.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block', textAlign: 'center', padding: '14px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, #374151, #1f2937)', color: '#fff',
                    fontWeight: 800, fontSize: '1rem', textDecoration: 'none',
                    border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)'
                  }}
                >
                  Buy Now on Epic →
                </a>
              </div>

            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}