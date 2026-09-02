const axios = require('axios');

const RAWG_BASE = 'https://api.rawg.io/api';

/**
 * Search for games by title on RAWG.io
 * @param {string} query - Game title to search
 * @returns {object[]} Array of normalized game objects
 */
const searchRawgGames = async (query) => {
  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) throw new Error('RAWG_API_KEY not configured');

  const { data } = await axios.get(`${RAWG_BASE}/games`, {
    params: { search: query, key: apiKey, page_size: 5, ordering: '-rating' },
    timeout: 10000,
  });

  return (data.results || []).map(normalizeRawgGame);
};

/**
 * Fetch a single game from RAWG by its slug or ID
 * @param {string|number} idOrSlug
 */
const fetchRawgGame = async (idOrSlug) => {
  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) throw new Error('RAWG_API_KEY not configured');

  const { data } = await axios.get(`${RAWG_BASE}/games/${idOrSlug}`, {
    params: { key: apiKey },
    timeout: 10000,
  });

  // Also fetch screenshots
  const screenshotRes = await axios.get(`${RAWG_BASE}/games/${idOrSlug}/screenshots`, {
    params: { key: apiKey },
    timeout: 8000,
  }).catch(() => ({ data: { results: [] } }));

  const screenshots = (screenshotRes.data.results || [])
    .slice(0, 10)
    .map((s) => s.image);

  return { ...normalizeRawgGame(data), screenshots };
};

function normalizeRawgGame(game) {
  const genres = (game.genres || []).map((g) => g.name);
  const tags = (game.tags || []).slice(0, 10).map((t) => t.name);
  const platforms = (game.platforms || []).map((p) => normalizePlatform(p.platform?.name));

  let releaseDate = null;
  if (game.released) {
    const parsed = new Date(game.released);
    if (!isNaN(parsed)) releaseDate = parsed;
  }

  return {
    title: game.name || '',
    description: game.description_raw || game.description || '',
    shortDescription: game.description_raw
      ? game.description_raw.slice(0, 250)
      : '',
    genre: genres,
    tags,
    releaseDate,
    thumbnail: game.background_image || '',
    screenshots: [],
    trailerUrl: '',
    price: 0,
    isFree: false,
    currency: 'USD',
    storeLinks: {},
    platform: [...new Set(platforms.filter(Boolean))],
    rawgId: String(game.id || ''),
    rawgSlug: game.slug || '',
  };
}

function normalizePlatform(name = '') {
  if (!name) return null;
  const lower = name.toLowerCase();
  if (lower.includes('pc') || lower.includes('windows')) return 'Windows';
  if (lower.includes('mac')) return 'Mac';
  if (lower.includes('linux')) return 'Linux';
  if (lower.includes('android')) return 'Android';
  if (lower.includes('ios') || lower.includes('iphone')) return 'iOS';
  if (lower.includes('web')) return 'Web';
  return null;
}

module.exports = { searchRawgGames, fetchRawgGame };
