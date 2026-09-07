'use strict';

// Pure schema-introspection tests: mongoose.model() and .schema.indexes()
// both work without a live DB connection, so these never touch Mongo.
const test = require('node:test');
const assert = require('node:assert/strict');

const Game = require('../models/Game');
const Review = require('../models/Review');

test('Game schema indexes a non-unique steamAppId', () => {
  const indexes = Game.schema.indexes();
  const steamIndex = indexes.find(([key]) => Object.keys(key).length === 1 && key.steamAppId === 1);

  assert.ok(steamIndex, 'expected an index on { steamAppId: 1 }');
  const [key, options] = steamIndex;
  assert.deepEqual(key, { steamAppId: 1 });
  assert.notEqual(options.unique, true);
});

test('Review schema indexes { game: 1 } separately from the unique compound index', () => {
  const indexes = Review.schema.indexes();

  const gameOnlyIndex = indexes.find(
    ([key]) => Object.keys(key).length === 1 && key.game === 1
  );
  assert.ok(gameOnlyIndex, 'expected a standalone index on { game: 1 }');
  const [, gameOnlyOptions] = gameOnlyIndex;
  assert.notEqual(gameOnlyOptions.unique, true);

  const compoundIndex = indexes.find(
    ([key]) => key.user === 1 && key.game === 1 && Object.keys(key).length === 2
  );
  assert.ok(compoundIndex, 'expected the existing unique compound { user: 1, game: 1 } index');
  const [, compoundOptions] = compoundIndex;
  assert.equal(compoundOptions.unique, true);
});
