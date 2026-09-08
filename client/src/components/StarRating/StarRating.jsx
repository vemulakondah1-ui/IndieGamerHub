import './StarRating.css';

const SIZES = { sm: 14, md: 18, lg: 22 };

export default function StarRating({ value = 0, onChange, readOnly = false, size = 'md' }) {
  const starSize = SIZES[size] || 18;
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className={`star-rating star-rating--${size} ${readOnly ? 'readonly' : 'interactive'}`} role="group" aria-label="Star rating">
      {stars.map((star) => {
        const filled = star <= Math.round(value);
        const half = !filled && star - 0.5 <= value && value > 0;

        return (
          <button
            key={star}
            type="button"
            className={`star-btn ${filled ? 'filled' : half ? 'half' : 'empty'}`}
            style={{ fontSize: starSize }}
            onClick={() => !readOnly && onChange && onChange(star)}
            disabled={readOnly}
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
          >
            {filled ? '★' : half ? '⭑' : '☆'}
          </button>
        );
      })}
      {!readOnly && value > 0 && (
        <span className="rating-value">{Number(value).toFixed(1)}</span>
      )}
      {readOnly && value > 0 && size !== 'sm' && (
        <span className="rating-value-readonly">{Number(value).toFixed(1)}</span>
      )}
    </div>
  );
}
