import { describe, it, expect } from 'vitest';
import { onImageError } from './imageFallback';

describe('onImageError', () => {
  it('returns a handler that swaps the target src for a placeholder of the given size', () => {
    const target = { src: 'broken.jpg' };
    onImageError(260, 140)({ target });
    expect(target.src).toBe('https://via.placeholder.com/260x140?text=No+Image');
  });

  it('uses the exact width/height passed in, not a fixed default (each call site keeps its own size)', () => {
    const target = { src: 'broken.jpg' };
    onImageError(280, 160)({ target });
    expect(target.src).toBe('https://via.placeholder.com/280x160?text=No+Image');
  });
});
