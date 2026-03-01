const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/online_voting_system';

async function findAdmin() {
    try {
        await mongoose.connect(MONGODB_URI);
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const admin = await User.findOne({ role: 'admin' });
        if (admin) {
            console.log('Admin Found:');
            console.log(JSON.stringify(admin, null, 2));
        } else {
            console.log('No admin found.');
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

findAdmin();
