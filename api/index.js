// Ensure VERCEL flag is set so server.js doesn't call app.listen in serverless context
process.env.VERCEL = process.env.VERCEL || '1';
const { app } = require('../server/server');

module.exports = app;
