// server/fixAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // Adjust path to your User model if needed

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/indiegamerhub')
    .then(async () => {
        const hashedPassword = await bcrypt.hash('IndieHub2026!', 10);

        const result = await User.findOneAndUpdate(
            { email: 'indieadmin@indiegamerhub.com' },
            {
                password: hashedPassword,
                role: 'admin',
                isAdmin: true
            },
            { upsert: true, new: true }
        );

        console.log('Admin account successfully reset/created:', result.email);
        process.exit();
    })
    .catch(err => {
        console.error('Database connection error:', err);
        process.exit(1);
    });