import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SteamGamePage, { sanitizeStoreHtml } from './SteamGamePage';
import { steamService } from '../services';

const mockNavigate = vi.fn();
let mockAppId = '12345';

vi.mock('react-router-dom', () => ({
  useParams: () => ({ appId: mockAppId }),
  useNavigate: () => mockNavigate,
}));

vi.mock('../services', () => ({
  steamService: {
    getApp: vi.fn(),
    getAppReviews: vi.fn(),
  },
}));

describe('sanitizeStoreHtml (XSS fix)', () => {
  it('strips a quoted inline event handler', () => {
    const out = sanitizeStoreHtml('<img src=x onerror="alert(1)">');
    expect(out.toLowerCase()).not.toContain('onerror');
  });

  it('strips an UNQUOTED inline event handler — the exact bypass the old regex missed', () => {
    const out = sanitizeStoreHtml('<img src=x onerror=alert(1)>');
    expect(out.toLowerCase()).not.toContain('onerror');
  });

  it('keeps safe formatting tags so store descriptions still render nicely', () => {
    const out = sanitizeStoreHtml('<b>Bold</b><br><a href="https://example.com">link</a>');
    expect(out).toContain('<b>Bold</b>');
    expect(out).toContain('<br');
    expect(out).toContain('href="https://example.com"');
  });

  it('defaults to an empty string when called with no argument', () => {
    expect(sanitizeStoreHtml()).toBe('');
  });
});

