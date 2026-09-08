import StarRating from '../StarRating/StarRating';
import './ReviewCard.css';

function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ReviewCard({ review, onDelete, currentUserId }) {
  const { _id, user, rating, title, body, isRecommended, createdAt, isEdited } = review;
  const isOwner = currentUserId && user?._id === currentUserId;

  return (
    <div className="review-card">
      <div className="review-card__header">
        <div className="reviewer-info">
          <div className="reviewer-avatar">
            {user?.avatar
              ? <img src={user.avatar} alt={user.username} />
              : <span>{user?.username?.[0]?.toUpperCase() || '?'}</span>
            }
          </div>
          <div>
            <p className="reviewer-name">{user?.username || 'Anonymous'}</p>
            <p className="review-time">{timeAgo(createdAt)}{isEdited && ' · edited'}</p>
          </div>
        </div>

        <div className="review-card__right">
          <div className={`recommend-badge ${isRecommended ? 'recommended' : 'not-recommended'}`}>
            {isRecommended ? '👍 Recommended' : '👎 Not Recommended'}
          </div>
          {isOwner && (
            <button className="btn btn-danger btn-sm" onClick={() => onDelete?.(_id)}>
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="review-card__rating">
        <StarRating value={rating} readOnly size="sm" />
        <span className="review-rating-num">{rating}/5</span>
      </div>

      {title && <h4 className="review-title">{title}</h4>}
      <p className="review-body">{body}</p>
    </div>
  );
}
