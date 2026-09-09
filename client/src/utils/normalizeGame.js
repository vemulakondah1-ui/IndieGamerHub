// Shared field-normalization for the game objects rendered on HomePage and
// GamesPage — those two sources (admin-managed Game docs, live Steam catalog
// items, and the hardcoded local catalog) each shape the same conceptual
// fields (id, title, thumbnail, description, price, platform) differently, so
// this was previously duplicated per-page with independent || vs ?? choices.
// Consolidated here so a new fallback source or schema-default change only
// needs to be applied once.
export function normalizeGame(game, index = 0) {
  // steamAppId defaults to '' (never "0") on admin-managed Game docs, so ||
  // (not ??) is what falls through to _id/id correctly for non-Steam games.
  const rawId = game.steamAppId || game._id || game.id || `game-${index}`;
  const cleanId = String(rawId).replace(/^steam-/, '');
  const isSteamId = /^\d+$/.test(cleanId);
  const path = isSteamId ? `/steam/${cleanId}` : `/games/${rawId}`;

  const title = game.title || game.name || 'Untitled Game';
  const thumbnail = game.thumbnail || game.header_image || game.imageUrl || '';
  const description = game.short_description || game.shortDescription || 'No description available';
  const platform = game.platform || 'Steam';

  // Game docs store price as a number (schema default 0, a real valid price);
  // Steam/catalog items store it pre-formatted (a string, or nested under
  // price_overview). Each shape only ever matches one branch below.
  const price = typeof game.price === 'number'
    ? `$${game.price.toFixed(2)}`
    : (game.price_overview?.final_formatted ?? game.price ?? '$14.99');

  const resolvedId = isSteamId ? cleanId : rawId;

  return {
    id: resolvedId,
    gameId: resolvedId,
    isSteamId,
    path,
    title,
    thumbnail,
    description,
    price,
    platform,
    platformName: platform
  };
}
