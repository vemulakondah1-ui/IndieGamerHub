import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminPanel from './AdminPanel';
import { adminService } from '../services';

vi.mock('../services', () => ({
  adminService: {
    getStats: vi.fn(),
    getGames: vi.fn(),
    toggleFeatured: vi.fn(),
    togglePublished: vi.fn(),
    getUsers: vi.fn(),
    updateUserRole: vi.fn(),
    toggleUserStatus: vi.fn(),
    featureSteamGame: vi.fn(),
  },
}));

// Doesn't collide with the u1/u2 test fixtures, so existing role/status tests act on a different user, not themselves.
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { _id: 'current-admin', username: 'currentAdmin' } }),
}));

const sampleGames = [
  { _id: 'g1', title: 'Hollow Knight', developer: { username: 'TeamCherry' }, avgRating: 4.567, reviewCount: 10, isFeatured: true, isPublished: true, thumbnail: 'hk.jpg' },
  { _id: 'g2', title: 'Celeste', isFeatured: false, isPublished: false, thumbnail: '' },
];

const sampleUsers = [
  { _id: 'u1', username: 'alice', email: 'alice@example.com', role: 'gamer', isActive: true, createdAt: '2024-01-15T00:00:00.000Z' },
  { _id: 'u2', username: 'bob', email: 'bob@example.com', role: 'admin', isActive: false },
];