describe('SteamGamePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAppId = '12345';
    window.scrollTo = vi.fn();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows a loading state before the fetch resolves', () => {
    steamService.getApp.mockReturnValue(new Promise(() => {}));
    steamService.getAppReviews.mockReturnValue(new Promise(() => {}));
    render(<SteamGamePage />);
    expect(screen.getByText('Loading Game Details...')).toBeInTheDocument();
  });

  it('renders rich nested Steam appdetails data (raw[appId].data shape) with sanitized description, media, and reviews', async () => {
    steamService.getApp.mockResolvedValue({
      data: {
        data: {
          '12345': {
            success: true,
            data: {
              name: 'Cyberpunk 2077',
              developers: ['CD Projekt Red'],
              publishers: ['CD Projekt'],
              release_date: { date: 'Dec 10, 2020' },
              about_the_game: '<p>Great game</p><img src=x onerror=alert(1)>',
              detailed_description: 'should not be used',
              short_description: 'should not be used either',
              genres: ['RPG', { description: 'Action' }, {}],
              is_free: false,
              price_overview: { final_formatted: '$29.99' },
              header_image: 'https://img.example/header.jpg',
              background_raw: 'https://img.example/bgraw.jpg',
              background: 'https://img.example/bg.jpg',
              movies: [
                { webm: { max: 'https://vid.example/1.webm' }, thumbnail: 'https://thumb.example/1.jpg' },
                { mp4: { max: 'https://vid.example/2.mp4' } },
                { webm: { '480': 'https://vid.example/3.webm' } },
                { mp4: {} },
              ],
              screenshots: [
                { path_full: 'https://ss.example/1.jpg', path_thumbnail: 'https://ss.example/1t.jpg' },
                { path_full: 'https://ss.example/2.jpg' },
              ],
            },
          },
        },
      },
    });
    steamService.getAppReviews.mockResolvedValue({
      data: {
        data: {
          query_summary: { total_reviews: 100, total_positive: 90 },
          reviews: [
            { recommendationid: 'r1', author: { steamid: '7656119800000001', playtime_forever: 120 }, voted_up: false, review: '  Great!  ' },
            {},
          ],
        },
      },
    });

    render(<SteamGamePage />);

    expect(await screen.findByText('Cyberpunk 2077')).toBeInTheDocument();
    expect(screen.getByText('RPG')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('CD Projekt Red')).toBeInTheDocument();
    expect(screen.getByText('CD Projekt')).toBeInTheDocument();
    expect(screen.getByText('Dec 10, 2020')).toBeInTheDocument();
    // Epic Games card: name matches the epic catalog and steamPrice isn't "Check on Steam"
    expect(screen.getByText('Epic Games Store')).toBeInTheDocument();
    const prices = screen.getAllByText('$29.99');
    expect(prices).toHaveLength(2); // Steam price + Epic price (same value, shown twice)

    // XSS payload embedded in about_the_game was stripped, but the safe <p> survived
    expect(screen.getByText('Great game').tagName).toBe('P');
    const aboutSection = screen.getByText('Great game').parentElement;
    expect(aboutSection.innerHTML.toLowerCase()).not.toContain('onerror');

    // Video is the first media item (movies pushed before screenshots)
    const video = document.querySelector('video');
    expect(video).toHaveAttribute('src', 'https://vid.example/1.webm');

    // Switch to a screenshot thumbnail (5th thumbnail: 3 real movies + 2 screenshots)
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'View screenshot 4' }));
    expect(screen.getByAltText('Screenshot')).toHaveAttribute('src', 'https://ss.example/1.jpg');
  });

  it('renders the raw.data (single-unwrapped) shape, detailed_description fallback, empty genres fallback, and epicPrice defaulting to $59.99', async () => {
    steamService.getApp.mockResolvedValue({
      data: { data: { data: { name: 'Elden Ring', detailed_description: 'Detailed desc here' } } },
    });
    steamService.getAppReviews.mockResolvedValue({ data: { data: {} } });

    render(<SteamGamePage />);

    expect(await screen.findByText('Elden Ring')).toBeInTheDocument();
    expect(screen.getByText('Detailed desc here')).toBeInTheDocument();
    // No genres provided -> fallback list
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('Adventure')).toBeInTheDocument();
    // No developers/publishers/release_date -> fallbacks
    expect(screen.getAllByText('Studio Partner').length).toBeGreaterThan(0);
    expect(screen.getByText('Available Now')).toBeInTheDocument();
    // No is_free / price_overview -> "Check on Steam", but name matches epic catalog -> epicPrice defaults to $59.99
    expect(screen.getByText('Check on Steam')).toBeInTheDocument();
    expect(screen.getByText('$59.99')).toBeInTheDocument();
  });

  it('renders the raw.name (flat) shape, short_description fallback, and is_free -> "Free to Play"', async () => {
    steamService.getApp.mockResolvedValue({
      data: { data: { name: 'Some Indie Game', short_description: 'Only short desc available', is_free: true } },
    });
    steamService.getAppReviews.mockResolvedValue({ data: { data: {} } });

    render(<SteamGamePage />);

    expect(await screen.findByText('Some Indie Game')).toBeInTheDocument();
    expect(screen.getByText('Only short desc available')).toBeInTheDocument();
    expect(screen.getByText('Free to Play')).toBeInTheDocument();
    // Not in the epic catalog -> no Epic card
    expect(screen.queryByText('Epic Games Store')).not.toBeInTheDocument();
  });

  it('falls back to "Game #<id>" and the default about text when liveData is a real (non-null) object missing name/description fields', async () => {
    // raw.data direct shape (single-unwrapped backend proxy), but with none of the fields
    // that name/about normally read from — distinct from the "liveData is null" fallback path.
    steamService.getApp.mockResolvedValue({
      data: { data: { data: { some_other_field: 'x' } } },
    });
    steamService.getAppReviews.mockResolvedValue({ data: { data: {} } });

    render(<SteamGamePage />);

    expect(await screen.findByText('Game #12345')).toBeInTheDocument();
    expect(screen.getByText('Detailed overview currently unavailable.')).toBeInTheDocument();
  });

  it('falls back to the hardcoded placeholder game when the backend proxy has no data at all', async () => {
    steamService.getApp.mockResolvedValue({ data: {} });
    steamService.getAppReviews.mockResolvedValue({ data: {} });

    render(<SteamGamePage />);

    expect(await screen.findByText('Game #12345')).toBeInTheDocument();
    expect(screen.getByText('$59.99')).toBeInTheDocument();
    expect(screen.getByText('Store page metadata is loading or rate-limited by Steam.')).toBeInTheDocument();
    expect(screen.queryByText('Epic Games Store')).not.toBeInTheDocument();
  });

  it('tolerates getApp/getAppReviews individually rejecting (their own .catch(() => null)) and still renders the fallback game', async () => {
    steamService.getApp.mockRejectedValue(new Error('app down'));
    steamService.getAppReviews.mockRejectedValue(new Error('reviews down'));

    render(<SteamGamePage />);

    expect(await screen.findByText('Game #12345')).toBeInTheDocument();
    // These are swallowed by the per-call .catch(() => null), not the outer try/catch
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('reaches the outer catch (console.warn) when the proxy call throws synchronously, and still renders the fallback', async () => {
    steamService.getApp.mockImplementation(() => { throw new Error('sync boom'); });
    steamService.getAppReviews.mockResolvedValue({ data: {} });

    render(<SteamGamePage />);

    await waitFor(() => expect(console.warn).toHaveBeenCalled());
    expect(await screen.findByText('Game #12345')).toBeInTheDocument();
  });

  it('falls back to game.media[0] when a stale activeMediaIndex no longer exists after navigating to a game with fewer media items', async () => {
    steamService.getApp.mockResolvedValue({
      data: {
        data: {
          data: {
            name: 'Game With Many Screenshots',
            screenshots: [
              { path_full: 'https://ss.example/a.jpg' },
              { path_full: 'https://ss.example/b.jpg' },
              { path_full: 'https://ss.example/c.jpg' },
            ],
          },
        },
      },
    });
    steamService.getAppReviews.mockResolvedValue({ data: { data: {} } });

    const { rerender } = render(<SteamGamePage />);
    expect(await screen.findByText('Game With Many Screenshots')).toBeInTheDocument();

    const user = userEvent.setup();
    // Select the last (3rd) thumbnail, pushing activeMediaIndex to 2
    await user.click(screen.getByRole('button', { name: 'View screenshot 3' }));
    expect(screen.getByAltText('Screenshot')).toHaveAttribute('src', 'https://ss.example/c.jpg');

    // Navigate to a different game with only one media item; activeMediaIndex (2) is now
    // stale and out of bounds for the new, shorter game.media array.
    mockAppId = '99999';
    steamService.getApp.mockResolvedValue({ data: {} }); // triggers the hardcoded fallback (1 image)
    steamService.getAppReviews.mockResolvedValue({ data: {} });
    rerender(<SteamGamePage />);

    expect(await screen.findByText('Game #99999')).toBeInTheDocument();
    // game.media[2] is undefined on the new game -> falls back to game.media[0]
    expect(screen.getByAltText('Screenshot')).toHaveAttribute(
      'src',
      'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/99999/header.jpg'
    );
  });

  it('navigates home when "Back to Games" is clicked', async () => {
    steamService.getApp.mockResolvedValue({ data: {} });
    steamService.getAppReviews.mockResolvedValue({ data: {} });

    render(<SteamGamePage />);
    await screen.findByText('Game #12345');

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /back to games/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
