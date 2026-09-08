const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    thread: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Thread',
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
      minlength: [2, 'Post must be at least 2 characters'],
      maxlength: [3000, 'Post cannot exceed 3000 characters'],
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// After saving a post, increment thread postCount and update lastActivityAt
postSchema.post('save', async function () {
  const Thread = mongoose.model('Thread');
  await Thread.findByIdAndUpdate(this.thread, {
    $inc: { postCount: 1 },
    lastActivityAt: new Date(),
  });
});

// After deleting a post, decrement thread postCount
postSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    const Thread = mongoose.model('Thread');
    await Thread.findByIdAndUpdate(doc.thread, {
      $inc: { postCount: -1 },
    });
  }
});

module.exports = mongoose.model('Post', postSchema);
