'use strict';

// Unlike models.test.js (pure schema introspection, no DB), this file needs a
// live Mongo: recalcAvgRating runs inside Mongoose's post('save') /
// post('findOneAndDelete') hooks, which only fire during a real document
// lifecycle against a real connection — they can't be invoked directly.
// mongodb-memory-server spins up a real mongod locally so these hooks run
// for real without needing an external Mongo instance or network access.
const test = require('node:test');
const assert = require('node:assert/strict');
const { before, after } = test;
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const Game = require('../models/Game');
const Review = require('../models/Review');

let mongod;

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

function makeGame() {
  return Game.create({
    title: 'Test Game',
    description: 'A game used for review hook tests',
    developer: new mongoose.Types.ObjectId(),
  });
}

function makeReview(game, rating) {
  return Review.create({
    user: new mongoose.Types.ObjectId(),
    game: game._id,
    rating,
    body: 'This is a sufficiently long review body.',
  });
}

test('saving a review updates the game avgRating and reviewCount', async () => {
  const game = await makeGame();
  await makeReview(game, 4);
  await makeReview(game, 2);

  const updated = await Game.findById(game._id);
  assert.equal(updated.avgRating, 3);
  assert.equal(updated.reviewCount, 2);
});

test('saving another review for the same game recalculates the average again', async () => {
  const game = await makeGame();
  await makeReview(game, 5);
  await makeReview(game, 5);
  await makeReview(game, 1);

  const updated = await Game.findById(game._id);
  assert.equal(updated.avgRating, Math.round(((5 + 5 + 1) / 3) * 10) / 10);
  assert.equal(updated.reviewCount, 3);
});

test('deleting a review recalculates the remaining average and count', async () => {
  const game = await makeGame();
  const toDelete = await makeReview(game, 4);
  await makeReview(game, 2);

  await Review.findOneAndDelete({ _id: toDelete._id });

  const updated = await Game.findById(game._id);
  assert.equal(updated.avgRating, 2);
  assert.equal(updated.reviewCount, 1);
});

test('deleting the last review resets avgRating and reviewCount to 0', async () => {
  const game = await makeGame();
  const onlyReview = await makeReview(game, 3);

  await Review.findOneAndDelete({ _id: onlyReview._id });

  const updated = await Game.findById(game._id);
  assert.equal(updated.avgRating, 0);
  assert.equal(updated.reviewCount, 0);
});

test('findOneAndDelete on a non-matching filter does not throw', async () => {
  await assert.doesNotReject(
    Review.findOneAndDelete({ _id: new mongoose.Types.ObjectId() })
  );
});

// reviewController.deleteReview calls the document instance's .deleteOne(),
// not Review.findOneAndDelete() — a separate Mongoose middleware event, only
// covered by this test (see Review.js's post('deleteOne', {document:true}) hook).
test('deleting a review via the document instance recalculates the average', async () => {
  const game = await makeGame();
  const toDelete = await makeReview(game, 4);
  await makeReview(game, 2);

  const fetched = await Review.findById(toDelete._id);
  await fetched.deleteOne();

  const updated = await Game.findById(game._id);
  assert.equal(updated.avgRating, 2);
  assert.equal(updated.reviewCount, 1);
});
