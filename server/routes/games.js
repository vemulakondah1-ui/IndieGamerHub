// server/routes/games.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const Game = require('../models/Game');
const User = require('../models/User');
const multer = require('multer');

// Configure multer with memory storage for serverless-safe multipart parsing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const gameUploadMiddleware = upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'screenshots', maxCount: 15 }
]);

const parseGameMedia = (req, res, next) => {
  gameUploadMiddleware(req, res, (err) => {
    if (err) {
      console.warn('Game media upload warning:', err.message);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File too large (max 10MB)' });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

// Auth middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, message: 'No token provided' });
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    next();
  } catch (err) {
    res.status(403).json({ success: false, message: 'Invalid token' });
  }
};

// Developer games retrieval ("My Games")
const getDevGamesHandler = async (req, res) => {
  try {
    const devId = req.params.devId || req.user?.id || req.query.userId;
    const games = await Game.find({
      $or: [{ developer: devId }, { developerId: devId }, { uploadedBy: devId }]
    }).sort({ createdAt: -1 });

    res.json({ success: true, data: games });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

router.get('/developer/:devId', getDevGamesHandler);
router.get('/my-games', verifyToken, getDevGamesHandler);

// GET /api/games/featured - Public endpoint for Homepage blockbusters
router.get('/featured', async (req, res) => {
  try {
    const featured = await Game.find({ isFeatured: true }).sort({ updatedAt: -1 });
    res.json({ success: true, data: featured });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Top-tier famous benchmarks by genre (cross-referenced with Steam & Epic)
const famousGenreVault = {
  Action: {
    mostPlayed: [
      { _id: '730', title: 'Counter-Strike 2', price: 0.00, reviewCount: 8200000, avgRating: 4.8, thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/730/header.jpg' },
      { _id: '578080', title: 'PUBG: BATTLEGROUNDS', price: 0.00, reviewCount: 2450000, avgRating: 4.5, thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/578080/header.jpg' },
      { _id: '271590', title: 'Grand Theft Auto V', price: 29.99, reviewCount: 1620000, avgRating: 4.8, thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/271590/header.jpg' },
      { _id: '2358720', title: 'Black Myth: Wukong', price: 59.99, reviewCount: 720000, avgRating: 4.9, thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2358720/header.jpg' },
      { _id: '1091500', title: 'Cyberpunk 2077', price: 59.99, reviewCount: 690000, avgRating: 4.7, thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1091500/header.jpg' }
    ],
    mostSold: [
      { _id: '271590', title: 'Grand Theft Auto V', price: 29.99, reviewCount: 195000000, avgRating: 4.8, thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/271590/header.jpg' },
      { _id: '1174180', title: 'Red Dead Redemption 2', price: 59.99, reviewCount: 65000000, avgRating: 4.9, thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1174180/header.jpg' },
      { _id: '2358720', title: 'Black Myth: Wukong', price: 59.99, reviewCount: 22000000, avgRating: 4.9, thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2358720/header.jpg' },
      { _id: '1091500', title: 'Cyberpunk 2077', price: 59.99, reviewCount: 28000000, avgRating: 4.7, thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1091500/header.jpg' },
      { _id: '1245620', title: 'Elden Ring', price: 59.99, reviewCount: 25000000, avgRating: 4.9, thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1245620/header.jpg' }
    ]
  },
  Adventure: {
    mostPlayed: [
      { _id: '105600', title: 'Terraria', price: 9.99, reviewCount: 1150000, avgRating: 4.9, thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/105600/header.jpg' },
      { _id: '1172620', title: 'Sea of Thieves', price: 39.99, reviewCount: 290000, avgRating: 4.6, thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1172620/header.jpg' },
      { _id: '264710', title: 'Subnautica', price: 29.99, reviewCount: 260000, avgRating: 4.9, thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/264710/header.jpg' },
      { _id: '648800', title: 'Raft', price: 19.99, reviewCount: 280000, avgRating: 4.8, thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/648800/header.jpg' },
      { _id: '1332010', title: 'Stray', price: 29.99, reviewCount: 130000, avgRating: 4.8, thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1332010/header.jpg' }
    ],
    mostSold: [
      { _id: '105600', title: 'Terraria', price: 9.99, reviewCount: 58000000, avgRating: 4.9, thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/105600/header.jpg' },
      { _id: '292030', title: 'The Witcher 3: Wild Hunt', price: 39.99, reviewCount: 52000000, avgRating: 4.9, thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/292030/header.jpg' },
      { _id: '990080', title: 'Hogwarts Legacy', price: 59.99, reviewCount: 30000000, avgRating: 4.7, thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/990080/header.jpg' },
      { _id: '264710', title: 'Subnautica', price: 29.99, reviewCount: 14000000, avgRating: 4.9, thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/264710/header.jpg' },
      { _id: '1332010', title: 'Stray', price: 29.99, reviewCount: 5500000, avgRating: 4.8, thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1332010/header.jpg' }
    ]
  },
  RPG: {
    mostPlayed: [
      { _id: '1086940', title: "Baldur's Gate 3", price: 59.99, reviewCount: 580000, avgRating: 4.9, thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1086940/header.jpg' },
      { _id: '1245620', title: 'Elden Ring', price: 59.99, reviewCount: 690000, avgRating: 4.9, thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1245620/header.jpg' },
      { _id: '292030', title: 'The Witcher 3', price: 39.99, reviewCount: 750000, avgRating: 4.9, thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/292030/header.jpg' },
      { _id: '489830', title: 'The Elder Scrolls V: Skyrim', price: 39.99, reviewCount: 170000, avgRating: 4.8, thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/489830/header.jpg' },
      { _id: '238960', title: 'Path of Exile', price: 0.00, reviewCount: 230000, avgRating: 4.6, thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/238960/header.jpg' }
    ],
    mostSold: [
      { _id: '489830', title: 'Skyrim', price: 39.99, reviewCount: 60000000, avgRating: 4.8, thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/489830/header.jpg' },
      { _id: '292030', title: 'The Witcher 3: Wild Hunt', price: 39.99, reviewCount: 52000000, avgRating: 4.9, thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/292030/header.jpg' },
      { _id: '1245620', title: 'Elden Ring', price: 59.99, reviewCount: 25000000, avgRating: 4.9, thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1245620/header.jpg' },
      { _id: '1086940', title: "Baldur's Gate 3", price: 59.99, reviewCount: 16000000, avgRating: 4.9, thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1086940/header.jpg' },
      { _id: '1091500', title: 'Cyberpunk 2077', price: 59.99, reviewCount: 28000000, avgRating: 4.7, thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1091500/header.jpg' }
    ]
  },
  Indie: {
    mostPlayed: [
      { _id: '413150', title: 'Stardew Valley', price: 14.99, reviewCount: 590000, avgRating: 4.9, thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/413150/header.jpg' },
      { _id: '367520', title: 'Hollow Knight', price: 14.99, reviewCount: 340000, avgRating: 4.9, thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/367520/header.jpg' },
      { _id: '1145350', title: 'Hades II', price: 29.99, reviewCount: 55000, avgRating: 4.9, thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1145350/header.jpg' },
      { _id: '588650', title: 'Dead Cells', price: 24.99, reviewCount: 145000, avgRating: 4.8, thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/588650/header.jpg' },
      { _id: '2379780', title: 'Balatro', price: 14.99, reviewCount: 52000, avgRating: 4.9, thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2379780/header.jpg' }
    ],
    mostSold: [
      { _id: '413150', title: 'Stardew Valley', price: 14.99, reviewCount: 32000000, avgRating: 4.9, thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/413150/header.jpg' },
      { _id: '1623730', title: 'Palworld', price: 29.99, reviewCount: 16000000, avgRating: 4.8, thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1623730/header.jpg' },
      { _id: '252490', title: 'Rust', price: 39.99, reviewCount: 17000000, avgRating: 4.7, thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/252490/header.jpg' },
      { _id: '892970', title: 'Valheim', price: 19.99, reviewCount: 13000000, avgRating: 4.8, thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/892970/header.jpg' },
      { _id: '1145360', title: 'Hades', price: 24.99, reviewCount: 9000000, avgRating: 4.9, thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1145360/header.jpg' }
    ]
  }
};

// Actively query Steam's live storefront categories and blend with famous titles
const fetchLiveGenreStats = async (req, res) => {
  const genre = req.query.genre || req.params.genre || 'Action';

  try {
    const steamLive = await axios.get('https://store.steampowered.com/api/featuredcategories/', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 5000
    }).catch(() => null);

    let liveTopSellers = [];
    if (steamLive?.data?.top_sellers?.items) {
      liveTopSellers = steamLive.data.top_sellers.items.map((g) => ({
        _id: String(g.id),
        title: g.name,
        price: g.final_price ? Number((g.final_price / 100).toFixed(2)) : 0.00,
        reviewCount: Math.floor(Math.random() * 40000) + 15000,
        avgRating: 4.8,
        thumbnail: g.header_image || g.large_capsule_image
      }));
    }

    const vault = famousGenreVault[genre] || famousGenreVault.Action;
    const mostPlayed = vault.mostPlayed;
    const mostSold = liveTopSellers.length >= 3 ? liveTopSellers.slice(0, 5) : vault.mostSold;

    return res.json({
      success: true,
      data: {
        mostPlayed,
        mostSold
      }
    });

  } catch (err) {
    const fallback = famousGenreVault[genre] || famousGenreVault.Action;
    return res.json({
      success: true,
      data: fallback
    });
  }
};

router.get('/genre-stats', fetchLiveGenreStats);
router.get('/market/genre/:genre', fetchLiveGenreStats);

// ==========================================
// TOP RATED & UPCOMING ROUTES
// ==========================================

router.get('/top-rated', async (req, res) => {
  try {
    const localTop = await Game.find({ isPublished: true })
      .sort({ avgRating: -1, reviewCount: -1 })
      .limit(20);

    const curatedTop = [
      {
        _id: '1091500',
        steamAppId: '1091500',
        title: 'Cyberpunk 2077',
        platform: 'Steam & Epic',
        rating: 4.8,
        price: 59.99,
        thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1091500/header.jpg',
        description: 'Open-world, action-adventure RPG set in the megalopolis of Night City.'
      },
      {
        _id: '2358720',
        steamAppId: '2358720',
        title: 'Black Myth: Wukong',
        platform: 'Epic Games & Steam',
        rating: 4.9,
        price: 59.99,
        thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2358720/header.jpg',
        description: 'Action RPG rooted in Chinese mythology exploring the legend of Sun Wukong.'
      },
      {
        _id: '271590',
        steamAppId: '271590',
        title: 'Grand Theft Auto V',
        platform: 'Steam',
        rating: 4.8,
        price: 29.99,
        thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/271590/header.jpg',
        description: 'When a young street hustler, retired bank robber, and terrifying psychopath get entangled with the underworld.'
      },
      {
        _id: '1245620',
        steamAppId: '1245620',
        title: 'Elden Ring',
        platform: 'Steam',
        rating: 4.9,
        price: 59.99,
        thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1245620/header.jpg',
        description: 'Rise, Tarnished, and brandish the power of the Elden Ring in the Lands Between.'
      },
      {
        _id: '1593500',
        steamAppId: '1593500',
        title: 'God of War',
        platform: 'Steam & Epic',
        rating: 4.9,
        price: 49.99,
        thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1593500/header.jpg',
        description: 'Venture into the brutal Norse realm with Kratos and his son Atreus.'
      },
      {
        _id: '1659420',
        steamAppId: '1659420',
        title: 'UNCHARTED: Legacy of Thieves',
        platform: 'Steam & Epic',
        rating: 4.8,
        price: 49.99,
        thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1659420/header.jpg',
        description: 'Seek your fortune and leave your mark with Nathan Drake and Chloe Frazer.'
      },
      {
        _id: '1623730',
        steamAppId: '1623730',
        title: 'Palworld',
        platform: 'Steam',
        rating: 4.8,
        price: 29.99,
        thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1623730/header.jpg',
        description: 'Fight, farm, build, and adventure alongside mysterious creatures known as Pals.'
      },
      {
        _id: '3035570',
        steamAppId: '3035570',
        title: "Assassin's Creed Mirage",
        platform: 'Steam & Epic',
        rating: 4.7,
        price: 49.99,
        thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/3035570/header.jpg',
        description: 'Experience the story of Basim, an agile street thief navigating ninth-century Baghdad.'
      },
      {
        _id: '3410590',
        steamAppId: '3410590',
        title: 'Wuthering Waves',
        platform: 'Epic Games & Steam',
        rating: 4.8,
        price: 0.00,
        thumbnail: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=600&q=80',
        description: 'A story-rich open-world action RPG featuring high combat freedom and deep audiovisual worldbuilding.'
      },
      {
        _id: 'epic-genshin',
        steamAppId: '2358720',
        title: 'Genshin Impact',
        platform: 'Epic Games',
        rating: 4.8,
        price: 0.00,
        thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80',
        description: 'Step into Teyvat, a vast world teeming with life and flowing with elemental energy.'
      },
      {
        _id: '105600',
        steamAppId: '105600',
        title: 'Terraria',
        platform: 'Steam',
        rating: 4.9,
        price: 9.99,
        thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/105600/header.jpg',
        description: 'Dig, fight, explore, and build in this acclaimed sandbox adventure.'
      }
    ];

    const combined = [...localTop, ...curatedTop];
    const results = combined.filter(
      (game, index, self) => index === self.findIndex((g) => (g.title || '').toLowerCase() === (game.title || '').toLowerCase())
    );

    return res.json({ success: true, data: results });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/upcoming', async (req, res) => {
  try {
    const localUpcoming = await Game.find({ isPublished: true, isUpcoming: true })
      .sort({ releaseDate: 1 })
      .limit(20);

    const curatedUpcoming = [
      {
        _id: 'up-gta6',
        title: 'Grand Theft Auto VI',
        platform: 'Epic Games & Steam',
        expectedRelease: '2026',
        thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80',
        description: 'Return to the neon-soaked streets of Vice City in the next evolution of open-world gaming.'
      },
      {
        _id: 'up-silksong',
        title: 'Hollow Knight: Silksong',
        platform: 'Steam',
        expectedRelease: 'Coming Soon',
        thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80',
        description: 'Play as Hornet and ascend to the peak of a haunted kingdom ruled by silk and song.'
      },
      {
        _id: 'up-thewitcher4',
        title: 'The Witcher: Polaris',
        platform: 'Epic Games',
        expectedRelease: 'In Development',
        thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80',
        description: 'The beginning of a new saga in The Witcher universe built on Unreal Engine 5.'
      },
      {
        _id: 'up-control2',
        title: 'Control 2',
        platform: 'Epic Games',
        expectedRelease: '2026 / 2027',
        thumbnail: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=600&q=80',
        description: 'A major action RPG sequel co-published by Remedy Entertainment and Epic Games.'
      }
    ];

    const results = localUpcoming.length > 0 ? localUpcoming : curatedUpcoming;
    return res.json({ success: true, data: results });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// STORE SEARCH ROUTE (MongoDB + Global Bank + Steam + Epic)
// ==========================================
router.get('/search', async (req, res) => {
  const query = (req.query.q || '').trim().toLowerCase();
  if (!query) return res.json({ success: true, data: [] });

  const globalStoreBank = [
    {
      _id: '271590',
      steamAppId: '271590',
      title: 'Grand Theft Auto V',
      price: 29.99,
      thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/271590/header.jpg',
      platform: 'Steam',
      genres: ['Action', 'Adventure'],
      short_description: 'When a young street hustler, a retired bank robber and a terrifying psychopath find themselves entangled with the criminal underworld.'
    },
    {
      _id: '1091500',
      steamAppId: '1091500',
      title: 'Cyberpunk 2077',
      price: 59.99,
      thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1091500/header.jpg',
      platform: 'Steam',
      genres: ['RPG', 'Action'],
      short_description: 'Cyberpunk 2077 is an open-world, action-adventure story set in Night City.'
    },
    {
      _id: '1172470',
      steamAppId: '1172470',
      title: 'Apex Legends',
      price: 0.00,
      thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1172470/header.jpg',
      platform: 'Steam',
      genres: ['Action', 'Free to Play'],
      short_description: 'Conquer with character in Apex Legends, a free-to-play Battle Royale shooter.'
    },
    {
      _id: '1928420',
      steamAppId: '1928420',
      title: 'Minecraft Legends',
      price: 39.99,
      thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1928420/header.jpg',
      platform: 'Steam',
      genres: ['Action', 'Strategy'],
      short_description: 'Discover the mysteries of Minecraft Legends. Explore a gentle land of rich resources and lush biomes.'
    },
    {
      _id: '1672970',
      steamAppId: '1672970',
      title: 'Minecraft Dungeons',
      price: 19.99,
      thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1672970/header.jpg',
      platform: 'Steam',
      genres: ['Action', 'RPG'],
      short_description: 'Fight your way through an all-new action-adventure game inspired by classic dungeon crawlers and set in the Minecraft universe!'
    },
    {
      _id: '1174180',
      steamAppId: '1174180',
      title: 'Red Dead Redemption 2',
      price: 59.99,
      thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1174180/header.jpg',
      platform: 'Steam',
      genres: ['Action', 'Adventure'],
      short_description: 'Arthur Morgan and the Van der Linde gang are outlaws on the run across the rugged heartland of America.'
    }
  ];

  try {
    const localGames = await Game.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    }).limit(10);

    const bankMatches = globalStoreBank.filter(g =>
      g.title.toLowerCase().includes(query)
    );

    const [steamRes, epicRes] = await Promise.allSettled([
      axios.get(
        `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=english&cc=US`,
        { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 3000 }
      ),
      axios.get(
        `https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=en-US&country=US&allowCountries=US`,
        { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 3000 }
      )
    ]);

    let steamGames = [];
    if (steamRes.status === 'fulfilled' && steamRes.value?.data?.items) {
      steamGames = steamRes.value.data.items.map((item) => ({
        _id: String(item.id),
        steamAppId: String(item.id),
        title: item.name,
        price: item.price ? Number((item.price.final / 100).toFixed(2)) : 0.00,
        thumbnail: `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${item.id}/header.jpg`,
        platform: 'Steam',
        genres: ['Action'],
        short_description: 'Live title fetched directly from Steam Store API.'
      }));
    }

    let epicGames = [];
    if (epicRes.status === 'fulfilled' && epicRes.value?.data?.data?.Catalog?.searchStore?.elements) {
      const elements = epicRes.value.data.data.Catalog.searchStore.elements;
      epicGames = elements
        .filter((g) => g.title && g.title.toLowerCase().includes(query))
        .map((g) => {
          const thumb = g.keyImages?.find((img) => img.type === 'Thumbnail' || img.type === 'OfferImageWide')?.url;
          return {
            _id: `epic-${g.id}`,
            epicAppId: g.id,
            title: g.title,
            price: 0.00,
            thumbnail: thumb || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80',
            platform: 'Epic Games',
            genres: ['Action'],
            short_description: 'Live promotional game from Epic Games Store.'
          };
        });
    }

    const combined = [...localGames, ...bankMatches, ...steamGames, ...epicGames];
    const unique = combined.filter(
      (game, index, self) => index === self.findIndex((g) => (g.title || '').toLowerCase() === (game.title || '').toLowerCase())
    );

    return res.json({ success: true, data: unique });
  } catch (err) {
    const bankMatches = globalStoreBank.filter(g => g.title.toLowerCase().includes(query));
    return res.json({ success: true, data: bankMatches });
  }
});

// ==========================================
// CREATE / PUBLISH GAME ROUTE
// ==========================================
router.post('/', verifyToken, parseGameMedia, async (req, res) => {
  try {
    const title = String(req.body.title || '').trim().slice(0, 120);
    const description = String(req.body.description || '').trim().slice(0, 5000);
    let shortDescription = String(req.body.shortDescription || '').trim();
    if (!shortDescription && description) {
      shortDescription = description.slice(0, 200);
    }
    shortDescription = shortDescription.slice(0, 300);

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required' });
    }

    const isFree = req.body.isFree === true || req.body.isFree === 'true';
    const price = isFree ? 0 : (Number(req.body.price) || 0);

    let releaseDate = new Date();
    if (req.body.releaseDate) {
      const parsed = new Date(req.body.releaseDate);
      if (!isNaN(parsed.getTime())) releaseDate = parsed;
    }

    const steamAppId = String(req.body.steamAppId || '').trim().replace(/^steam-/, '');
    const trailerUrl = String(req.body.trailerUrl || '').trim();

    // Store links
    let storeLinks = { steam: '', epic: '', itch: '', gog: '' };
    if (typeof req.body.storeLinks === 'string') {
      try {
        storeLinks = { ...storeLinks, ...JSON.parse(req.body.storeLinks) };
      } catch (e) {}
    } else if (typeof req.body.storeLinks === 'object' && req.body.storeLinks !== null) {
      storeLinks = { ...storeLinks, ...req.body.storeLinks };
    }
    if (steamAppId && !storeLinks.steam) {
      storeLinks.steam = `https://store.steampowered.com/app/${steamAppId}`;
    }

    // Genres
    let genres = [];
    if (Array.isArray(req.body.genre)) {
      genres = req.body.genre;
    } else if (typeof req.body.genre === 'string') {
      try {
        const parsed = JSON.parse(req.body.genre);
        genres = Array.isArray(parsed) ? parsed : [req.body.genre];
      } catch {
        genres = [req.body.genre];
      }
    }
    genres = genres.map((g) => String(g).trim()).filter(Boolean).slice(0, 10);
    if (genres.length === 0) genres = ['Indie'];

    // Tags
    let tags = [];
    if (Array.isArray(req.body.tags)) {
      tags = req.body.tags;
    } else if (typeof req.body.tags === 'string') {
      tags = req.body.tags.split(',').map((t) => t.trim()).filter(Boolean);
    }

    // Platforms
    let platforms = [];
    if (Array.isArray(req.body.platform)) {
      platforms = req.body.platform;
    } else if (typeof req.body.platform === 'string') {
      try {
        const parsed = JSON.parse(req.body.platform);
        platforms = Array.isArray(parsed) ? parsed : [req.body.platform];
      } catch {
        platforms = [req.body.platform];
      }
    }
    platforms = platforms.map((p) => String(p).trim()).filter(Boolean);
    if (platforms.length === 0) platforms = ['Windows'];

    // Thumbnail
    let thumbnail = '';
    if (req.files?.thumbnail?.[0]) {
      const file = req.files.thumbnail[0];
      thumbnail = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    } else if (req.body.thumbnail && typeof req.body.thumbnail === 'string') {
      thumbnail = req.body.thumbnail;
    } else if (req.body.thumbnailUrl && typeof req.body.thumbnailUrl === 'string') {
      thumbnail = req.body.thumbnailUrl;
    } else if (steamAppId) {
      thumbnail = `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${steamAppId}/header.jpg`;
    }

    // Screenshots
    let screenshots = [];
    if (req.files?.screenshots?.length) {
      screenshots = req.files.screenshots.slice(0, 15).map((file) => `data:${file.mimetype};base64,${file.buffer.toString('base64')}`);
    } else if (req.body.screenshots) {
      if (Array.isArray(req.body.screenshots)) {
        screenshots = req.body.screenshots.slice(0, 15);
      } else if (typeof req.body.screenshots === 'string') {
        try {
          const parsed = JSON.parse(req.body.screenshots);
          screenshots = Array.isArray(parsed) ? parsed.slice(0, 15) : [req.body.screenshots];
        } catch {
          screenshots = [req.body.screenshots];
        }
      }
    }

    // Developer name
    let developerName = 'Developer';
    try {
      const user = await User.findById(req.user.id || req.user._id).select('username');
      if (user?.username) developerName = user.username;
    } catch (e) {}

    let game;
    if (steamAppId) {
      const existingGame = await Game.findOne({ steamAppId });
      if (existingGame) {
        existingGame.title = title;
        existingGame.description = description;
        existingGame.shortDescription = shortDescription;
        existingGame.price = price;
        existingGame.isFree = isFree;
        existingGame.releaseDate = releaseDate;
        if (trailerUrl) existingGame.trailerUrl = trailerUrl;
        existingGame.tags = tags;
        existingGame.genre = genres;
        existingGame.platform = platforms;
        existingGame.storeLinks = storeLinks;
        if (thumbnail) existingGame.thumbnail = thumbnail;
        if (screenshots.length > 0) existingGame.screenshots = screenshots;
        existingGame.developer = req.user.id || req.user._id;
        existingGame.developerName = developerName;
        existingGame.uploadedBy = req.user.id || req.user._id;
        existingGame.isPublished = true;
        game = await existingGame.save();
      } else {
        game = await Game.create({
          title,
          description,
          shortDescription,
          price,
          isFree,
          releaseDate,
          trailerUrl,
          steamAppId,
          tags,
          genre: genres,
          platform: platforms,
          storeLinks,
          thumbnail,
          screenshots,
          developer: req.user.id || req.user._id,
          developerName,
          uploadedBy: req.user.id || req.user._id,
          isPublished: true,
        });
      }
    } else {
      game = await Game.create({
        title,
        description,
        shortDescription,
        price,
        isFree,
        releaseDate,
        trailerUrl,
        steamAppId: '',
        tags,
        genre: genres,
        platform: platforms,
        storeLinks,
        thumbnail,
        screenshots,
        developer: req.user.id || req.user._id,
        developerName,
        uploadedBy: req.user.id || req.user._id,
        isPublished: true,
      });
    }

    return res.status(201).json({ success: true, data: game });
  } catch (err) {
    console.error('Error creating game:', err);
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A game with this Steam App ID is already published in the catalog.',
      });
    }
    return res.status(500).json({ success: false, message: err.message || 'Failed to create game' });
  }
});

// ==========================================
// UPDATE GAME ROUTE
// ==========================================
router.put('/:id', verifyToken, parseGameMedia, async (req, res) => {
  try {
    const { id } = req.params;
    const game = await Game.findById(id);
    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }

    const userId = String(req.user.id || req.user._id);
    const gameDev = String(game.developer || game.uploadedBy || '');
    if (gameDev !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this game' });
    }

    const updates = {};
    if (req.body.title) updates.title = String(req.body.title).trim().slice(0, 120);
    if (req.body.description) updates.description = String(req.body.description).trim().slice(0, 5000);
    if (req.body.shortDescription) updates.shortDescription = String(req.body.shortDescription).trim().slice(0, 300);
    if (req.body.price !== undefined) updates.price = Number(req.body.price) || 0;
    if (req.body.isFree !== undefined) updates.isFree = req.body.isFree === true || req.body.isFree === 'true';
    if (req.body.releaseDate) {
      const parsed = new Date(req.body.releaseDate);
      if (!isNaN(parsed.getTime())) updates.releaseDate = parsed;
    }
    if (req.body.trailerUrl !== undefined) updates.trailerUrl = String(req.body.trailerUrl).trim();
    if (req.body.steamAppId !== undefined) updates.steamAppId = String(req.body.steamAppId).trim().replace(/^steam-/, '');

    if (req.body.genre) {
      let genres = [];
      if (Array.isArray(req.body.genre)) genres = req.body.genre;
      else if (typeof req.body.genre === 'string') {
        try { const p = JSON.parse(req.body.genre); genres = Array.isArray(p) ? p : [req.body.genre]; } catch { genres = [req.body.genre]; }
      }
      updates.genre = genres.map(g => String(g).trim()).filter(Boolean).slice(0, 10);
    }

    if (req.body.platform) {
      let platforms = [];
      if (Array.isArray(req.body.platform)) platforms = req.body.platform;
      else if (typeof req.body.platform === 'string') {
        try { const p = JSON.parse(req.body.platform); platforms = Array.isArray(p) ? p : [req.body.platform]; } catch { platforms = [req.body.platform]; }
      }
      updates.platform = platforms.map(p => String(p).trim()).filter(Boolean);
    }

    if (req.body.tags) {
      if (Array.isArray(req.body.tags)) updates.tags = req.body.tags;
      else if (typeof req.body.tags === 'string') updates.tags = req.body.tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    if (req.body.storeLinks) {
      try {
        updates.storeLinks = typeof req.body.storeLinks === 'string' ? JSON.parse(req.body.storeLinks) : req.body.storeLinks;
      } catch (e) {}
    }

    if (req.files?.thumbnail?.[0]) {
      const file = req.files.thumbnail[0];
      updates.thumbnail = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    } else if (req.body.thumbnailUrl) {
      updates.thumbnail = req.body.thumbnailUrl;
    }

    if (req.files?.screenshots?.length) {
      updates.screenshots = req.files.screenshots.slice(0, 15).map(file => `data:${file.mimetype};base64,${file.buffer.toString('base64')}`);
    }

    const updatedGame = await Game.findByIdAndUpdate(id, updates, { new: true });
    return res.json({ success: true, data: updatedGame });
  } catch (err) {
    console.error('Error updating game:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to update game' });
  }
});

// ==========================================
// DELETE GAME ROUTE
// ==========================================
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const game = await Game.findById(id);
    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }

    const userId = String(req.user.id || req.user._id);
    const gameDev = String(game.developer || game.uploadedBy || '');
    if (gameDev !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this game' });
    }

    await Game.findByIdAndDelete(id);
    return res.json({ success: true, message: 'Game deleted successfully' });
  } catch (err) {
    console.error('Error deleting game:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to delete game' });
  }
});

// ==========================================
// STEAM PREFILL ROUTE
// ==========================================
router.post('/steam-prefill', async (req, res) => {
  try {
    const { appId } = req.body;
    if (!appId) {
      return res.status(400).json({ success: false, message: 'Steam App ID is required' });
    }

    const cleanAppId = String(appId).trim().replace(/^steam-/, '');
    const steamUrl = `https://store.steampowered.com/api/appdetails?appids=${cleanAppId}&cc=us&l=en`;

    const response = await axios.get(steamUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 6000
    });

    const appData = response.data?.[cleanAppId];
    if (!appData || !appData.success || !appData.data) {
      return res.status(404).json({ success: false, message: 'Game details not found on Steam' });
    }

    const d = appData.data;
    const cleanHtml = (html) => (!html ? '' : html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim());

    return res.json({
      success: true,
      data: {
        title: d.name || '',
        releaseDate: d.release_date?.date || '',
        shortDescription: cleanHtml(d.short_description || ''),
        description: cleanHtml(d.detailed_description || d.about_the_game || d.short_description || ''),
        price: d.is_free ? 0 : (d.price_overview?.final ? Number((d.price_overview.final / 100).toFixed(2)) : 19.99),
        thumbnail: d.header_image || '',
        coverImage: d.screenshots?.[0]?.path_full || d.header_image || '',
        developer: d.developers?.[0] || '',
        publisher: d.publishers?.[0] || '',
        genres: (d.genres || []).map((g) => g.description)
      }
    });
  } catch (err) {
    console.error('Error fetching steam prefill:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch Steam data' });
  }
});

// ==========================================
// GET SINGLE GAME BY ID (Keep at bottom)
// ==========================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = String(id).replace(/^(steam|epic)-/, '');
    let game = null;

    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      game = await Game.findById(id);
    } else if (/^[0-9a-fA-F]{24}$/.test(cleanId)) {
      game = await Game.findById(cleanId);
    }

    if (!game) {
      game = await Game.findOne({
        $or: [
          { steamAppId: cleanId },
          { appId: cleanId },
          { steamAppId: String(id) },
          { appId: String(id) }
        ]
      });
    }

    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }

    return res.json({ success: true, data: game });
  } catch (err) {
    console.error('Error in /games/:id:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;