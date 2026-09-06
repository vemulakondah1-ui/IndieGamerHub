'use strict';

// Exercises the /api/steam routes over real HTTP, mocking axios so no real
// Steam API call happens. Requires `--experimental-test-module-mocks`
// (mock.module is used for both axios and config/db.js, same pattern as
// server.test.js).

process.env.NODE_ENV = 'production';
process.env.PORT = '0';
process.env.MONGO_URI = 'mongodb://stub-not-used';
// The cache-eviction test below fires 500+ requests to exercise the FIFO
// bound; raised only for this test file's own process so it doesn't clash
// with the general limiter's production default of 100.
process.env.RATE_LIMIT_MAX_REQUESTS = '600';

const test = require('node:test');
const assert = require('node:assert/strict');
const { mock, before, after, beforeEach } = test;

mock.module('../config/db.js', { defaultExport: () => {} });

let axiosGetImpl;
mock.module('axios', {
  namedExports: {
    get: (...args) => axiosGetImpl(...args),
  },
  defaultExport: {
    get: (...args) => axiosGetImpl(...args),
  },
});

const { server } = require('../server.js');

let baseUrl;

before(() => {
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(() => {
  server.close();
});

beforeEach(() => {
  axiosGetImpl = async () => {
    throw new Error('axiosGetImpl not configured for this test');
  };
});

test('GET /api/steam/app/:appId passes through Steam\'s raw response untouched', async () => {
  const steamRaw = {
    '100': {
      success: true,
      data: { name: 'Test Game', is_free: false, price_overview: { final: 1999 } },
    },
  };
  axiosGetImpl = async () => ({ data: steamRaw });

  const res = await fetch(`${baseUrl}/api/steam/app/100`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { success: true, data: steamRaw });
});

test('GET /api/steam/app/:appId 404s when Steam reports success:false', async () => {
  axiosGetImpl = async () => ({ data: { '101': { success: false } } });

  const res = await fetch(`${baseUrl}/api/steam/app/101`);
  assert.equal(res.status, 404);
  assert.equal((await res.json()).success, false);
});

test('GET /api/steam/app/:appId serves the fresh cache on a second request without calling Steam again', async () => {
  let calls = 0;
  const steamRaw = { '102': { success: true, data: { name: 'Cached Game' } } };
  axiosGetImpl = async () => {
    calls += 1;
    return { data: steamRaw };
  };

  const first = await fetch(`${baseUrl}/api/steam/app/102`);
  assert.equal(first.status, 200);
  const second = await fetch(`${baseUrl}/api/steam/app/102`);
  assert.equal(second.status, 200);
  assert.deepEqual(await second.json(), { success: true, data: steamRaw });
  assert.equal(calls, 1, 'expected the second request to be served from cache, not re-fetched');
});

test('GET /api/steam/app/:appId serves stale cache when Steam fails after the cache TTL expires', async () => {
  const steamRaw = { '103': { success: true, data: { name: 'Stale Game' } } };
  let calls = 0;
  axiosGetImpl = async () => {
    calls += 1;
    if (calls === 1) return { data: steamRaw };
    throw new Error('Steam is down');
  };

  const first = await fetch(`${baseUrl}/api/steam/app/103`);
  assert.equal(first.status, 200);

  mock.timers.enable({ apis: ['Date'], now: Date.now() });
  try {
    mock.timers.tick(16 * 60 * 1000); // past the 15-minute cache TTL
    const second = await fetch(`${baseUrl}/api/steam/app/103`);
    assert.equal(second.status, 200);
    const body = await second.json();
    assert.equal(body.stale, true);
    assert.deepEqual(body.data, steamRaw);
    assert.equal(calls, 2, 'expected the expired cache to trigger a real re-fetch attempt');
  } finally {
    mock.timers.reset();
  }
});

test('GET /api/steam/app/:appId/reviews passes through Steam\'s raw review response', async () => {
  const reviewsRaw = {
    success: true,
    query_summary: { total_reviews: 10, total_positive: 9 },
    reviews: [{ recommendationid: 'r1', voted_up: true, review: 'Great!' }],
    cursor: 'abc',
  };
  axiosGetImpl = async () => ({ data: reviewsRaw });

  const res = await fetch(`${baseUrl}/api/steam/app/200/reviews`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { success: true, data: reviewsRaw });
});

test('GET /api/steam/app/:appId/reviews serves the fresh cache on a second request without calling Steam again', async () => {
  let calls = 0;
  const reviewsRaw = { success: true, query_summary: {}, reviews: [], cursor: null };
  axiosGetImpl = async () => {
    calls += 1;
    return { data: reviewsRaw };
  };

  await fetch(`${baseUrl}/api/steam/app/201/reviews`);
  await fetch(`${baseUrl}/api/steam/app/201/reviews`);
  assert.equal(calls, 1, 'expected the second request to be served from cache, not re-fetched');
});

test('GET /api/steam/app/:appId/reviews forwards the cursor query param to Steam, keyed separately from the no-cursor request', async () => {
  let capturedParams;
  axiosGetImpl = async (url, config) => {
    capturedParams = config.params;
    return { data: { success: true, query_summary: {}, reviews: [], cursor: null } };
  };

  const res = await fetch(`${baseUrl}/api/steam/app/202/reviews?cursor=abc123`);
  assert.equal(res.status, 200);
  assert.equal(capturedParams.cursor, 'abc123');
});

test('GET /api/steam/app/:appId/reviews serves stale cache when Steam fails after the cache TTL expires', async () => {
  const reviewsRaw = { success: true, query_summary: { total_reviews: 1 }, reviews: [], cursor: null };
  let calls = 0;
  axiosGetImpl = async () => {
    calls += 1;
    if (calls === 1) return { data: reviewsRaw };
    throw new Error('Steam is down');
  };

  await fetch(`${baseUrl}/api/steam/app/203/reviews`);

  mock.timers.enable({ apis: ['Date'], now: Date.now() });
  try {
    mock.timers.tick(16 * 60 * 1000);
    const second = await fetch(`${baseUrl}/api/steam/app/203/reviews`);
    assert.equal(second.status, 200);
    const body = await second.json();
    assert.equal(body.stale, true);
    assert.deepEqual(body.data, reviewsRaw);
  } finally {
    mock.timers.reset();
  }
});

test('GET /api/steam/app/:appId/players players falls back to 0 when Steam\'s response has no player_count', async () => {
  axiosGetImpl = async () => ({ data: { response: {} } });
  const res = await fetch(`${baseUrl}/api/steam/app/301/players`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { success: true, data: { playerCount: 0 } });
});

test('GET /api/steam/app/:appId/players appends the STEAM_API_KEY when set, and omits it otherwise', async () => {
  let capturedUrl;
  axiosGetImpl = async (url) => {
    capturedUrl = url;
    return { data: { response: { player_count: 42 } } };
  };

  // server/.env sets a placeholder STEAM_API_KEY; unset it here to test the
  // genuinely-no-key case regardless of what's loaded outside this test.
  const originalKey = process.env.STEAM_API_KEY;
  delete process.env.STEAM_API_KEY;

  const withoutKey = await fetch(`${baseUrl}/api/steam/app/300/players`);
  assert.equal(withoutKey.status, 200);
  assert.deepEqual(await withoutKey.json(), { success: true, data: { playerCount: 42 } });
  assert.ok(!capturedUrl.includes('key='), 'expected no key param when STEAM_API_KEY is unset');

  process.env.STEAM_API_KEY = 'test-key-123';
  try {
    await fetch(`${baseUrl}/api/steam/app/300/players`);
    assert.ok(capturedUrl.includes('key=test-key-123'), 'expected the key param when STEAM_API_KEY is set');
  } finally {
    if (originalKey === undefined) delete process.env.STEAM_API_KEY;
    else process.env.STEAM_API_KEY = originalKey;
  }
});

test('GET /api/steam/app/:appId/players falls back to playerCount:0 on a Steam error, never 500s', async () => {
  axiosGetImpl = async () => {
    throw new Error('Steam is down');
  };

  const res = await fetch(`${baseUrl}/api/steam/app/400/players`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { success: true, data: { playerCount: 0 } });
});

// homepage/games use fixed cache keys with no per-test namespacing, so the
// no-cache-yet (500/400/404) branches only fire before any successful call
// for that route has been cached in this file — these run first.

test('GET /api/steam/homepage 500s on a Steam error with no prior cache to fall back on', async () => {
  axiosGetImpl = async () => {
    throw new Error('Steam is down');
  };
  const res = await fetch(`${baseUrl}/api/steam/homepage`);
  assert.equal(res.status, 500);
  assert.equal((await res.json()).success, false);
});

test('GET /api/steam/homepage 400s when Steam\'s response has no featured_win', async () => {
  axiosGetImpl = async () => ({ data: { coming_soon: [] } });
  const res = await fetch(`${baseUrl}/api/steam/homepage`);
  assert.equal(res.status, 400);
});

test('GET /api/steam/homepage maps Steam featured_win into the expected shape, with fallbacks for missing fields', async () => {
  let calls = 0;
  axiosGetImpl = async () => {
    calls += 1;
    return {
      data: {
        featured_win: [
          { id: 1, name: 'Game One', short_description: 'desc', final_price: 999, header_image: 'img.jpg' },
          { id: 2, name: 'Game Two' },
        ],
      },
    };
  };

  const res = await fetch(`${baseUrl}/api/steam/homepage`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.equal(body.data[0].title, 'Game One');
  assert.equal(body.data[0].price_overview.final_formatted, '$9.99');
  assert.equal(body.data[1].short_description, 'Explore this top title live from Steam.');
  assert.equal(body.data[1].price_overview.final_formatted, 'Free');

  const second = await fetch(`${baseUrl}/api/steam/homepage`);
  assert.equal(second.status, 200);
  assert.equal(calls, 1, 'expected the second request to be served from cache, not re-fetched');
});

test('GET /api/steam/homepage serves stale cache when Steam fails after the cache TTL expires', async () => {
  mock.timers.enable({ apis: ['Date'], now: Date.now() });
  try {
    mock.timers.tick(16 * 60 * 1000); // expires the entry the previous test cached
    axiosGetImpl = async () => {
      throw new Error('Steam is down');
    };
    const res = await fetch(`${baseUrl}/api/steam/homepage`);
    assert.equal(res.status, 200);
    assert.equal((await res.json()).stale, true);
  } finally {
    mock.timers.reset();
  }
});

test('GET /api/steam/games 500s on a Steam error with no prior cache to fall back on', async () => {
  axiosGetImpl = async () => {
    throw new Error('Steam is down');
  };
  const res = await fetch(`${baseUrl}/api/steam/games`);
  assert.equal(res.status, 500);
});

test('GET /api/steam/games 404s on an empty Steam response with no cache to fall back on', async () => {
  axiosGetImpl = async () => ({ data: null });
  const res = await fetch(`${baseUrl}/api/steam/games`);
  assert.equal(res.status, 404);
});

test('GET /api/steam/games maps featured_win + coming_soon into the expected shape, with fallbacks for missing fields', async () => {
  let calls = 0;
  axiosGetImpl = async () => {
    calls += 1;
    return {
      data: {
        featured_win: [{ id: 1, name: 'Win Game', final_price: 500 }],
        coming_soon: [{ name: 'Soon Game' }],
      },
    };
  };

  const res = await fetch(`${baseUrl}/api/steam/games`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.data.length, 2);
  assert.equal(body.data[0].title, 'Win Game');
  assert.equal(body.data[0].price, '$5.00');
  assert.equal(body.data[1].title, 'Soon Game');
  assert.equal(body.data[1].short_description, 'Fetched live from Steam Store API.');
  assert.equal(body.data[1].price, '$14.99');

  const second = await fetch(`${baseUrl}/api/steam/games`);
  assert.equal(second.status, 200);
  assert.equal(calls, 1, 'expected the second request to be served from cache, not re-fetched');
});

test('GET /api/steam/games serves stale cache when Steam fails after the cache TTL expires', async () => {
  mock.timers.enable({ apis: ['Date'], now: Date.now() });
  try {
    mock.timers.tick(16 * 60 * 1000); // expires the entry the previous test cached
    axiosGetImpl = async () => {
      throw new Error('Steam is down');
    };
    const res = await fetch(`${baseUrl}/api/steam/games`);
    assert.equal(res.status, 200);
    assert.equal((await res.json()).stale, true);
  } finally {
    mock.timers.reset();
  }
});

test('GET /api/steam/app/:appId 500s on a Steam error with no prior cache to fall back on', async () => {
  axiosGetImpl = async () => {
    throw new Error('Steam is down');
  };
  const res = await fetch(`${baseUrl}/api/steam/app/999`);
  assert.equal(res.status, 500);
  assert.equal((await res.json()).success, false);
});

test('GET /api/steam/app/:appId/reviews 500s on a Steam error with no prior cache to fall back on', async () => {
  axiosGetImpl = async () => {
    throw new Error('Steam is down');
  };
  const res = await fetch(`${baseUrl}/api/steam/app/999/reviews`);
  assert.equal(res.status, 500);
  assert.equal((await res.json()).success, false);
});

test('the response cache evicts its oldest entry once it exceeds 500 distinct keys', async () => {
  let calls = 0;
  axiosGetImpl = async () => {
    calls += 1;
    return { data: { 'evict-probe': { success: true, data: { name: 'first' } } } };
  };

  const first = await fetch(`${baseUrl}/api/steam/app/evict-probe`);
  assert.equal(first.status, 200);
  assert.equal(calls, 1);

  axiosGetImpl = async (url) => {
    calls += 1;
    const id = new URL(url).searchParams.get('appids');
    return { data: { [id]: { success: true, data: { name: `filler-${id}` } } } };
  };
  // 520, not 500: earlier tests in this file already populated a handful of
  // other cache keys, so evict-probe isn't necessarily the very oldest entry
  // — this margin guarantees it's pushed out regardless of exactly how many.
  for (let i = 0; i < 520; i++) {
    // eslint-disable-next-line no-await-in-loop
    await fetch(`${baseUrl}/api/steam/app/filler-${i}`);
  }

  const callsBeforeRefetch = calls;
  axiosGetImpl = async () => {
    calls += 1;
    return { data: { 'evict-probe': { success: true, data: { name: 'refetched' } } } };
  };
  const afterEviction = await fetch(`${baseUrl}/api/steam/app/evict-probe`);
  assert.equal(afterEviction.status, 200);
  assert.deepEqual((await afterEviction.json()).data, { 'evict-probe': { success: true, data: { name: 'refetched' } } });
  assert.equal(
    calls,
    callsBeforeRefetch + 1,
    'expected the original entry to have been evicted, forcing a real re-fetch'
  );
});
