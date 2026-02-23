const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    if (req.method === 'POST') {
        console.log(`[POST] ${req.path} | Body:`, JSON.stringify(req.body));
    }
    next();
});

// ========== MongoDB Connection ==========
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/online_voting_system';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// ========== Schemas & Models ==========

const userSchema = new mongoose.Schema({
    id: { type: String, unique: true, required: true },
    mobile: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    voterId: { type: String },
    role: { type: String, default: 'voter' },
    hasVoted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

const electionSchema = new mongoose.Schema({
    id: { type: String, unique: true, required: true },
    title: { type: String, required: true },
    description: { type: String },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    status: { type: String, default: 'active' },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: String }
});
const Election = mongoose.model('Election', electionSchema);

const candidateSchema = new mongoose.Schema({
    id: { type: String, unique: true, required: true },
    electionId: { type: String, required: true },
    name: { type: String, required: true },
    party: { type: String, required: true },
    symbol: { type: String },
    photo: { type: String },
    slogan: { type: String },
    createdAt: { type: Date, default: Date.now }
});
const Candidate = mongoose.model('Candidate', candidateSchema);

const voteSchema = new mongoose.Schema({
    id: { type: String, unique: true, required: true },
    electionId: { type: String, required: true },
    candidateId: { type: String, required: true },
    userId: { type: String, required: true },
    receiptId: { type: String, unique: true, required: true },
    timestamp: { type: Date, default: Date.now }
});
const Vote = mongoose.model('Vote', voteSchema);

const validVoterSchema = new mongoose.Schema({
    voterId: { type: String, unique: true, required: true },
    name: { type: String },
    district: { type: String },
    constituency: { type: String },
    addedAt: { type: Date, default: Date.now },
    addedBy: { type: String },
    registered: { type: Boolean, default: false },
    registeredAt: { type: Date },
    userId: { type: String }
});
const ValidVoter = mongoose.model('ValidVoter', validVoterSchema);

const otpSchema = new mongoose.Schema({
    identifier: { type: String, required: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true }
});
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const OTP = mongoose.model('OTP', otpSchema);

const logSchema = new mongoose.Schema({
    type: { type: String, required: true }, // info, warning, danger, success
    category: { type: String, required: true }, // auth, election, vote, system
    message: { type: String, required: true },
    userId: { type: String },
    ip: { type: String },
    timestamp: { type: Date, default: Date.now }
});
const Log = mongoose.model('Log', logSchema);

async function addLog(type, category, message, userId = 'system', ip = 'internal') {
    try {
        const log = new Log({ type, category, message, userId, ip });
        await log.save();
        console.log(`📜 [LOG] ${category.toUpperCase()} | ${message}`);
    } catch (e) {
        console.error('Failed to save log:', e.message);
    }
}

// ========== Session Store (In-Memory) ==========
const sessions = new Map();

// ========== Helpers ==========
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateToken(userId) {
    return `session_${userId}_${crypto.randomBytes(16).toString('hex')}`;
}

// Simulated SMS Helper
async function sendSMS(mobile, otp) {
    console.log(`\n📱 [SMS SIMULATION] To: ${mobile} | Message: Your Voting System OTP is: ${otp}\n`);
}

async function seedAdmin() {
    try {
        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            const adminId = `admin_${Date.now()}`;
            const newAdmin = new User({
                id: adminId,
                mobile: '9999999999',
                password: 'admin',
                name: 'Primary Admin',
                role: 'admin'
            });
            await newAdmin.save();
            console.log('✅ Default admin created (Mobile: 9999999999 / Pass: admin)');
        }
    } catch (e) { console.error('[SEED ADMIN ERROR]', e.message); }
}

async function verifyAuth(authHeader) {
    if (!authHeader) return { error: 'No authorization header', user: null };
    const token = authHeader.split(' ')[1];
    if (!token) return { error: 'Invalid authorization format', user: null };

    if (sessions.has(token)) {
        const userData = sessions.get(token);
        return { error: null, user: userData };
    }

    return { error: 'Unauthorized', user: null };
}

// ========== Health ==========
app.get('/health', (req, res) => res.json({ status: 'ok', mode: 'mongodb' }));

