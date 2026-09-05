require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User'); // Adjust path to your User model if needed

async function promoteToAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const updatedUser = await User.findOneAndUpdate(
            { username: 'indieadmin' },
            { role: 'admin' },
            { new: true }
        );

        if (updatedUser) {
            console.log('Successfully promoted user to admin:', updatedUser);
        } else {
            console.log('User "indieadmin" not found in database.');
        }
        process.exit(0);
    } catch (error) {
        console.error('Error updating user role:', error);
        process.exit(1);
    }
}

promoteToAdmin();