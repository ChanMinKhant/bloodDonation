require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Add CORS
const {createDonationRecord, getDonationRecords, getDonationRecordById, updateDonationRecord, deleteDonationRecord} = require('./controller');
const mongoose = require('mongoose');

const app = express();
app.use(cors()); // Enable CORS for any origin (current domain)W
app.use(express.json()); // Middleware to parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Middleware to parse URL-encoded bodies
app.use(express.static('public')); // Serve static files from the 'public' directory
// Mongoose database connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

const PORT = 3000;

app.post('/create', createDonationRecord);
app.get('/get', getDonationRecords);
app.get('/get/:id', getDonationRecordById);
app.put('/update/:id', updateDonationRecord);
app.delete('/delete/:id', deleteDonationRecord);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});