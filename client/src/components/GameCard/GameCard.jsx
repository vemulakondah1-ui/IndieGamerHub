import { Link } from 'react-router-dom';
import StarRating from '../StarRating/StarRating';
import './GameCard.css';

const GENRE_COLORS = {
  Action: 'badge-primary', RPG: 'badge-cyan', Adventure: 'badge-green',
  Horror: 'badge-primary', Puzzle: 'badge-gold', Strategy: 'badge-cyan',
  Simulation: 'badge-green', Platformer: 'badge-primary',
};

function formatPrice(price, isFree) {
  if (isFree || price === 0) return 'Free';
  return `$${Number(price).toFixed(2)}`;
}

function formatDate(date) {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d)) return null;
  const now = new Date();
  if (d > now) return `Coming ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  return d.getFullYear();
}

export default function GameCard({ game, featured = false }) {
  const {
    _id, title, thumbnail, genre = [], avgRating, reviewCount,
    price, isFree, isFeatured, releaseDate, shortDescription,
    developerName,
  } = game;

  const primaryGenre = genre[0];
  const badgeClass = GENRE_COLORS[primaryGenre] || 'badge-primary';

  return (
    <Link to={`/games/${_id}`} className={`game-card card ${featured ? 'game-card--featured' : ''}`}>
      {/* Thumbnail */}
      <div className="game-card__thumb">
        {thumbnail ? (
          <img src={thumbnail} alt={title} loading="lazy" className="game-card__img" />
        ) : (
          <div className="game-card__no-thumb">
            <span>🎮</span>
          </div>
        )}
        {/* Overlays */}
        {isFeatured && <span className="game-card__featured-badge">⭐ Featured</span>}
        <div className="game-card__price-tag">
          <span className={formatPrice(price, isFree) === 'Free' ? 'price-free' : 'price-paid'}>
            {formatPrice(price, isFree)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="game-card__body">
        <div className="game-card__meta">
          {primaryGenre && <span className={`badge ${badgeClass}`}>{primaryGenre}</span>}
          {releaseDate && <span className="game-card__year">{formatDate(releaseDate)}</span>}
        </div>

        <h3 className="game-card__title">{title}</h3>

        {featured && shortDescription && (
          <p className="game-card__desc">{shortDescription}</p>
        )}

        {developerName && (
          <p className="game-card__developer">by {developerName}</p>
        )}

        <div className="game-card__footer">
          {avgRating > 0 ? (
            <div className="game-card__rating">
              <StarRating value={avgRating} readOnly size="sm" />
              <span className="rating-count">({reviewCount})</span>
            </div>
          ) : (
            <span className="no-reviews">No reviews yet</span>
          )}
        </div>
      </div>
    </Link>
  );
}
