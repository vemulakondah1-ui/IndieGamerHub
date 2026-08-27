import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactPlayer from 'react-player';
import ImageCarousel from '../components/ImageCarousel/ImageCarousel';
import StarRating from '../components/StarRating/StarRating';
import ReviewCard from '../components/ReviewCard/ReviewCard';
import { gameService, reviewService } from '../services';
import { useAuth } from '../context/AuthContext';
import './GameDetailPage.css';

function StoreButton({ url, platform }) {
  const icons = { steam: '🎮', epic: '🔵', itch: '🕹️', gog: '🔴' };
  const labels = { steam: 'Steam', epic: 'Epic Games', itch: 'Itch.io', gog: 'GOG' };
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={`store-btn store-btn--${platform}`}>
      <span>{icons[platform]}</span>
      <span>Buy on {labels[platform]}</span>
      <span className="store-btn__arrow">↗</span>
    </a>
  );
}

export default function GameDetailPage() {
  const { id } = useParams();
  const { user, isLoggedIn } = useAuth();
  const [game, setGame] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ rating: 0, title: '', body: '', isRecommended: true });
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);

    const fetches = [gameService.getGame(id), reviewService.getGameReviews(id)];
    if (isLoggedIn) fetches.push(reviewService.getMyReview(id));

    Promise.all(fetches)
      .then(([gameRes, reviewsRes, myRes]) => {
        setGame(gameRes.data.data);
        setReviews(reviewsRes.data.data || []);
        if (myRes) setMyReview(myRes.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, isLoggedIn]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.rating) { setReviewError('Please select a star rating'); return; }
    if (reviewForm.body.length < 10) { setReviewError('Review must be at least 10 characters'); return; }

    setSubmitting(true);
    setReviewError('');
    try {
      const { data } = await reviewService.createReview(id, reviewForm);
      setReviews((prev) => [data.data, ...prev]);
      setMyReview(data.data);
      setGame((g) => ({ ...g, reviewCount: (g.reviewCount || 0) + 1 }));
      setReviewForm({ rating: 0, title: '', body: '', isRecommended: true });
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Delete your review?')) return;
    try {
      await reviewService.deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      setMyReview(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete review');
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="container" style={{ paddingTop: 'calc(var(--nav-height) + 40px)' }}>
          <div className="skeleton" style={{ height: '60px', width: '60%', marginBottom: '20px' }} />
          <div className="skeleton" style={{ aspectRatio: '16/9', marginBottom: '20px' }} />
          <div className="skeleton" style={{ height: '200px' }} />
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="page-wrapper loading-center">
        <div className="text-center">
          <h2>Game not found</h2>
          <Link to="/games" className="btn btn-primary mt-md">Back to Games</Link>
        </div>
      </div>
    );
  }

  const hasStoreLinks = Object.values(game.storeLinks || {}).some(Boolean);

  return (
    <div className="page-wrapper">
      {/* Hero Banner */}
      <div className="game-hero">
        {game.thumbnail && (
          <img src={game.thumbnail} alt="" className="game-hero__bg" />
        )}
        <div className="game-hero__overlay" />
        <div className="container game-hero__content">
          <nav className="breadcrumb">
            <Link to="/">Home</Link>
            <span>›</span>
            <Link to="/games">Games</Link>
            <span>›</span>
            <span>{game.title}</span>
          </nav>
          <div className="game-hero__info">
            <div className="game-hero__badges">
              {game.isFeatured && <span className="badge badge-gold">⭐ Featured</span>}
              {game.genre?.map((g) => (
                <span key={g} className="badge badge-primary">{g}</span>
              ))}
            </div>
            <h1 className="game-hero__title">{game.title}</h1>
            <p className="game-hero__developer">
              by <strong>{game.developer?.username || game.developerName}</strong>
            </p>
            {game.avgRating > 0 && (
              <div className="game-hero__rating">
                <StarRating value={game.avgRating} readOnly size="md" />
                <span className="game-hero__review-count">{game.reviewCount} reviews</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container game-detail-layout">
        {/* Main Content */}
        <main className="game-detail__main">
          {/* Screenshots */}
          {game.screenshots?.length > 0 && (
            <section className="game-section">
              <h2 className="game-section__title">Screenshots</h2>
              <ImageCarousel images={game.screenshots} title={game.title} />
            </section>
          )}

          {/* Trailer */}
          {game.trailerUrl && (
            <section className="game-section">
              <h2 className="game-section__title">Trailer</h2>
              <div className="video-wrapper">
                <ReactPlayer
                  url={game.trailerUrl}
                  width="100%"
                  height="100%"
                  controls
                  light={game.thumbnail || true}
                  className="react-player"
                />
              </div>
            </section>
          )}

          {/* Description */}
          <section className="game-section">
            <h2 className="game-section__title">About</h2>
            <div className="game-description" dangerouslySetInnerHTML={{ __html: game.description.replace(/\n/g, '<br />') }} />
          </section>

          {/* Reviews */}
          <section className="game-section" id="reviews">
            <div className="section-header">
              <h2 className="game-section__title">Reviews</h2>
              {game.avgRating > 0 && (
                <div className="reviews-summary">
                  <span className="reviews-avg">{game.avgRating.toFixed(1)}</span>
                  <StarRating value={game.avgRating} readOnly size="md" />
                  <span className="text-muted text-sm">({game.reviewCount})</span>
                </div>
              )}
            </div>

            {/* Write Review */}
            {isLoggedIn && !myReview && game.developer?._id !== user?._id && (
              <div className="review-form-wrapper">
                <h3 className="review-form__title">Write a Review</h3>
                <form onSubmit={handleSubmitReview} className="review-form">
                  <div className="form-group">
                    <label className="form-label">Your Rating *</label>
                    <StarRating
                      value={reviewForm.rating}
                      onChange={(v) => setReviewForm((f) => ({ ...f, rating: v }))}
                      size="lg"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Review Title</label>
                    <input
                      className="form-input"
                      placeholder="Summarize your experience..."
                      value={reviewForm.title}
                      onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Review *</label>
                    <textarea
                      className="form-input form-textarea"
                      placeholder="Share your thoughts about this game..."
                      value={reviewForm.body}
                      onChange={(e) => setReviewForm((f) => ({ ...f, body: e.target.value }))}
                      rows={4}
                    />
                  </div>
                  <div className="review-recommend">
                    <label className="recommend-label">
                      <input
                        type="checkbox"
                        checked={reviewForm.isRecommended}
                        onChange={(e) => setReviewForm((f) => ({ ...f, isRecommended: e.target.checked }))}
                      />
                      <span>👍 I recommend this game</span>
                    </label>
                  </div>
                  {reviewError && <div className="alert alert-error">{reviewError}</div>}
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              </div>
            )}

            {!isLoggedIn && (
              <div className="alert alert-info">
                <Link to="/login" className="font-bold">Sign in</Link> to write a review
              </div>
            )}

            {myReview && (
              <div className="alert alert-success mb-md">You've already reviewed this game.</div>
            )}

            {/* Review List */}
            <div className="reviews-list">
              {reviews.length === 0 ? (
                <p className="text-muted">No reviews yet. Be the first!</p>
              ) : (
                reviews.map((r) => (
                  <ReviewCard
                    key={r._id}
                    review={r}
                    currentUserId={user?._id}
                    onDelete={handleDeleteReview}
                  />
                ))
              )}
            </div>
          </section>

          {/* Forum Link */}
          <section className="game-section">
            <div className="forum-cta">
              <div>
                <h3>💬 Community Forum</h3>
                <p className="text-muted text-sm">Discuss this game with other players</p>
              </div>
              <Link to={`/games/${id}/forum`} className="btn btn-outline">View Forum →</Link>
            </div>
          </section>
        </main>

        {/* Sidebar */}
        <aside className="game-detail__sidebar">
          {/* Thumbnail */}
          {game.thumbnail && (
            <div className="sidebar-thumb">
              <img src={game.thumbnail} alt={game.title} />
            </div>
          )}

          {/* Buy Buttons */}
          {hasStoreLinks && (
            <div className="sidebar-card">
              <div className="sidebar-price">
                {game.isFree ? (
                  <span className="price-tag free">Free to Play</span>
                ) : game.price > 0 ? (
                  <span className="price-tag paid">${Number(game.price).toFixed(2)}</span>
                ) : null}
              </div>
              <div className="store-buttons">
                <StoreButton url={game.storeLinks?.steam} platform="steam" />
                <StoreButton url={game.storeLinks?.epic} platform="epic" />
                <StoreButton url={game.storeLinks?.itch} platform="itch" />
                <StoreButton url={game.storeLinks?.gog} platform="gog" />
              </div>
            </div>
          )}

          {/* Game Info */}
          <div className="sidebar-card">
            <h4 className="sidebar-card__title">Game Info</h4>
            <div className="game-info-list">
              {game.releaseDate && (
                <div className="game-info-row">
                  <span className="info-label">Release Date</span>
                  <span>{new Date(game.releaseDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
              )}
              {game.platform?.length > 0 && (
                <div className="game-info-row">
                  <span className="info-label">Platform</span>
                  <span>{game.platform.join(', ')}</span>
                </div>
              )}
              {game.genre?.length > 0 && (
                <div className="game-info-row">
                  <span className="info-label">Genre</span>
                  <span>{game.genre.join(', ')}</span>
                </div>
              )}
              {game.developer && (
                <div className="game-info-row">
                  <span className="info-label">Developer</span>
                  <span>{game.developer?.username || game.developerName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {game.tags?.length > 0 && (
            <div className="sidebar-card">
              <h4 className="sidebar-card__title">Tags</h4>
              <div className="tags-list">
                {game.tags.map((tag) => (
                  <Link key={tag} to={`/games?search=${tag}`} className="tag-chip">{tag}</Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
