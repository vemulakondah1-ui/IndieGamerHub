import api, { publicApi } from './api';

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
};

export const gameService = {
  getGames: (params) => api.get('/games', { params }),
  getFeatured: () => api.get('/games/featured'),
  getTrending: () => api.get('/games/trending'),
  getUpcoming: () => api.get('/games/upcoming'),
  getGenres: () => api.get('/games/genres'),
  getBestSelling: (limit = 10) => api.get('/games/best-selling', { params: { limit } }),
  getGenreStats: (genre) => api.get('/games/genre-stats', { params: { genre } }),
  getGame: (id) => api.get(`/games/${id}`),
  getDeveloperGames: (devId) => api.get(`/games/developer/${devId}`),
  createGame: (data) => api.post('/games', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateGame: (id, data) => api.put(`/games/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteGame: (id) => api.delete(`/games/${id}`),
  steamPrefill: (appId) => api.post('/games/steam-prefill', { appId }),
  toggleFeatured: (id) => api.put(`/games/${id}/feature`),
};

export const reviewService = {
  getGameReviews: (gameId, params) => api.get(`/games/${gameId}/reviews`, { params }),
  getMyReview: (gameId) => api.get(`/games/${gameId}/reviews/my`),
  createReview: (gameId, data) => api.post(`/games/${gameId}/reviews`, data),
  updateReview: (id, data) => api.put(`/reviews/${id}`, data),
  deleteReview: (id) => api.delete(`/reviews/${id}`),
};

export const forumService = {
  getGameThreads: (gameId, params) => api.get(`/games/${gameId}/threads`, { params }),
  createThread: (gameId, data) => api.post(`/games/${gameId}/threads`, data),
  getThread: (id) => api.get(`/threads/${id}`),
  deleteThread: (id) => api.delete(`/threads/${id}`),
  getThreadPosts: (threadId, params) => api.get(`/threads/${threadId}/posts`, { params }),
  createPost: (threadId, data) => api.post(`/threads/${threadId}/posts`, data),
  updatePost: (id, data) => api.put(`/posts/${id}`, data),
  deletePost: (id) => api.delete(`/posts/${id}`),
};

export const adminService = {
  getStats: () => api.get('/admin/stats'),
  getGames: (params) => api.get('/admin/games', { params }),
  toggleFeatured: (id) => api.put(`/admin/games/${id}/feature`),
  togglePublished: (id) => api.put(`/admin/games/${id}/publish`),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  toggleUserStatus: (id) => api.put(`/admin/users/${id}/status`),
};

export const steamService = {
  getHomepage:    () => publicApi.get('/steam/homepage'),
  getTrending:    () => publicApi.get('/steam/trending'),
  getSales:       () => publicApi.get('/steam/sales'),
  getUpcoming:    () => publicApi.get('/steam/upcoming'),
  getNewReleases: () => publicApi.get('/steam/new'),
  search:         (q) => publicApi.get('/steam/search', { params: { q } }),
  getByGenre:     (tag) => publicApi.get('/steam/genre', { params: { tag } }),
  getApp:         (appId) => publicApi.get(`/steam/app/${appId}`),
  getAppReviews:  (appId, cursor) => publicApi.get(`/steam/app/${appId}/reviews`, { params: cursor ? { cursor } : {} }),
  getPlayerCount: (appId) => publicApi.get(`/steam/app/${appId}/players`),
  verifySteamId:  (steamId) => publicApi.post('/steam/verify', { steamId }),
};

