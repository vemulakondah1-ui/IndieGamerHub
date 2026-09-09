const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    game: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    title: {
      type: String,
      maxlength: [120, 'Review title cannot exceed 120 characters'],
      default: '',
    },
    body: {
      type: String,
      required: [true, 'Review body is required'],
      minlength: [3, 'Review must be at least 3 characters'],
      maxlength: [2000, 'Review cannot exceed 2000 characters'],
    },
    isRecommended: {
      type: Boolean,
      default: true,
    },
    helpfulVotes: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// One review per user per game
reviewSchema.index({ user: 1, game: 1 }, { unique: true });
reviewSchema.index({ game: 1 });

// Static method to recalculate avgRating
reviewSchema.statics.recalcAvgRating = async function (gameId) {
  const Game = mongoose.model('Game');
  try {
    const rawId = String(gameId).trim();
    const matchCondition = mongoose.Types.ObjectId.isValid(rawId)
      ? { $or: [{ game: new mongoose.Types.ObjectId(rawId) }, { game: rawId }] }
      : { game: rawId };

    const result = await this.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    const avgRating = result.length > 0 ? Math.round(result[0].avgRating * 10) / 10 : 0;
    const reviewCount = result.length > 0 ? result[0].reviewCount : 0;

    if (mongoose.Types.ObjectId.isValid(rawId)) {
      await Game.findByIdAndUpdate(rawId, { avgRating, reviewCount });
    } else {
      await Game.findOneAndUpdate(
        { steamAppId: rawId },
        { avgRating, reviewCount }
      );
    }
  } catch (err) {
    console.warn('recalcAvgRating warning:', err.message);
  }
};

// Recalculate after save
// `return` matters: these hooks only declare the doc param (no `next`), so
// Mongoose treats a returned value as a promise to await before resolving
// save()/findOneAndDelete(). Without it, recalcAvgRating ran fire-and-forget
// and callers could read stale avgRating/reviewCount right after awaiting a
// review save/delete.
reviewSchema.post('save', function () {
  return this.constructor.recalcAvgRating(this.game);
});

// Recalculate after delete via a query (Model.findOneAndDelete/findByIdAndDelete)
reviewSchema.post('findOneAndDelete', function (doc) {
  if (doc) return doc.constructor.recalcAvgRating(doc.game);
});

// Recalculate after delete via a document instance (doc.deleteOne()) — this is
// the path reviewController.deleteReview actually uses. It's a *document*
// middleware event, separate from the query middleware above, so both hooks
// are needed to cover both ways a Review can be deleted.
reviewSchema.post('deleteOne', { document: true, query: false }, function () {
  return this.constructor.recalcAvgRating(this.game);
});

module.exports = mongoose.model('Review', reviewSchema);
