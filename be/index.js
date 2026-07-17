require('dotenv').config();
const dns = require('dns');
// Workaround for Cloudflare WARP local DNS SRV resolution failure
if (process.env.MONGODB_URI && process.env.MONGODB_URI.startsWith('mongodb+srv')) {
    try {
        dns.setServers(['8.8.8.8', '8.8.4.4']);
        console.log('DNS resolvers set to 8.8.8.8 for MongoDB Atlas');
    } catch (err) {
        console.warn('Failed to set custom DNS servers:', err);
    }
}
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./user');
const {
    login,
    logout,
    createAdmin,
    getUsers,
    deleteUser,
    createDonationRecord,
    getDonationRecords,
    getDonationRecordById,
    updateDonationRecord,
    deleteDonationRecord,
    exportDonationsCSV
} = require('./controller');

const { authenticateJWT, requireRole } = require('./middleware/auth');
const { donationCreateSchema, donationUpdateSchema, validateBody } = require('./middleware/validation');

const app = express();

// Enable CORS for dev server and the deployed application
app.use(cors({
    origin: ['https://ucpyayblood.vercel.app', 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Seed Owner Account
const seedOwnerAccount = async () => {
    try {
        const ownerExists = await User.findOne({ role: 'owner' });
        if (!ownerExists) {
            console.log('Seeding owner account...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('Owner123#', salt);
            
            const owner = new User({
                username: 'owner',
                password: hashedPassword,
                role: 'owner'
            });
            await owner.save();
            console.log('Owner account seeded successfully (owner / Owner123#).');
        } else {
            console.log('Owner account already exists.');
        }
    } catch (err) {
        console.error('Error seeding owner account:', err);
    }
};

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bloodDonation';
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('MongoDB connected');
        seedOwnerAccount();
    })
    .catch(err => console.error('MongoDB connection error:', err));

// --- RESTful API Routes ---

// Auth Routes
app.post('/api/auth/login', login);
app.post('/api/auth/logout', logout);

// User Management (Owner only)
app.post('/api/users', authenticateJWT, requireRole('owner'), createAdmin);
app.get('/api/users', authenticateJWT, requireRole('owner'), getUsers);
app.delete('/api/users/:id', authenticateJWT, requireRole('owner'), deleteUser);

// Donations Routes
// Public Creation
app.post('/api/donations', validateBody(donationCreateSchema), createDonationRecord);

// Private CRUD
app.get('/api/donations', authenticateJWT, requireRole(['owner', 'admin']), getDonationRecords);
app.get('/api/donations/export', authenticateJWT, requireRole('owner'), exportDonationsCSV);
app.get('/api/donations/:id', authenticateJWT, requireRole(['owner', 'admin']), getDonationRecordById);
app.put('/api/donations/:id', authenticateJWT, requireRole(['owner', 'admin']), validateBody(donationUpdateSchema), updateDonationRecord);
app.delete('/api/donations/:id', authenticateJWT, requireRole('owner'), deleteDonationRecord);

// Fallback to match existing non-RESTful APIs for backward compatibility (if any)
app.post('/create', validateBody(donationCreateSchema), createDonationRecord);
app.get('/get', authenticateJWT, requireRole(['owner', 'admin']), getDonationRecords);
app.get('/get/:id', authenticateJWT, requireRole(['owner', 'admin']), getDonationRecordById);
app.put('/update/:id', authenticateJWT, requireRole(['owner', 'admin']), validateBody(donationUpdateSchema), updateDonationRecord);
app.delete('/delete/:id', authenticateJWT, requireRole('owner'), deleteDonationRecord);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});