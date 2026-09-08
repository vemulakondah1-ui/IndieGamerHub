const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getGameThreads, createThread, getThread, deleteThread,
  getThreadPosts, createPost, updatePost, deletePost,
} = require('../controllers/forumController');
const protect = require('../middleware/protect');

// Game-nested thread routes: /api/games/:gameId/threads
router.get('/games/:gameId/threads', getGameThreads);
router.post('/games/:gameId/threads', protect, createThread);

// Thread routes: /api/threads/:id
router.get('/threads/:id', getThread);
router.delete('/threads/:id', protect, deleteThread);

// Post routes: /api/threads/:threadId/posts
router.get('/threads/:threadId/posts', getThreadPosts);
router.post('/threads/:threadId/posts', protect, createPost);

// /api/posts/:id
router.put('/posts/:id', protect, updatePost);
router.delete('/posts/:id', protect, deletePost);

module.exports = router;
