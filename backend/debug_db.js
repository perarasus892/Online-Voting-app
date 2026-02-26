const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/online_voting_system';

async function checkDB() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const Log = mongoose.model('Log', new mongoose.Schema({}, { strict: false }));
        const ValidVoter = mongoose.model('ValidVoter', new mongoose.Schema({}, { strict: false }));

        const usersCount = await User.countDocuments({});
        console.log(`\n--- USERS (${usersCount}) ---`);
        const users = await User.find({}).limit(50);
        console.log(JSON.stringify(users, null, 2));

        const validVotersCount = await ValidVoter.countDocuments({});
        console.log(`\n--- VALID VOTERS (${validVotersCount}) ---`);
        const validVoters = await ValidVoter.find({}).limit(50);
        console.log(JSON.stringify(validVoters, null, 2));

        const logs = await Log.find({}).sort({ timestamp: -1 }).limit(20);
        console.log('\n--- RECENT LOGS ---');
        console.log(JSON.stringify(logs, null, 2));

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkDB();
