const axios = require('axios');

// ─── Simple in-memory TTL cache ────────────────────────────────────────────
const cache = new Map();

function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { cache.delete(key); return null; }
  return entry.data;
}

function setCache(key, data, ttlSeconds = 300) {
  cache.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
}

// ─── Axios instance for Steam ───────────────────────────────────────────────
const steamAxios = axios.create({ timeout: 12000 });

// ─── Helper: normalize a Steam "mini-item" (from featuredcategories) ────────
function normalizeMiniItem(item) {
  return {
    steamAppId: String(item.id),
    title: item.name,
    thumbnail: item.header_image ||
      `https://cdn.akamai.steamstatic.com/steam/apps/${item.id}/header.jpg`,
    discountPercent: item.discount_percent || 0,
    originalPrice: item.original_price ? item.original_price / 100 : 0,
    price: item.final_price ? item.final_price / 100 : (item.original_price ? item.original_price / 100 : 0),
    isFree: item.final_price === 0,
    currency: item.currency || 'USD',
    storeUrl: `https://store.steampowered.com/app/${item.id}/?utm_source=indiegamerhub&utm_medium=referral&utm_campaign=browse`,
    platforms: {
      windows: item.win || false,
      mac: item.mac || false,
      linux: item.linux || false,
    },
  };
}

/**
 * Fetches the Steam storefront featured categories.
 * Returns raw sections: specials (sales), top_sellers, new_releases, coming_soon.
 */
const fetchSteamFeaturedCategories = async () => {
  const cacheKey = 'featured_categories';
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const { data } = await steamAxios.get(
    'https://store.steampowered.com/api/featuredcategories/?cc=us&l=en'
  );

  const result = {
    specials: (data.specials?.items || []).map(normalizeMiniItem),
    topSellers: (data.top_sellers?.items || []).map(normalizeMiniItem),
    newReleases: (data.new_releases?.items || []).map(normalizeMiniItem),
    comingSoon: (data.coming_soon?.items || []).map(normalizeMiniItem),
  };

  setCache(cacheKey, result, 300); // 5-minute cache
  return result;
};

/**
 * Fetches full game details from Steam Storefront API.
 * @param {string} appId - Steam App ID
 */
const fetchSteamAppDetails = async (appId) => {
  const cacheKey = `app_${appId}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=us&l=en`;
  const { data } = await steamAxios.get(url);

  const appData = data[appId];
  if (!appData || !appData.success) {
    throw new Error(`Steam App ID ${appId} not found or API request failed`);
  }

  const game = appData.data;

  const screenshots = (game.screenshots || []).slice(0, 10).map((s) => s.path_full);
  const genres = (game.genres || []).map((g) => g.description);

  let price = 0;
  let isFree = game.is_free || false;
  let discountPercent = 0;
  let originalPrice = 0;
  if (game.price_overview) {
    price = game.price_overview.final / 100;
    originalPrice = game.price_overview.initial / 100;
    discountPercent = game.price_overview.discount_percent || 0;
  }

  let trailerUrl = '';
  if (game.movies?.length > 0) {
    const movie = game.movies[0];
    trailerUrl = movie.mp4?.max || movie.mp4?.['480'] || '';
  }

  let releaseDate = null;
  if (game.release_date && !game.release_date.coming_soon) {
    const parsed = new Date(game.release_date.date);
    if (!isNaN(parsed)) releaseDate = parsed;
  }

  // System requirements
  const sysreqs = {
    minimum: game.pc_requirements?.minimum || '',
    recommended: game.pc_requirements?.recommended || '',
  };

  // Categories (singleplayer, multiplayer, co-op, etc.)
  const categories = (game.categories || []).map((c) => c.description);

  // DLC list (first 5)
  const dlc = (game.dlc || []).slice(0, 5).map(String);

  // Metacritic
  const metacritic = game.metacritic
    ? { score: game.metacritic.score, url: game.metacritic.url }
    : null;

  // Developers & Publishers
  const developers = game.developers || [];
  const publishers = game.publishers || [];

  const result = {
    title: game.name || '',
    description: game.detailed_description || game.short_description || '',
    shortDescription: game.short_description || '',
    genre: genres,
    categories,
    tags: genres,
    releaseDate,
    comingSoon: game.release_date?.coming_soon || false,
    releaseDateText: game.release_date?.date || '',
    screenshots,
    thumbnail: game.header_image || '',
    trailerUrl,
    price,
    originalPrice,
    discountPercent,
    isFree,
    currency: 'USD',
    storeLinks: {
      steam: `https://store.steampowered.com/app/${appId}/?utm_source=indiegamerhub&utm_medium=referral&utm_campaign=game_page`,
    },
    steamAppId: String(appId),
    platform: normalizePlatforms(game.platforms || {}),
    sysreqs,
    dlc,
    metacritic,
    developers,
    publishers,
    website: game.website || '',
    supportedLanguages: game.supported_languages || '',
    ageRating: game.required_age || 0,
    totalAchievements: game.achievements?.total || 0,
    backgroundImage: game.background || game.background_raw || '',
  };

  setCache(cacheKey, result, 3600); // 1-hour cache
  return result;
};

