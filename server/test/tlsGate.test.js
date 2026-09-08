const test = require('node:test');
const assert = require('node:assert/strict');
const { applyTlsGate } = require('../utils/tlsGate');

test('applyTlsGate disables TLS verification when NODE_ENV is development', () => {
  const env = { NODE_ENV: 'development' };
  applyTlsGate(env);
  assert.equal(env.NODE_TLS_REJECT_UNAUTHORIZED, '0');
});

test('applyTlsGate leaves TLS verification untouched when NODE_ENV is unset (fail-safe, not fail-open)', () => {
  const env = {};
  applyTlsGate(env);
  assert.equal(env.NODE_TLS_REJECT_UNAUTHORIZED, undefined);
});

test('applyTlsGate leaves TLS verification untouched in production', () => {
  const env = { NODE_ENV: 'production' };
  applyTlsGate(env);
  assert.equal(env.NODE_TLS_REJECT_UNAUTHORIZED, undefined);
});

test('applyTlsGate leaves TLS verification untouched in test', () => {
  const env = { NODE_ENV: 'test' };
  applyTlsGate(env);
  assert.equal(env.NODE_TLS_REJECT_UNAUTHORIZED, undefined);
});
