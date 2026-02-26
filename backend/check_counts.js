const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/online_voting_system';

async function run() {
    try {
        await mongoose.connect(MONGODB_URI);
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('--- DATABASE RESOURCE SUMMARY ---');
        for (const col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments();
            console.log(`${col.name}: ${count} documents`);
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err.message);
    }
}

run();