// ========== AUTH ==========

app.post('/auth/signup', async (req, res) => {
    try {
        const { mobile, password, name, voterId, role = 'voter' } = req.body;
        if (!mobile) return res.status(400).json({ error: 'Missing field: mobile' });
        if (!password) return res.status(400).json({ error: 'Missing field: password' });
        if (!name) return res.status(400).json({ error: 'Missing field: name' });
        if (role === 'voter' && !voterId) return res.status(400).json({ error: 'Missing field: voterId' });

        const existingMobile = await User.findOne({ mobile });
        if (existingMobile) return res.status(400).json({ error: 'Mobile number already registered' });

        if (role === 'voter') {
            const existingVoter = await User.findOne({ voterId });
            if (existingVoter) return res.status(400).json({ error: 'Voter ID already registered' });

            await ValidVoter.findOneAndUpdate(
                { voterId },
                { voterId, name, registered: true, registeredAt: new Date() },
                { upsert: true }
            );
        }

        const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const user = new User({
            id: userId,
            mobile,
            password,
            name,
            voterId: role === 'voter' ? voterId : undefined,
            role,
            hasVoted: false
        });
        await user.save();
        await addLog('success', 'auth', `New user registered: ${name} (${mobile})`, userId);

        if (role === 'voter' && voterId) {
            await ValidVoter.updateOne({ voterId }, { userId: userId });
        }

        const otpCode = generateOTP();
        await OTP.findOneAndUpdate(
            { identifier: mobile },
            { code: otpCode, expiresAt: new Date(Date.now() + 300000) },
            { upsert: true }
        );

        await sendSMS(mobile, otpCode);

        return res.json({ success: true, message: 'User created.', userId, otp: otpCode });
    } catch (e) {
        console.error('[SIGNUP ERROR]', e.message);
        return res.status(500).json({ error: e.message });
    }
});

app.post('/auth/signin', async (req, res) => {
    try {
        const { email, password } = req.body;
        const input = email ? email.trim() : '';

        // Try finding by VoterID, then by Mobile
        const userAccount = await User.findOne({
            $or: [{ voterId: input }, { mobile: input }]
        });

        if (!userAccount || userAccount.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials. Please check your Voter ID/Mobile and password.' });
        }

        const token = generateToken(userAccount.id);
        sessions.set(token, userAccount.toObject());

        const otpCode = generateOTP();
        const mobile = userAccount.mobile;

        await OTP.findOneAndUpdate(
            { identifier: mobile },
            { code: otpCode, expiresAt: new Date(Date.now() + 300000) },
            { upsert: true }
        );

        await sendSMS(mobile, otpCode);
        await addLog('info', 'auth', `Login attempt: OTP sent to ${mobile}`, userAccount.id);

        return res.json({
            success: true,
            message: 'OTP sent to mobile',
            accessToken: token,
            user: { ...userAccount.toObject(), password: undefined },
            otp: otpCode
        });
    } catch (e) {
        console.error('[SIGNIN ERROR]', e.message);
        return res.status(500).json({ error: e.message });
    }
});

app.post('/auth/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ error: 'Mobile and OTP required' });

        const otpData = await OTP.findOne({ identifier: email });
        if (!otpData) return res.status(400).json({ error: 'OTP not found or expired' });
        if (otpData.code !== otp) return res.status(400).json({ error: 'Invalid OTP' });
        if (new Date() > otpData.expiresAt) {
            await OTP.deleteOne({ identifier: email });
            return res.status(400).json({ error: 'OTP expired' });
        }

        await OTP.deleteOne({ identifier: email });
        await addLog('success', 'auth', `OTP verified successfully for identifier: ${email}`);
        return res.json({ success: true, message: 'OTP verified successfully' });
    } catch (e) { return res.status(500).json({ error: e.message }); }
});

app.get('/auth/session', async (req, res) => {
    try {
        const { error, user } = await verifyAuth(req.headers.authorization);
        if (error || !user) return res.status(401).json({ error: 'Unauthorized' });
        return res.json({ user: { ...user, password: undefined } });
    } catch (e) { return res.status(500).json({ error: e.message }); }
});

