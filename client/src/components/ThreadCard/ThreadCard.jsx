import { Link } from 'react-router-dom';
import './ThreadCard.css';

function timeAgo(date) {
  const diff = Date.now() - new Date(date);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes || 1}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function ThreadCard({ thread }) {
  const { _id, title, author, postCount, isPinned, isLocked, lastActivityAt, createdAt } = thread;
  return (
    <Link to={`/threads/${_id}`} className="thread-card">
      <div className="thread-card__icons">
        {isPinned && <span title="Pinned">📌</span>}
        {isLocked && <span title="Locked">🔒</span>}
        {!isPinned && !isLocked && <span className="thread-icon">💬</span>}
      </div>
      <div className="thread-card__main">
        <h4 className="thread-card__title">{title}</h4>
        <p className="thread-card__meta">
          by <strong>{author?.username || 'Unknown'}</strong> · {timeAgo(createdAt)}
        </p>
      </div>
      <div className="thread-card__stats">
        <span className="thread-stat">
          <span className="thread-stat__icon">💬</span>
          {postCount}
        </span>
        <span className="thread-stat__label">Last: {timeAgo(lastActivityAt)}</span>
      </div>
    </Link>
  );
}
