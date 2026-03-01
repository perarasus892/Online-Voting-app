const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/online_voting_system';

async function checkSystem() {
    console.log('🔍 Starting System Integrity Check...');
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB Connection: OK');

        const collections = await mongoose.connection.db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        console.log('📦 Collections found:', collectionNames.join(', '));

        // Define schemas for internal check
        const User = mongoose.model('User', new mongoose.Schema({ id: String, role: String, voterId: String }));
        const Announcement = mongoose.model('Announcement', new mongoose.Schema({ id: String, title: String }));
        const Election = mongoose.model('Election', new mongoose.Schema({ id: String, status: String }));

        const adminCount = await User.countDocuments({ role: 'admin' });
        console.log(`👤 Admin Users: ${adminCount} ${adminCount > 0 ? '✅' : '❌ (Warning: No admin found)'}`);

        const announcementCount = await Announcement.countDocuments();
        console.log(`📢 Announcements: ${announcementCount} ${collectionNames.includes('announcements') ? '✅' : '❓ (Collection missing)'}`);

        const activeElections = await Election.countDocuments({ status: 'active' });
        console.log(`🗳️ Active Elections: ${activeElections}`);

        console.log('\n✨ System Check Complete.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Integrity Check Failed:', error.message);
        process.exit(1);
    }
}

checkSystem();
