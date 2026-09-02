import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import StarRating from '../StarRating/StarRating';
import './FeaturedCarousel.css';

export default function FeaturedCarousel({ games = [] }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (paused || games.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % games.length);
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, [paused, games.length]);

  if (!games.length) return null;

  const game = games[current];

  const prev = () => setCurrent((c) => (c === 0 ? games.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c + 1) % games.length);

  const getStoreUrl = (g) => g.storeLinks?.steam || g.storeLinks?.itch || g.storeLinks?.epic || null;

  return (
    <div
      className="featured-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background */}
      <div className="fc__bg">
        {game.thumbnail && (
          <img src={game.thumbnail} alt="" className="fc__bg-img" key={game._id} />
        )}
        <div className="fc__bg-overlay" />
      </div>

      {/* Content */}
      <div className="fc__content container">
        <div className="fc__info animate-fade-in" key={game._id}>
          <div className="fc__meta">
            <span className="badge badge-gold">⭐ Featured</span>
            {game.genre?.[0] && <span className="badge badge-cyan">{game.genre[0]}</span>}
          </div>
          <h2 className="fc__title">{game.title}</h2>
          {game.shortDescription && (
            <p className="fc__desc">{game.shortDescription}</p>
          )}
          {game.avgRating > 0 && (
            <div className="fc__rating">
              <StarRating value={game.avgRating} readOnly size="md" />
              <span className="fc__review-count">{game.reviewCount} reviews</span>
            </div>
          )}
          <div className="fc__actions">
            <Link to={`/games/${game._id}`} className="btn btn-primary btn-lg">
              View Game
            </Link>
            {getStoreUrl(game) && (
              <a href={getStoreUrl(game)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-lg">
                Buy Now ↗
              </a>
            )}
          </div>
        </div>

        <div className="fc__thumb-wrap">
          <Link to={`/games/${game._id}`}>
            <img src={game.thumbnail} alt={game.title} className="fc__thumb" />
          </Link>
        </div>
      </div>

      {/* Navigation */}
      {games.length > 1 && (
        <>
          <button className="fc__arrow fc__arrow--prev" onClick={prev} aria-label="Previous">‹</button>
          <button className="fc__arrow fc__arrow--next" onClick={next} aria-label="Next">›</button>
          <div className="fc__indicators">
            {games.map((_, i) => (
              <button
                key={i}
                className={`fc__indicator ${i === current ? 'active' : ''}`}
                onClick={() => setCurrent(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
