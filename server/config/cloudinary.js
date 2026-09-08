const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Dynamic storage factory
const createStorage = (folder, transformations) =>
  new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `indiegamerhub/${folder}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: transformations,
    },
  });

const screenshotStorage = createStorage('screenshots', [
  { width: 1280, height: 720, crop: 'limit', quality: 'auto' },
]);

const thumbnailStorage = createStorage('thumbnails', [
  { width: 460, height: 215, crop: 'fill', quality: 'auto' },
]);

const avatarStorage = createStorage('avatars', [
  { width: 200, height: 200, crop: 'fill', gravity: 'face' },
]);

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
});

// Game media: handles both thumbnail and screenshots fields
const gameMediaStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: file.fieldname === 'thumbnail'
      ? 'indiegamerhub/thumbnails'
      : 'indiegamerhub/screenshots',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: file.fieldname === 'thumbnail'
      ? [{ width: 460, height: 215, crop: 'fill', quality: 'auto' }]
      : [{ width: 1280, height: 720, crop: 'limit', quality: 'auto' }],
  }),
});

const uploadGameFiles = multer({
  storage: gameMediaStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
}).fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'screenshots', maxCount: 10 },
]);

module.exports = { cloudinary, uploadAvatar, uploadGameFiles };