/**
 * Fetches Steam community reviews for a game.
 * @param {string} appId
 */
const fetchSteamReviews = async (appId, cursor = '*') => {
  const cacheKey = `reviews_${appId}_${cursor}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const url = `https://store.steampowered.com/appreviews/${appId}?json=1&num_per_page=10&language=english&review_type=all&purchase_type=all&cursor=${encodeURIComponent(cursor)}`;
  const { data } = await steamAxios.get(url);

  if (!data.success) return { reviews: [], summary: null, cursor: null };

  const reviews = (data.reviews || []).map((r) => ({
    id: r.recommendationid,
    authorName: r.author?.steamid || 'Steam User',
    playtimeHours: Math.round((r.author?.playtime_forever || 0) / 60),
    voted_up: r.voted_up,
    body: r.review?.slice(0, 600) + (r.review?.length > 600 ? '…' : ''),
    timestamp: new Date(r.timestamp_created * 1000).toISOString(),
    votes_helpful: r.votes_helpful || 0,
    weighted_vote_score: parseFloat(r.weighted_vote_score || 0),
  }));

  const summary = data.query_summary || null;

  const result = { reviews, summary, cursor: data.cursor || null };
  setCache(cacheKey, result, 900); // 15-min cache
  return result;
};

/**
 * Fetches live player count for a game.
 */
const fetchLivePlayerCount = async (appId) => {
  const cacheKey = `players_${appId}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await steamAxios.get(
      `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appId}`
    );
    const count = data.response?.player_count || 0;
    setCache(cacheKey, count, 60); // 1-min cache
    return count;
  } catch {
    return 0;
  }
};

/**
 * Verifies a Steam ID (numeric 64-bit) using the public XML profile API.
 * Works without a Steam API key.
 */
const verifySteamId = async (steamId) => {
  const cacheKey = `user_${steamId}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    // Public profile XML — works without API key
    const { data } = await steamAxios.get(
      `https://steamcommunity.com/profiles/${steamId}/?xml=1`,
      { headers: { 'Accept': 'application/xml' } }
    );

    // Parse basic fields from XML manually (simple regex, avoids xml parser dep)
    const steamId64 = data.match(/<steamID64>(\d+)<\/steamID64>/)?.[1];
    const steamName = data.match(/<steamID><!?\[?CDATA\[([^\]]+)\]?\]?>/)?.[1] ||
                      data.match(/<steamID>([^<]+)<\/steamID>/)?.[1];
    const avatar = data.match(/<avatarFull><!?\[?CDATA\[([^\]]+)\]?\]?>/)?.[1] ||
                   data.match(/<avatarFull>([^<]+)<\/avatarFull>/)?.[1];
    const onlineState = data.match(/<onlineState>([^<]+)<\/onlineState>/)?.[1];
    const memberSince = data.match(/<memberSince>([^<]+)<\/memberSince>/)?.[1];

    if (!steamId64) throw new Error('Invalid Steam ID or private profile');

    const profile = {
      steamId: steamId64,
      displayName: steamName?.trim() || 'Steam User',
      avatar: avatar?.trim() || '',
      onlineState: onlineState || 'unknown',
      memberSince: memberSince || '',
      profileUrl: `https://steamcommunity.com/profiles/${steamId64}`,
    };

    setCache(cacheKey, profile, 3600);
    return profile;
  } catch (err) {
    throw new Error('Could not verify Steam ID. Make sure your profile is public.');
  }
};

/**
 * Resolves a Steam vanity URL (custom username) to a 64-bit Steam ID.
 * Uses the public community page — no API key needed.
 */