// ========== ELECTIONS ==========
app.get('/elections', async (req, res) => {
    try {
        const { error, user } = await verifyAuth(req.headers.authorization);
        if (error || !user) return res.status(401).json({ error: 'Unauthorized' });
        const elections = await Election.find({ status: 'active' }).sort({ createdAt: -1 });
        return res.json({ elections });
    } catch (e) { return res.status(500).json({ error: e.message }); }
});

app.get('/elections/:id', async (req, res) => {
    try {
        const { error, user } = await verifyAuth(req.headers.authorization);
        if (error || !user) return res.status(401).json({ error: 'Unauthorized' });
        const election = await Election.findOne({ id: req.params.id });
        if (!election) return res.status(404).json({ error: 'Election not found' });
        return res.json({ election });
    } catch (e) { return res.status(500).json({ error: e.message }); }
});

app.post('/elections', async (req, res) => {
    try {
        const { error, user } = await verifyAuth(req.headers.authorization);
        if (error || !user) return res.status(401).json({ error: 'Unauthorized' });
        if (user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

        const { title, description, startDate, endDate } = req.body;
        if (!title || !startDate || !endDate) return res.status(400).json({ error: 'Missing required fields' });

        const electionId = `election_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const election = new Election({
            id: electionId,
            title,
            description,
            startDate,
            endDate,
            createdBy: user.id
        });
        await election.save();
        return res.json({ success: true, election });
    } catch (e) { return res.status(500).json({ error: e.message }); }
});

// ========== CANDIDATES ==========
app.get('/elections/:electionId/candidates', async (req, res) => {
    try {
        const { error, user } = await verifyAuth(req.headers.authorization);
        if (error || !user) return res.status(401).json({ error: 'Unauthorized' });
        const candidates = await Candidate.find({ electionId: req.params.electionId });
        return res.json({ candidates });
    } catch (e) { return res.status(500).json({ error: e.message }); }
});

app.post('/candidates', async (req, res) => {
    try {
        const { error, user } = await verifyAuth(req.headers.authorization);
        if (error || !user) return res.status(401).json({ error: 'Unauthorized' });
        if (user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

        const { electionId, name, party, symbol, photo, slogan } = req.body;
        if (!electionId || !name || !party) return res.status(400).json({ error: 'Missing required fields' });

        const candidateId = `candidate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const candidate = new Candidate({
            id: candidateId,
            electionId,
            name,
            party,
            symbol,
            photo,
            slogan
        });
        await candidate.save();
        return res.json({ success: true, candidate });
    } catch (e) { return res.status(500).json({ error: e.message }); }
});

// ========== VOTES ==========
app.get('/elections/:electionId/vote-status', async (req, res) => {
    try {
        const { error, user } = await verifyAuth(req.headers.authorization);
        if (error || !user) return res.status(401).json({ error: 'Unauthorized' });
        const vote = await Vote.findOne({ userId: user.id, electionId: req.params.electionId });
        return res.json({ hasVoted: !!vote });
    } catch (e) { return res.status(500).json({ error: e.message }); }
});

app.post('/votes', async (req, res) => {
    try {
        const { error, user } = await verifyAuth(req.headers.authorization);
        if (error || !user) return res.status(401).json({ error: 'Unauthorized' });
        if (user.role !== 'voter') return res.status(403).json({ error: 'Only voters can cast votes' });

        const { electionId, candidateId } = req.body;
        if (!electionId || !candidateId) return res.status(400).json({ error: 'Missing required fields' });

        const existingVote = await Vote.findOne({ userId: user.id, electionId });
        if (existingVote) return res.status(400).json({ error: 'You have already voted in this election' });

        const election = await Election.findOne({ id: electionId });
        if (!election) return res.status(404).json({ error: 'Election not found' });

        const candidate = await Candidate.findOne({ id: candidateId, electionId });
        if (!candidate) return res.status(400).json({ error: 'Invalid candidate' });

        const voteId = `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const receiptId = `receipt_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        const vote = new Vote({
            id: voteId,
            electionId,
            candidateId,
            userId: user.id,
            receiptId
        });
        await vote.save();

        await User.updateOne({ id: user.id }, { hasVoted: true });
        user.hasVoted = true;
        await addLog('success', 'vote', `Vote cast in election ${electionId} by user ${user.id}`, user.id);

        return res.json({ success: true, message: 'Vote cast successfully', receipt: { receiptId, electionId, timestamp: vote.timestamp } });
    } catch (e) { return res.status(500).json({ error: e.message }); }
});

app.post('/votes/verify', async (req, res) => {
    try {
        const { error, user } = await verifyAuth(req.headers.authorization);
        if (error || !user) return res.status(401).json({ error: 'Unauthorized' });
        const { receiptId } = req.body;
        if (!receiptId) return res.status(400).json({ error: 'Receipt ID required' });
        const vote = await Vote.findOne({ receiptId });
        if (!vote) return res.json({ verified: false, message: 'Receipt not found' });
        return res.json({ verified: true, message: 'Vote verified successfully', electionId: vote.electionId });
    } catch (e) { return res.status(500).json({ error: e.message }); }
});

// ========== RESULTS ==========
app.get('/elections/:electionId/results', async (req, res) => {
    try {
        const { error, user } = await verifyAuth(req.headers.authorization);
        if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

        const election = await Election.findOne({ id: req.params.electionId });
        if (!election) return res.status(404).json({ error: 'Election not found' });

        const candidates = await Candidate.find({ electionId: req.params.electionId });
        const results = await Promise.all(candidates.map(async c => {
            const votesCount = await Vote.countDocuments({ electionId: req.params.electionId, candidateId: c.id });
            return { ...c.toObject(), votes: votesCount };
        }));

        const totalVotes = results.reduce((s, c) => s + c.votes, 0);
        results.sort((a, b) => b.votes - a.votes);

        const eligibleVoters = await ValidVoter.countDocuments();
        const voterTurnout = eligibleVoters > 0 ? parseFloat(((totalVotes / eligibleVoters) * 100).toFixed(1)) : 0;

        return res.json({ election, results, totalVotes, eligibleVoters, voterTurnout });
    } catch (e) { return res.status(500).json({ error: e.message }); }
});

// ========== ADMIN STUFF ==========
app.get('/admin/stats', async (req, res) => {
    try {
        const { error, user } = await verifyAuth(req.headers.authorization);
        if (error || !user) return res.status(401).json({ error: 'Unauthorized' });
        if (user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

        const votersList = await User.countDocuments({ role: 'voter' });
        const votedList = await User.countDocuments({ role: 'voter', hasVoted: true });
        const electionCount = await Election.countDocuments();
        const voteCount = await Vote.countDocuments();

        return res.json({
            stats: {
                totalVoters: votersList,
                activeElections: await Election.countDocuments({ status: 'active' }),
                totalVotes: voteCount,
                voterTurnout: votersList ? ((votedList / votersList) * 100).toFixed(1) : 0
            }
        });
    } catch (e) { return res.status(500).json({ error: e.message }); }
});

app.get('/admin/users', async (req, res) => {
    try {
        const { error, user } = await verifyAuth(req.headers.authorization);
        if (error || !user) return res.status(401).json({ error: 'Unauthorized' });
        if (user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

        const users = await User.find({ role: 'voter' }).sort({ createdAt: -1 });
        return res.json({ users });
    } catch (e) { return res.status(500).json({ error: e.message }); }
});

app.get('/admin/vote-records', async (req, res) => {
    try {
        const { error, user } = await verifyAuth(req.headers.authorization);
        if (error || !user) return res.status(401).json({ error: 'Unauthorized' });
        if (user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

        const votes = await Vote.find().sort({ timestamp: -1 }).limit(50);
        // Enrich with user and election info
        const records = await Promise.all(votes.map(async v => {
            const voter = await User.findOne({ id: v.userId });
            const election = await Election.findOne({ id: v.electionId });
            return {
                id: v.id,
                voterId: voter?.voterId || 'Unknown',
                name: voter?.name || 'Unknown',
                election: election?.title || 'Unknown',
                timestamp: v.timestamp
            };
        }));
        return res.json({ voteRecords: records });
    } catch (e) { return res.status(500).json({ error: e.message }); }
});

app.get('/admin/valid-voters', async (req, res) => {
    try {
        const { error, user } = await verifyAuth(req.headers.authorization);
        if (error || !user) return res.status(401).json({ error: 'Unauthorized' });
        if (user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

        const validVoters = await ValidVoter.find().sort({ addedAt: -1 });
        return res.json({ validVoters });
    } catch (e) { return res.status(500).json({ error: e.message }); }
});

app.post('/admin/valid-voters', async (req, res) => {
    try {
        const { error, user } = await verifyAuth(req.headers.authorization);
        if (error || !user) return res.status(401).json({ error: 'Unauthorized' });
        if (user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

        const { voters } = req.body;
        if (!Array.isArray(voters)) return res.status(400).json({ error: 'Invalid input' });

        for (const v of voters) {
            await ValidVoter.updateOne(
                { voterId: v.voterId },
                { $set: { ...v, addedBy: user.id } },
                { upsert: true }
            );
        }

        return res.json({ success: true });
    } catch (e) { return res.status(500).json({ error: e.message }); }
});

// Seed an admin for testing
async function seedAdmin() {
    const adminId = 'admin_primary';
    const adminEmail = 'admin@voting.gov';
    const adminPass = 'admin';

    await User.findOneAndUpdate(
        { id: adminId },
        {
            id: adminId,
            email: adminEmail,
            password: adminPass,
            name: 'System Admin',
            role: 'admin'
        },
        { upsert: true, new: true }
    );
    console.log('✅ Admin credentials synchronized (' + adminEmail + ' / ' + adminPass + ')');
}

// ========== INIT DATA ==========
app.post('/init', async (req, res) => {
    try {
        // Clear existing data (optional, but good for a fresh start)
        await Election.deleteMany({});
        await Candidate.deleteMany({});

        // 1. Create a sample election
        const electionId = `election_sample_${Date.now()}`;
        const election = new Election({
            id: electionId,
            title: 'National Election 2026',
            description: 'The primary general election for National Council representatives.',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days from now
            status: 'active',
            createdBy: 'admin_primary'
        });
        await election.save();

        // 2. Create sample candidates
        const candidates = [
            {
                id: `cand_1_${Date.now()}`,
                electionId: electionId,
                name: 'Alice Johnson',
                party: 'Progressive Party',
                symbol: '🌟',
                slogan: 'Building a Better Future'
            },
            {
                id: `cand_2_${Date.now()}`,
                electionId: electionId,
                name: 'Bob Smith',
                party: 'Unity Alliance',
                symbol: '🤝',
                slogan: 'Stronger Together'
            }
        ];

        for (const c of candidates) {
            const candidate = new Candidate(c);
            await candidate.save();
        }

        console.log('✅ Database initialized with sample election and candidates.');
        return res.json({ success: true, message: 'Database initialized with sample data' });
    } catch (e) {
        console.error('[INIT ERROR]', e.message);
        return res.status(500).json({ error: e.message });
    }
});

app.get('/admin/logs', async (req, res) => {
    try {
        const { error, user } = await verifyAuth(req.headers.authorization);
        if (error || !user || user.role !== 'admin') return res.status(401).json({ error: 'Unauthorized' });

        const logs = await Log.find().sort({ timestamp: -1 }).limit(100);
        return res.json({ logs });
    } catch (e) { return res.status(500).json({ error: e.message }); }
});

// ========== DEBUG ==========
app.post('/debug/reset-system', async (req, res) => {
    try {
        await User.deleteMany({ id: { $ne: 'admin_primary' } });
        await Election.deleteMany({});
        await Candidate.deleteMany({});
        await Vote.deleteMany({});
        await ValidVoter.deleteMany({});
        await OTP.deleteMany({});
        sessions.clear();
        console.log('[RESET] MongoDB system reset complete');
        return res.json({ success: true });
    } catch (e) { return res.status(500).json({ error: e.message }); }
});

// ========== Start ==========
const PORT = 3002;
app.listen(PORT, async () => {
    console.log(`\n🚀 Online Voting System Backend - http://localhost:${PORT}`);
    console.log(`   Mode: 🍃 MONGODB DATABASE (via Mongoose)`);
    await seedAdmin();
});
