'use strict';

// Exercises server.js over real HTTP (rate limiters need a real Express
// dispatch to count requests) plus a direct unit call into errorHandler
// (extracted to a named function in server.js) for the branches that would
// otherwise need a live Mongo duplicate-key error to trigger.
//
// connectDB() is stubbed via node:test's module mocking so this never dials
// a real MongoDB URI (it also process.exit(1)s on failure, which would kill
// the test runner). Requires `--experimental-test-module-mocks`.
// NODE_ENV=production avoids pino's pino-pretty transport, which spawns a
// worker thread that would otherwise keep the process alive after the
// server closes.

process.env.NODE_ENV = 'production';
process.env.PORT = '0'; // let the OS assign a free port
process.env.MONGO_URI = 'mongodb://stub-not-used';

const test = require('node:test');
const assert = require('node:assert/strict');
const { mock, before, after } = test;

mock.module('../config/db.js', { defaultExport: () => {} });

const { app, errorHandler, server } = require('../server.js');

let baseUrl;

before(() => {
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(() => {
  server.close();
});

test('a normal request carries standard RateLimit-* headers', async () => {
  // Not /api/health: the general limiter's `skip` deliberately exempts health
  // checks (and /auth) from this quota, so it wouldn't carry the headers.
  const res = await fetch(`${baseUrl}/api/does-not-exist`);
  assert.ok(res.headers.get('ratelimit-limit'), 'expected a ratelimit-limit header');
  assert.ok(res.headers.get('ratelimit-remaining') !== null, 'expected a ratelimit-remaining header');
});

test('GET /api/health responds OK and is exempt from the general rate limiter', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: 'OK', message: 'IndieGamer Hub API is running' });
  assert.equal(res.headers.get('ratelimit-limit'), null, 'health checks should not carry rate-limit headers');
});

test('the /api/auth limiter 429s after 10 requests in the window', async () => {
  let lastRes;
  for (let i = 0; i < 10; i++) {
    lastRes = await fetch(`${baseUrl}/api/auth/me`);
    assert.notEqual(lastRes.status, 429, `request ${i + 1} should not be rate-limited yet`);
  }

  const eleventh = await fetch(`${baseUrl}/api/auth/me`);
  assert.equal(eleventh.status, 429);
  const body = await eleventh.json();
  assert.deepEqual(body, {
    success: false,
    message: 'Too many attempts, please try again later',
  });
});

function makeRes() {
  return {
    statusCode: undefined,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test('errorHandler: duplicate-key (11000) errors return 400 naming the field', () => {
  const err = new Error('E11000 duplicate key error');
  err.code = 11000;
  err.keyPattern = { email: 1 };
  const res = makeRes();

  errorHandler(err, {}, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, {
    success: false,
    message: 'A record with this email already exists',
  });
});

test('errorHandler: code 11000 without a keyPattern falls through to the generic path', () => {
  const err = new Error('weird bulk-write style error');
  err.code = 11000;
  const res = makeRes();

  errorHandler(err, {}, res, () => {});

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { success: false, message: 'weird bulk-write style error' });
});

test('errorHandler: generic errors return their own status code and message', () => {
  const err = new Error('Nope, not allowed');
  err.statusCode = 403;
  const res = makeRes();

  errorHandler(err, {}, res, () => {});

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { success: false, message: 'Nope, not allowed' });
});

test('errorHandler: errors without a statusCode/message fall back to 500 + generic message', () => {
  const err = new Error();
  const res = makeRes();

  errorHandler(err, {}, res, () => {});

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { success: false, message: 'Internal Server Error' });
});
