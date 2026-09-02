const router = require('express').Router();
const axios = require('axios');

// Fetch live featured & top games directly from Steam's public store endpoint
router.get('/homepage', async (req, res) => {
    try {
        // Steam's featured categories endpoint
        const response = await axios.get('https://store.steampowered.com/api/featured/');

        if (response.data && response.data.featured_win) {
            // Extract live games from Steam's response
            const liveGames = response.data.featured_win.map(game => ({
                _id: game.id.toString(),
                title: game.name,
                short_description: game.short_description || 'Explore this top title live from Steam.',
                price_overview: {
                    final_formatted: game.final_price ? `$${(game.final_price / 100).toFixed(2)}` : 'Free'
                },
                header_image: game.large_capsule_image || game.header_image
            }));

            return res.json({ success: true, data: liveGames });
        }

        res.status(400).json({ success: false, message: 'Could not parse Steam featured data' });
    } catch (error) {
        console.error('Steam API Fetch Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch live games from Steam' });
    }
});

// Fetch general games catalog/search from Steam
router.get('/games', async (req, res) => {
    try {
        const response = await axios.get('https://store.steampowered.com/api/featured/');
        if (response.data) {
            // Combine multiple categories (windows, specials, coming soon) into one live pool
            const rawPool = [
                ...(response.data.featured_win || []),
                ...(response.data.coming_soon || [])
            ];

            const formattedGames = rawPool.map((game, index) => ({
                _id: (game.id || index).toString(),
                title: game.name,
                platform: 'Steam',
                genre: 'Action', // Default tag mapping
                short_description: game.short_description || 'Fetched live from Steam Store API.',
                price: game.final_price ? `$${(game.final_price / 100).toFixed(2)}` : '$14.99',
                thumbnail: game.large_capsule_image || game.header_image
            }));

            return res.json({ success: true, data: formattedGames });
        }
        res.status(404).json({ success: false, message: 'No games found' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Steam API error' });
    }
});

module.exports = router;