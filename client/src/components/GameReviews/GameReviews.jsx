// client/src/components/GameReviews/GameReviews.jsx
import { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { reviewService } from '../../services';
import { AuthContext } from '../../context/AuthContext';
import ReviewCard from '../ReviewCard/ReviewCard';
import './GameReviews.css';

const RATING_DESCRIPTIONS = {
  5: '⭐⭐⭐⭐⭐ (5/5) — Masterpiece! Must Play',
  4: '⭐⭐⭐⭐☆ (4/5) — Great game, thoroughly enjoyed it',
  3: '⭐⭐⭐☆☆ (3/5) — Good / Average experience',
  2: '⭐⭐☆☆☆ (2/5) — Flawed, needs improvement',
  1: '⭐☆☆☆☆ (1/5) — Disappointing / Not recommended',
};

export default function GameReviews({ gameId, gameTitle = 'this game' }) {
  const authContext = useContext(AuthContext);
  const user = authContext?.user || null;
  const formRef = useRef(null);

  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ avgRating: 0, total: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
  const [myReview, setMyReview] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [isRecommended, setIsRecommended] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Filter state
  const [filterStar, setFilterStar] = useState('all');

  const fetchReviews = useCallback(async () => {
    if (!gameId) return;
    try {
      setLoading(true);
      const res = await reviewService.getGameReviews(gameId);
      const reviewList = res.data?.data || [];
      setReviews(reviewList);

      if (res.data?.summary) {
        setSummary(res.data.summary);
      } else {
        // Fallback calculate summary
        let sum = 0;
        const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviewList.forEach((r) => {
          sum += (r.rating || 0);
          const star = Math.min(5, Math.max(1, Math.round(r.rating || 0)));
          dist[star] = (dist[star] || 0) + 1;
        });
        const avg = reviewList.length > 0 ? Math.round((sum / reviewList.length) * 10) / 10 : 0;
        setSummary({ avgRating: avg, total: reviewList.length, distribution: dist });
      }
    } catch (err) {
      console.warn('Failed to fetch reviews:', err.message);
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  const fetchMyReview = useCallback(async () => {
    if (!gameId || !user) return;
    try {
      const res = await reviewService.getMyReview(gameId);
      if (res.data?.data) {
        const r = res.data.data;
        setMyReview(r);
        setRating(r.rating || 5);
        setTitle(r.title || '');
        setComment(r.body || '');
        setIsRecommended(r.isRecommended !== false);
      } else {
        setMyReview(null);
      }
    } catch (e) {
      // Ignore not found or unauthorized
    }
  }, [gameId, user]);

  useEffect(() => {
    fetchReviews();
    fetchMyReview();
  }, [fetchReviews, fetchMyReview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    if (!rating || rating < 1 || rating > 5) {
      setFormError('Please select a star rating between 1 and 5');
      return;
    }

    if (!comment.trim() || comment.trim().length < 3) {
      setFormError('Please write at least 3 characters for your review');
      return;
    }

    setSubmitting(true);
    setFormError('');
    setFormSuccess('');

    try {
      await reviewService.createReview(gameId, {
        rating: Number(rating),
        title: title.trim(),
        body: comment.trim(),
        isRecommended,
      });

      setFormSuccess(myReview ? '✅ Review updated successfully!' : '✅ Review published successfully!');
      setIsEditing(false);
      await fetchReviews();
      await fetchMyReview();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Delete this review? This action cannot be undone.')) return;
    try {
      await reviewService.deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      if (myReview?._id === reviewId) {
        setMyReview(null);
        setRating(5);
        setTitle('');
        setComment('');
        setIsEditing(false);
      }
      await fetchReviews();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete review');
    }
  };

  const handleStartEdit = () => {
    if (myReview) {
      setRating(myReview.rating || 5);
      setTitle(myReview.title || '');
      setComment(myReview.body || '');
      setIsRecommended(myReview.isRecommended !== false);
      setIsEditing(true);
      formRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Filter reviews
  const filteredReviews = reviews.filter((r) => {
    if (filterStar === 'all') return true;
    return Math.round(r.rating) === Number(filterStar);
  });

  const totalReviews = summary.total || reviews.length;
  const avgRating = summary.avgRating || 0;
  const currentDisplayedRating = hoverRating || rating;

  return (
    <section className="game-reviews-panel" id="community-reviews" aria-label="Community Reviews and Ratings">
      {/* Header */}
      <div className="game-reviews__header">
        <h2 className="game-reviews__title">
          <span>⭐</span> Community Reviews & Ratings
          <span className="game-reviews__count-badge">{totalReviews} {totalReviews === 1 ? 'Review' : 'Reviews'}</span>
        </h2>
      </div>

      {/* RATING SUMMARY & DISTRIBUTION BARS */}
      <div className="reviews-summary-grid">
        <div className="reviews-score-card">
          <div className="reviews-score-num">{avgRating > 0 ? avgRating.toFixed(1) : '—'}</div>
          <div className="reviews-score-max">out of 5.0</div>
          <div className="reviews-score-stars" aria-label={`Average rating: ${avgRating} out of 5 stars`}>
            {'★'.repeat(Math.round(avgRating || 0))}{'☆'.repeat(5 - Math.round(avgRating || 0))}
          </div>
          <p className="reviews-score-subtitle">
            {totalReviews > 0 ? `Based on ${totalReviews} community rating${totalReviews === 1 ? '' : 's'}` : 'No ratings yet'}
          </p>
        </div>

        <div className="reviews-bars">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = summary.distribution?.[star] || 0;
            const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
            const isActive = filterStar === String(star);

            return (
              <div
                key={star}
                className={`reviews-bar-row ${isActive ? 'active' : ''}`}
                onClick={() => setFilterStar(filterStar === String(star) ? 'all' : String(star))}
                title={`Filter by ${star} stars (${count} reviews)`}
              >
                <div className="reviews-bar-label">
                  <span>{star}</span>
                  <span style={{ color: '#fbbf24' }}>★</span>
                </div>
                <div className="reviews-bar-track">
                  <div className="reviews-bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="reviews-bar-count">{count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* WRITE / EDIT REVIEW FORM */}
      <div className="write-review-card" ref={formRef}>
        <div className="write-review-card__header">
          <h3 className="write-review-card__title">
            <span>✍️</span> {myReview && !isEditing ? 'Your Review' : myReview ? 'Edit Your Review' : 'Rate & Review This Game'}
          </h3>
          {user ? (
            <span className="write-review-user">Logged in as <strong>{user.username}</strong></span>
          ) : null}
        </div>

        {formSuccess && (
          <div className="reviews-alert-banner success">{formSuccess}</div>
        )}
        {formError && (
          <div className="reviews-alert-banner error">{formError}</div>
        )}

        {!user ? (
          <div className="reviews-login-card">
            <div className="reviews-login-text">
              <h4>Want to share your rating?</h4>
              <p>Sign in to give {gameTitle} your star rating and share your review with the community.</p>
            </div>
            <a href="/login" className="reviews-login-btn">
              Log In to Review ↗
            </a>
          </div>
        ) : myReview && !isEditing ? (
          <div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '12px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ color: '#fbbf24', fontSize: '1.2rem', fontWeight: 800 }}>
                  {'★'.repeat(myReview.rating)}{'☆'.repeat(5 - myReview.rating)} ({myReview.rating}/5)
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {myReview.isRecommended ? '👍 Recommended' : '👎 Not Recommended'}
                </span>
              </div>
              {myReview.title && <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 700 }}>{myReview.title}</h4>}
              <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{myReview.body}</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleStartEdit}>
                ✏️ Edit My Review
              </button>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(myReview._id)}>
                🗑️ Delete
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Interactive 5-Star Picker */}
            <div className="star-picker-container">
              <label className="star-picker-label" htmlFor="star-picker">
                Your Star Rating (Click to Select) *
              </label>
              <div className="star-picker-stars" id="star-picker" role="radiogroup" aria-label="Star Rating out of 5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-picker-btn ${star <= currentDisplayedRating ? 'active' : ''}`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    aria-label={`${star} star${star > 1 ? 's' : ''}`}
                  >
                    ★
                  </button>
                ))}
                <span className="star-picker-hint">
                  {RATING_DESCRIPTIONS[currentDisplayedRating] || 'Select stars'}
                </span>
              </div>
            </div>

            {/* Title (Headline) */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                Review Headline (Optional)
              </label>
              <input
                type="text"
                className="review-form-input"
                placeholder="e.g., Incredible art style, fluid combat, and memorable soundtrack!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
              />
            </div>

            {/* Comment Body */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                Your Review *
              </label>
              <textarea
                className="review-form-input review-form-textarea"
                rows={4}
                required
                placeholder="Write your honest impressions, gameplay experience, performance notes, or recommendations for other gamers..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={2000}
              />
            </div>

            {/* Recommendation Toggle */}
            <div className="review-recommend-toggle">
              <span>Would you recommend this game?</span>
              <button
                type="button"
                className={`recommend-choice-btn yes ${isRecommended ? 'selected' : ''}`}
                onClick={() => setIsRecommended(true)}
              >
                👍 Yes, Recommended
              </button>
              <button
                type="button"
                className={`recommend-choice-btn no ${!isRecommended ? 'selected' : ''}`}
                onClick={() => setIsRecommended(false)}
              >
                👎 No
              </button>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button type="submit" className="review-submit-btn" disabled={submitting}>
                {submitting ? 'Submitting Review...' : isEditing ? 'Update Review' : 'Publish Review'}
              </button>
              {isEditing && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* COMMUNITY REVIEWS FEED */}
      <div className="reviews-feed-header">
        <h3 className="reviews-feed-title">
          Community Feedback ({filteredReviews.length})
        </h3>
        {totalReviews > 0 && (
          <div className="reviews-filter-chips">
            <button
              type="button"
              className={`review-filter-chip ${filterStar === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStar('all')}
            >
              All ({totalReviews})
            </button>
            {[5, 4, 3, 2, 1].map((s) => {
              const cnt = summary.distribution?.[s] || 0;
              if (cnt === 0) return null;
              return (
                <button
                  key={s}
                  type="button"
                  className={`review-filter-chip ${filterStar === String(s) ? 'active' : ''}`}
                  onClick={() => setFilterStar(String(s))}
                >
                  {s} ★ ({cnt})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ margin: '0 auto 12px auto' }} />
          <p>Loading community reviews...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="reviews-empty-state">
          <div className="reviews-empty-icon">🎮</div>
          <h4 className="reviews-empty-title">
            {filterStar !== 'all' ? `No ${filterStar}-star reviews yet` : 'No community reviews yet'}
          </h4>
          <p className="reviews-empty-subtitle">
            {filterStar !== 'all'
              ? 'Try selecting a different filter above.'
              : `Be the first gamer to play and review ${gameTitle}!`}
          </p>
        </div>
      ) : (
        <div className="reviews-feed-list">
          {filteredReviews.map((rev) => (
            <ReviewCard
              key={rev._id}
              review={rev}
              onDelete={handleDelete}
              currentUserId={user?._id || user?.id}
            />
          ))}
        </div>
      )}
    </section>
  );
}