const resolveVanityUrl = async (vanityName) => {
  try {
    // Try fetching the vanity profile page to extract the steamid64
    const { data } = await steamAxios.get(
      `https://steamcommunity.com/id/${vanityName}/?xml=1`,
      { headers: { 'Accept': 'application/xml' } }
    );
    const steamId64 = data.match(/<steamID64>(\d+)<\/steamID64>/)?.[1];
    if (!steamId64) throw new Error('Vanity URL not found');
    return steamId64;
  } catch {
    throw new Error('Could not resolve Steam username. Try using your numeric Steam ID instead.');
  }
};

/**
 * Fetch price update only (lightweight).
 */
const fetchSteamPrice = async (appId) => {
  try {
    const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&filters=price_overview&cc=us`;
    const { data } = await steamAxios.get(url, { timeout: 8000 });
    const appData = data[appId];
    if (!appData?.success) return null;
    const priceData = appData.data?.price_overview;
    if (!priceData) return null;
    return {
      price: priceData.final / 100,
      originalPrice: priceData.initial / 100,
      discountPercent: priceData.discount_percent || 0,
      currency: priceData.currency,
    };
  } catch {
    return null;
  }
};

function normalizePlatforms(platforms) {
  const result = [];
  if (platforms.windows) result.push('Windows');
  if (platforms.mac) result.push('Mac');
  if (platforms.linux) result.push('Linux');
  return result.length > 0 ? result : ['Windows'];
}

/**
 * Searches Steam store for games by text query.
 * Uses the public storesearch JSON API — no API key required.
 * @param {string} query - Search term
 */
const searchSteam = async (query) => {
  const cacheKey = `search_${query.toLowerCase().replace(/\s+/g, '_')}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=english&cc=US`;
  const { data } = await steamAxios.get(url, { timeout: 10000 });

  const items = (data.items || []).map((item) => {
    const priceData = item.price || {};
    const finalPrice = priceData.final ? priceData.final / 100 : 0;
    const initialPrice = priceData.initial ? priceData.initial / 100 : 0;
    const discountPct = priceData.discount_percent || 0;
    const isFree = priceData.is_free || finalPrice === 0;

    return {
      steamAppId: String(item.id),
      title: item.name || '',
      thumbnail: item.tiny_image ||
        `https://cdn.akamai.steamstatic.com/steam/apps/${item.id}/header.jpg`,
      price: finalPrice,
      originalPrice: initialPrice || finalPrice,
      discountPercent: discountPct,
      isFree,
      storeUrl: `https://store.steampowered.com/app/${item.id}/`,
      metascore: item.metascore || null,
      platforms: {
        windows: item.platforms?.windows || false,
        mac: item.platforms?.mac || false,
        linux: item.platforms?.linux || false,
      },
    };
  });

  setCache(cacheKey, items, 120); // 2-min cache for searches
  return items;
};

/**
 * Fetches a curated category from Steam (top sellers, specials, etc.)
 * and returns results for a specific genre tag filter.
 */
const fetchSteamByGenre = async (genreTag) => {
  const cacheKey = `genre_${genreTag}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  // Use the storesearch with genre term to get relevant results
  const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(genreTag)}&l=english&cc=US`;
  const { data } = await steamAxios.get(url, { timeout: 10000 });

  const items = (data.items || []).slice(0, 24).map((item) => {
    const priceData = item.price || {};
    return {
      steamAppId: String(item.id),
      title: item.name || '',
      thumbnail: `https://cdn.akamai.steamstatic.com/steam/apps/${item.id}/header.jpg`,
      price: priceData.final ? priceData.final / 100 : 0,
      originalPrice: priceData.initial ? priceData.initial / 100 : 0,
      discountPercent: priceData.discount_percent || 0,
      isFree: priceData.is_free || !priceData.final,
      storeUrl: `https://store.steampowered.com/app/${item.id}/`,
      platforms: {
        windows: item.platforms?.windows || false,
        mac: item.platforms?.mac || false,
        linux: item.platforms?.linux || false,
      },
    };
  });

  setCache(cacheKey, items, 300);
  return items;
};

module.exports = {
  fetchSteamFeaturedCategories,
  fetchSteamAppDetails,
  fetchSteamReviews,
  fetchLivePlayerCount,
  verifySteamId,
  resolveVanityUrl,
  fetchSteamPrice,
  searchSteam,
  fetchSteamByGenre,
};
