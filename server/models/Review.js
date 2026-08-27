const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game',
      required: true,
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
      minlength: [10, 'Review must be at least 10 characters'],
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

// Static method to recalculate avgRating
reviewSchema.statics.recalcAvgRating = async function (gameId) {
  const Game = mongoose.model('Game');
  const result = await this.aggregate([
    { $match: { game: new mongoose.Types.ObjectId(gameId) } },
    {
      $group: {
        _id: '$game',
        avgRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  if (result.length > 0) {
    await Game.findByIdAndUpdate(gameId, {
      avgRating: Math.round(result[0].avgRating * 10) / 10,
      reviewCount: result[0].reviewCount,
    });
  } else {
    await Game.findByIdAndUpdate(gameId, { avgRating: 0, reviewCount: 0 });
  }
};

// Recalculate after save
reviewSchema.post('save', function () {
  this.constructor.recalcAvgRating(this.game);
});

// Recalculate after delete
reviewSchema.post('findOneAndDelete', function (doc) {
  if (doc) doc.constructor.recalcAvgRating(doc.game);
});

module.exports = mongoose.model('Review', reviewSchema);
