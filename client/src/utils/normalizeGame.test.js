import { describe, it, expect } from 'vitest';
import { normalizeGame } from './normalizeGame';

describe('normalizeGame', () => {
  it('routes a Steam-sourced game (steamAppId) to /steam/:id, not by _id', () => {
    const norm = normalizeGame({ steamAppId: '1245620', _id: 'mongo-id-1', title: 'Elden Ring' });
    expect(norm.id).toBe('1245620');
    expect(norm.isSteamId).toBe(true);
    expect(norm.path).toBe('/steam/1245620');
  });

  it('routes a non-Steam game (empty steamAppId) to /games/:id via _id', () => {
    const norm = normalizeGame({ steamAppId: '', _id: 'mongo-id-1', title: 'Indie Game' });
    expect(norm.id).toBe('mongo-id-1');
    expect(norm.isSteamId).toBe(false);
    expect(norm.path).toBe('/games/mongo-id-1');
  });

  it('falls back to game.id then an index-based id when _id is absent', () => {
    expect(normalizeGame({ id: '588650', title: 'Dead Cells' }).id).toBe('588650');
    expect(normalizeGame({ title: 'No Id Game' }, 3).id).toBe('game-3');
  });

  it('formats a numeric price (Game model docs) to a dollar string', () => {
    expect(normalizeGame({ _id: '1', price: 0 }).price).toBe('$0.00');
    expect(normalizeGame({ _id: '1', price: 19.99 }).price).toBe('$19.99');
  });

  it('falls through pre-formatted/nested price sources for non-numeric price shapes', () => {
    expect(normalizeGame({ _id: '1', price: '$9.99' }).price).toBe('$9.99');
    expect(normalizeGame({ _id: '1', price_overview: { final_formatted: '$24.99' } }).price).toBe('$24.99');
    expect(normalizeGame({ _id: '1' }).price).toBe('$14.99');
  });

  it('defaults title, thumbnail, description, and platform when missing', () => {
    const norm = normalizeGame({ _id: '1' });
    expect(norm.title).toBe('Untitled Game');
    expect(norm.thumbnail).toBe('');
    expect(norm.description).toBe('No description available');
    expect(norm.platform).toBe('Steam');
  });
});