describe('AdminPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    adminService.getStats.mockResolvedValue({ data: { data: { totalGames: 3, totalUsers: 7, totalReviews: 12 } } });
    adminService.getGames.mockResolvedValue({ data: { data: sampleGames } });
    adminService.getUsers.mockResolvedValue({ data: { data: sampleUsers } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads overview stats and shows real totalGames of 0 instead of falling back to featuredGames.length (nullish, not falsy-zero, bug)', async () => {
    adminService.getStats.mockResolvedValue({ data: { data: { totalGames: 0, totalUsers: 5, totalReviews: 0 } } });
    adminService.getGames.mockResolvedValue({
      data: { data: [
        { _id: '1', title: 'Game A', thumbnail: 'a.jpg', price: 9.99, isFeatured: true },
        { _id: '2', title: 'Game B', thumbnail: 'b.jpg', price: 19.99, isFeatured: true },
      ] },
    });

    render(<AdminPanel />);

    await waitFor(() => expect(screen.getByText('Game A')).toBeInTheDocument());

    const totalGamesCard = screen.getByText('Total Games').parentElement;
    // totalGames is genuinely 0 here; if the code used `||` instead of `??` it would
    // wrongly fall back to featuredGames.length (2). Assert it renders 0.
    expect(within(totalGamesCard).getByText('0')).toBeInTheDocument();
    expect(screen.getByText('Active Featured Games (2)')).toBeInTheDocument();
    expect(screen.getByText('$9.99')).toBeInTheDocument();
  });

  it('falls back to featuredGames.length / 1 / 0 when stats fields are genuinely missing (nullish)', async () => {
    adminService.getStats.mockResolvedValue({ data: { data: {} } });
    adminService.getGames.mockResolvedValue({ data: { data: [{ _id: '1', title: 'Only Featured', thumbnail: 'a.jpg', isFeatured: true }] } });

    render(<AdminPanel />);

    await waitFor(() => expect(screen.getByText('Only Featured')).toBeInTheDocument());

    const totalGamesCard = screen.getByText('Total Games').parentElement;
    // stats.totalGames is undefined -> falls back to featuredGames.length (1)
    expect(within(totalGamesCard).getByText('1')).toBeInTheDocument();

    const totalUsersCard = screen.getByText('Total Users').parentElement;
    expect(within(totalUsersCard).getByText('1')).toBeInTheDocument(); // stats.totalUsers ?? 1

    const totalReviewsCard = screen.getByText('Total Reviews').parentElement;
    expect(within(totalReviewsCard).getByText('0')).toBeInTheDocument(); // stats.totalReviews ?? 0
  });

  it('derives the Featured Games count from games.filter(isFeatured), not a separately-fetched list', async () => {
    adminService.getGames.mockResolvedValue({
      data: { data: [
        { _id: '1', title: 'Featured One', thumbnail: 'a.jpg', isFeatured: true },
        { _id: '2', title: 'Not Featured', thumbnail: 'b.jpg', isFeatured: false },
      ] },
    });

    render(<AdminPanel />);

    await waitFor(() => expect(screen.getByText('Featured One')).toBeInTheDocument());
    expect(screen.queryByText('Not Featured')).not.toBeInTheDocument();

    const featuredCard = screen.getByText('Featured Games').parentElement;
    expect(within(featuredCard).getByText('1')).toBeInTheDocument();
  });

  it('handles unfeatured price defaulting to 0.00 and image onError swap, and removes a featured game without refetching or touching other games', async () => {
    adminService.getGames.mockResolvedValue({
      data: {
        data: [
          { _id: 'f1', title: 'No Price Game', thumbnail: 'x.jpg', isFeatured: true },
          { _id: 'f2', title: 'Other Featured Game', thumbnail: 'y.jpg', isFeatured: true, price: 19.99 },
        ],
      },
    });

    render(<AdminPanel />);

    await waitFor(() => expect(screen.getByText('No Price Game')).toBeInTheDocument());
    expect(screen.getByText('$0.00')).toBeInTheDocument();

    const img = screen.getByAltText('No Price Game');
    fireEvent.error(img);
    expect(img.src).toContain('via.placeholder.com/260x130');

    const user = userEvent.setup();
    const unfeatureButtons = screen.getAllByRole('button', { name: /unfeature game/i });
    await user.click(unfeatureButtons[0]);

    await waitFor(() => expect(adminService.toggleFeatured).toHaveBeenCalledWith('f1'));
    // Overview derives featuredGames from `games`, so removing patches local
    // state directly instead of re-fetching (no second loadData()) — and only
    // the removed game's isFeatured flips; the other game is untouched.
    expect(screen.queryByText('No Price Game')).not.toBeInTheDocument();
    expect(screen.getByText('Other Featured Game')).toBeInTheDocument();
    expect(adminService.getStats).toHaveBeenCalledTimes(1);
    expect(adminService.getGames).toHaveBeenCalledTimes(1);
  });

  it('logs an error (but does not crash) when removing a featured game fails', async () => {
    adminService.getGames.mockResolvedValue({ data: { data: [{ _id: 'f1', title: 'Broken Remove', thumbnail: 'x.jpg', isFeatured: true }] } });
    adminService.toggleFeatured.mockRejectedValueOnce(new Error('network down'));

    render(<AdminPanel />);
    await waitFor(() => expect(screen.getByText('Broken Remove')).toBeInTheDocument());

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /unfeature game/i }));

    await waitFor(() => expect(console.error).toHaveBeenCalled());
    // Failed removal leaves the card in place (no optimistic patch happened).
    expect(screen.getByText('Broken Remove')).toBeInTheDocument();
  });

  it('shows an empty state when there are no featured games', async () => {
    adminService.getGames.mockResolvedValue({ data: { data: [{ _id: 'g2', title: 'Celeste', isFeatured: false, isPublished: false, thumbnail: '' }] } });
    render(<AdminPanel />);
    await waitFor(() => expect(screen.getByText(/no games are currently featured/i)).toBeInTheDocument());
  });

  it('tolerates getStats/getGames individually rejecting (their own .catch(() => null))', async () => {
    adminService.getStats.mockRejectedValue(new Error('stats down'));
    adminService.getGames.mockRejectedValue(new Error('games down'));

    render(<AdminPanel />);

    await waitFor(() => expect(adminService.getStats).toHaveBeenCalled());
    // Neither service call's rejection should crash the page or throw an uncaught error;
    // state simply stays at its initial defaults.
    expect(screen.getByText('Admin Panel', { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/no games are currently featured/i)).toBeInTheDocument();
  });

  it('reaches the outer catch in loadData when a service call throws synchronously', async () => {
    adminService.getStats.mockImplementation(() => { throw new Error('sync boom'); });

    render(<AdminPanel />);

    await waitFor(() => expect(console.error).toHaveBeenCalled());
    // Component still renders using default state instead of crashing
    expect(screen.getByText('Admin Panel', { exact: false })).toBeInTheDocument();
  });

  describe('feature-steam-game form (handleFeatureSubmit)', () => {
    it('does nothing when the search query is blank', async () => {
      render(<AdminPanel />);
      await waitFor(() => expect(adminService.getGames).toHaveBeenCalled());

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /fetch & feature/i }));

      expect(adminService.featureSteamGame).not.toHaveBeenCalled();
    });

    it('shows the server success message on success', async () => {
      adminService.featureSteamGame.mockResolvedValue({ data: { message: 'Elden Ring added!' } });
      render(<AdminPanel />);
      await waitFor(() => expect(adminService.getGames).toHaveBeenCalled());

      const user = userEvent.setup();
      await user.type(screen.getByLabelText(/search by game name or steam app id/i), 'Elden Ring');
      await user.click(screen.getByRole('button', { name: /fetch & feature/i }));

      expect(await screen.findByText('Elden Ring added!')).toBeInTheDocument();
      expect(screen.getByLabelText(/search by game name or steam app id/i)).toHaveValue('');
    });

    it('falls back to a generic success message when the server sends none', async () => {
      adminService.featureSteamGame.mockResolvedValue({ data: {} });
      render(<AdminPanel />);
      await waitFor(() => expect(adminService.getGames).toHaveBeenCalled());

      const user = userEvent.setup();
      await user.type(screen.getByLabelText(/search by game name or steam app id/i), 'Hades');
      await user.click(screen.getByRole('button', { name: /fetch & feature/i }));

      expect(await screen.findByText('Game featured successfully!')).toBeInTheDocument();
    });

    it('shows the server error message on failure', async () => {
      adminService.featureSteamGame.mockRejectedValue({ response: { data: { message: 'Steam app not found' } } });
      render(<AdminPanel />);
      await waitFor(() => expect(adminService.getGames).toHaveBeenCalled());

      const user = userEvent.setup();
      await user.type(screen.getByLabelText(/search by game name or steam app id/i), 'bogus999');
      await user.click(screen.getByRole('button', { name: /fetch & feature/i }));

      expect(await screen.findByText('Steam app not found')).toBeInTheDocument();
    });

    it('falls back to a generic error message when the failure has neither a response body nor an Error message', async () => {
      adminService.featureSteamGame.mockRejectedValue('some non-Error rejection');
      render(<AdminPanel />);
      await waitFor(() => expect(adminService.getGames).toHaveBeenCalled());

      const user = userEvent.setup();
      await user.type(screen.getByLabelText(/search by game name or steam app id/i), 'bogus999');
      await user.click(screen.getByRole('button', { name: /fetch & feature/i }));

      expect(await screen.findByText('Failed to fetch and feature game from Steam')).toBeInTheDocument();
    });
  });

  describe('tab-switch fetch caching (A2)', () => {
    it('does not refetch games when switching away from and back to the Games tab', async () => {
      render(<AdminPanel />);
      await waitFor(() => expect(adminService.getGames).toHaveBeenCalledTimes(1)); // loadData() on mount

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /games/i }));
      await screen.findByText('Hollow Knight');

      await user.click(screen.getByRole('button', { name: /overview/i }));
      await user.click(screen.getByRole('button', { name: /games/i }));
      await screen.findByText('Hollow Knight');

      expect(adminService.getGames).toHaveBeenCalledTimes(1);
    });

    it('does not refetch users when switching away from and back to the Users tab', async () => {
      render(<AdminPanel />);
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: /users/i }));
      await waitFor(() => expect(adminService.getUsers).toHaveBeenCalledTimes(1));
      await screen.findByText('alice');

      await user.click(screen.getByRole('button', { name: /overview/i }));
      await user.click(screen.getByRole('button', { name: /users/i }));
      await screen.findByText('alice');

      expect(adminService.getUsers).toHaveBeenCalledTimes(1);
    });

    it('still retries a tab whose initial fetch failed (never marked as loaded)', async () => {
      adminService.getGames.mockRejectedValueOnce(new Error('down'));

      render(<AdminPanel />);
      await waitFor(() => expect(adminService.getGames).toHaveBeenCalledTimes(1));

      adminService.getGames.mockResolvedValue({ data: { data: sampleGames } });

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /games/i }));
      await screen.findByText('Hollow Knight');

      expect(adminService.getGames).toHaveBeenCalledTimes(2);
    });
  });

  describe('games management tab', () => {
    async function openGamesTab() {
      render(<AdminPanel />);
      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /games/i }));
      await waitFor(() => expect(adminService.getGames).toHaveBeenCalledWith({ limit: 50 }));
      await screen.findByText('Hollow Knight');
      return user;
    }

    it('lists games, with a fallback icon when no thumbnail and — / 0.0 when developer or rating are missing', async () => {
      await openGamesTab();
      expect(screen.getByText('Celeste')).toBeInTheDocument();
      expect(screen.getByText('—')).toBeInTheDocument(); // Celeste has no developer
      expect(screen.getByText(/⭐ 0\.0 \(0\)/)).toBeInTheDocument(); // Celeste has no avgRating/reviewCount
      expect(screen.getByText(/⭐ 4\.6 \(10\)/)).toBeInTheDocument(); // Hollow Knight
    });

    it('filters games by the search box', async () => {
      const user = await openGamesTab();
      await user.type(screen.getByLabelText(/search games/i), 'celeste');
      expect(screen.getByText('1 games')).toBeInTheDocument();
      expect(screen.getByText('Celeste')).toBeInTheDocument();
      expect(screen.queryByText('Hollow Knight')).not.toBeInTheDocument();
    });

    it('shows an empty state when no games match the search', async () => {
      const user = await openGamesTab();
      await user.type(screen.getByLabelText(/search games/i), 'nonexistent title');
      expect(screen.getByText('No games found.')).toBeInTheDocument();
    });

    it('shows an empty state when there are no games at all', async () => {
      adminService.getGames.mockResolvedValue({ data: { data: [] } });
      await openTabWithNoRows('games', /no games found\./i, /0 games/);
    });

    it('logs the error when loading games fails', async () => {
      adminService.getGames.mockRejectedValue(new Error('down'));
      render(<AdminPanel />);
      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /games/i }));
      await waitFor(() => expect(console.error).toHaveBeenCalled());
    });

    it('defaults games to an empty list when the response has no data.data (data.data || [])', async () => {
      adminService.getGames.mockResolvedValue({ data: {} });
      render(<AdminPanel />);
      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /games/i }));
      expect(await screen.findByText('No games found.')).toBeInTheDocument();
    });

    it('toggles a game to featured, reflects the new state, and does not refetch (Overview derives from games directly)', async () => {
      adminService.toggleFeatured.mockResolvedValue({});
      const user = await openGamesTab();
      await user.click(screen.getByRole('button', { name: '☆ Feature' })); // Celeste, currently not featured
      expect(adminService.toggleFeatured).toHaveBeenCalledWith('g2');
      const celesteRow = screen.getByText('Celeste').closest('tr');
      expect(await within(celesteRow).findByRole('button', { name: '⭐ Featured' })).toBeInTheDocument();
      // No more loadData() re-fetch on toggle now that Overview reads from `games`.
      expect(adminService.getStats).toHaveBeenCalledTimes(1);

      await user.click(screen.getByRole('button', { name: /overview/i }));
      // Hollow Knight was already featured in the fixture, so toggling Celeste makes 2.
      expect(screen.getByText('Active Featured Games (2)')).toBeInTheDocument();
      expect(screen.getByText('Celeste')).toBeInTheDocument();
    });

    it('alerts with the server message when toggling featured fails', async () => {
      adminService.toggleFeatured.mockRejectedValue({ response: { data: { message: 'no permission' } } });
      const user = await openGamesTab();
      await user.click(screen.getByRole('button', { name: '☆ Feature' }));
      await waitFor(() => expect(window.alert).toHaveBeenCalledWith('no permission'));
    });

    it('alerts with a generic message when toggling featured fails without a response body or Error message', async () => {
      adminService.toggleFeatured.mockRejectedValue('some non-Error rejection');
      const user = await openGamesTab();
      await user.click(screen.getByRole('button', { name: '☆ Feature' }));
      await waitFor(() => expect(window.alert).toHaveBeenCalledWith('Something went wrong'));
    });

    it('toggles a game published state and reflects the new state', async () => {
      adminService.togglePublished.mockResolvedValue({});
      const user = await openGamesTab();
      await user.click(screen.getByRole('button', { name: '🔒 Hidden' })); // Celeste, currently hidden
      expect(adminService.togglePublished).toHaveBeenCalledWith('g2');
      const celesteRow = screen.getByText('Celeste').closest('tr');
      expect(await within(celesteRow).findByRole('button', { name: '✅ Published' })).toBeInTheDocument();
    });

    it('alerts with the server message when toggling published fails', async () => {
      adminService.togglePublished.mockRejectedValue({ response: { data: { message: 'locked' } } });
      const user = await openGamesTab();
      await user.click(screen.getByRole('button', { name: '🔒 Hidden' }));
      await waitFor(() => expect(window.alert).toHaveBeenCalledWith('locked'));
    });

    it('alerts with a generic message when toggling published fails without a response body or Error message', async () => {
      adminService.togglePublished.mockRejectedValue('some non-Error rejection');
      const user = await openGamesTab();
      await user.click(screen.getByRole('button', { name: '🔒 Hidden' }));
      await waitFor(() => expect(window.alert).toHaveBeenCalledWith('Something went wrong'));
    });
  });

  describe('users management tab', () => {
    async function openUsersTab() {
      render(<AdminPanel />);
      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /users/i }));
      await waitFor(() => expect(adminService.getUsers).toHaveBeenCalledWith({ limit: 50 }));
      await screen.findByText('alice');
      return user;
    }

    it('lists users with joined date, or — when missing', async () => {
      await openUsersTab();
      expect(screen.getByText('1/15/2024')).toBeInTheDocument(); // alice's createdAt
      expect(screen.getByText('—')).toBeInTheDocument(); // bob has no createdAt
    });

    it('disables role and status controls on the current admin\'s own row', async () => {
      adminService.getUsers.mockResolvedValue({
        data: { data: [...sampleUsers, { _id: 'current-admin', username: 'currentAdmin', email: 'me@example.com', role: 'admin', isActive: true }] },
      });
      const user = userEvent.setup();
      render(<AdminPanel />);
      await user.click(screen.getByRole('button', { name: /users/i }));
      await screen.findByText('currentAdmin (you)');

      const row = screen.getByText('currentAdmin (you)').closest('tr');
      expect(within(row).getByRole('combobox')).toBeDisabled();
      expect(within(row).getByRole('button', { name: /active/i })).toBeDisabled();

      // alice's row (not the current admin) stays fully interactive
      const aliceRow = screen.getByText('alice').closest('tr');
      expect(within(aliceRow).getByRole('combobox')).not.toBeDisabled();
    });

    it('shows an empty state when there are no users', async () => {
      adminService.getUsers.mockResolvedValue({ data: { data: [] } });
      render(<AdminPanel />);
      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /users/i }));
      expect(await screen.findByText('No users found.')).toBeInTheDocument();
    });

    it('logs the error when loading users fails', async () => {
      adminService.getUsers.mockRejectedValue(new Error('down'));
      render(<AdminPanel />);
      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /users/i }));
      await waitFor(() => expect(console.error).toHaveBeenCalled());
    });

    it('defaults users to an empty list when the response has no data.data (data.data || [])', async () => {
      adminService.getUsers.mockResolvedValue({ data: {} });
      render(<AdminPanel />);
      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /users/i }));
      expect(await screen.findByText('No users found.')).toBeInTheDocument();
    });

    it('updates a role and reflects the new value', async () => {
      adminService.updateUserRole.mockResolvedValue({});
      const user = await openUsersTab();
      const select = screen.getAllByRole('combobox')[0]; // alice's role select
      await user.selectOptions(select, 'admin');
      expect(adminService.updateUserRole).toHaveBeenCalledWith('u1', 'admin');
      await waitFor(() => expect(select).toHaveValue('admin'));
    });

    it('alerts with the server message when updating a role fails', async () => {
      adminService.updateUserRole.mockRejectedValue({ response: { data: { message: 'cannot demote self' } } });
      const user = await openUsersTab();
      const select = screen.getAllByRole('combobox')[0];
      await user.selectOptions(select, 'developer');
      await waitFor(() => expect(window.alert).toHaveBeenCalledWith('cannot demote self'));
    });

    it('alerts with a generic message when updating a role fails without a response body or Error message', async () => {
      adminService.updateUserRole.mockRejectedValue('some non-Error rejection');
      const user = await openUsersTab();
      const select = screen.getAllByRole('combobox')[0];
      await user.selectOptions(select, 'developer');
      await waitFor(() => expect(window.alert).toHaveBeenCalledWith('Something went wrong'));
    });

    it('toggles a user status and reflects the new state', async () => {
      adminService.toggleUserStatus.mockResolvedValue({});
      const user = await openUsersTab();
      await user.click(screen.getByRole('button', { name: '✅ Active' })); // alice, currently active
      expect(adminService.toggleUserStatus).toHaveBeenCalledWith('u1');
      const aliceRow = screen.getByText('alice').closest('tr');
      expect(await within(aliceRow).findByRole('button', { name: '🚫 Banned' })).toBeInTheDocument();
    });

    it('alerts with the server message when toggling user status fails', async () => {
      adminService.toggleUserStatus.mockRejectedValue({ response: { data: { message: 'not allowed' } } });
      const user = await openUsersTab();
      await user.click(screen.getByRole('button', { name: '✅ Active' }));
      await waitFor(() => expect(window.alert).toHaveBeenCalledWith('not allowed'));
    });

    it('alerts with a generic message when toggling user status fails without a response body or Error message', async () => {
      adminService.toggleUserStatus.mockRejectedValue('some non-Error rejection');
      const user = await openUsersTab();
      await user.click(screen.getByRole('button', { name: '✅ Active' }));
      await waitFor(() => expect(window.alert).toHaveBeenCalledWith('Something went wrong'));
    });
  });
});

// Shared helper for the "no rows at all" empty-state cases used above.
async function openTabWithNoRows(tabName, emptyTextMatcher, countMatcher) {
  render(<AdminPanel />);
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: new RegExp(tabName, 'i') }));
  expect(await screen.findByText(emptyTextMatcher)).toBeInTheDocument();
  if (countMatcher) expect(screen.getByText(countMatcher)).toBeInTheDocument();
}
