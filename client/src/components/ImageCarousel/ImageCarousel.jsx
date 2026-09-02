import { useState, useEffect, useCallback } from 'react';
import './ImageCarousel.css';

export default function ImageCarousel({ images = [], title = '' }) {
  const [current, setCurrent] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const prev = useCallback(() => {
    setCurrent((c) => (c === 0 ? images.length - 1 : c - 1));
  }, [images.length]);

  const next = useCallback(() => {
    setCurrent((c) => (c === images.length - 1 ? 0 : c + 1));
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isFullscreen) return;
    const handler = (e) => {
      if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isFullscreen, prev, next]);

  if (!images.length) return null;

  const CarouselContent = ({ fullscreen }) => (
    <div className={`carousel ${fullscreen ? 'carousel--fullscreen' : ''}`}>
      {/* Main image */}
      <div className="carousel__main" onClick={() => !fullscreen && setIsFullscreen(true)}>
        <img
          src={images[current]}
          alt={`${title} screenshot ${current + 1}`}
          className="carousel__img"
          loading="lazy"
        />
        {!fullscreen && (
          <div className="carousel__expand-hint">🔍 Click to expand</div>
        )}
        {/* Arrows */}
        {images.length > 1 && (
          <>
            <button className="carousel__arrow carousel__arrow--prev" onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Previous">
              ‹
            </button>
            <button className="carousel__arrow carousel__arrow--next" onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Next">
              ›
            </button>
          </>
        )}
        {/* Counter */}
        <div className="carousel__counter">
          {current + 1} / {images.length}
        </div>
      </div>

      {/* Dots */}
      {images.length > 1 && (
        <div className="carousel__dots">
          {images.map((_, i) => (
            <button
              key={i}
              className={`carousel__dot ${i === current ? 'active' : ''}`}
              onClick={() => setCurrent(i)}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Thumbnails (desktop) */}
      {images.length > 1 && (
        <div className="carousel__thumbs">
          {images.map((img, i) => (
            <button
              key={i}
              className={`carousel__thumb ${i === current ? 'active' : ''}`}
              onClick={() => setCurrent(i)}
              aria-label={`Screenshot ${i + 1}`}
            >
              <img src={img} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {/* Close btn (fullscreen) */}
      {fullscreen && (
        <button className="carousel__close" onClick={() => setIsFullscreen(false)} aria-label="Close">✕</button>
      )}
    </div>
  );

  return (
    <>
      <CarouselContent fullscreen={false} />
      {isFullscreen && (
        <div className="carousel__overlay" onClick={() => setIsFullscreen(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <CarouselContent fullscreen={true} />
          </div>
        </div>
      )}
    </>
  );
}
