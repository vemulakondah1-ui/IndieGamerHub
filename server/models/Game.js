const mongoose = require('mongoose');

const storeLinksSchema = new mongoose.Schema({
  steam: { type: String, default: '' },
  epic: { type: String, default: '' },
  itch: { type: String, default: '' },
  gog: { type: String, default: '' },
}, { _id: false });

const gameSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Game title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    shortDescription: {
      type: String,
      maxlength: [300, 'Short description cannot exceed 300 characters'],
      default: '',
    },
    genre: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 10,
        message: 'Cannot have more than 10 genres',
      },
    },
    tags: {
      type: [String],
      default: [],
    },
    releaseDate: {
      type: Date,
    },
    developer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    developerName: {
      type: String,
      default: '',
    },
    thumbnail: {
      type: String,
      default: '',
    },
    screenshots: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 15,
        message: 'Cannot have more than 15 screenshots',
      },
    },
    trailerUrl: {
      type: String,
      default: '',
    },
    storeLinks: {
      type: storeLinksSchema,
      default: () => ({}),
    },
    steamAppId: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    isFree: {
      type: Boolean,
      default: false,
    },
    avgRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    platform: {
      type: [String],
      enum: ['Windows', 'Mac', 'Linux', 'Web', 'Android', 'iOS'],
      default: ['Windows'],
    },
  },
  { timestamps: true }
);

// Text index for full-text search
gameSchema.index({ title: 'text', description: 'text', tags: 'text' });
// Index for trending query performance
gameSchema.index({ createdAt: -1 });
gameSchema.index({ avgRating: -1 });
gameSchema.index({ releaseDate: 1 });

module.exports = mongoose.model('Game', gameSchema);
