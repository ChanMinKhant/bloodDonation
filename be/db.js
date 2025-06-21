const mongoose = require('mongoose');

const DonationRecordSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    bloodType: { type: String, required: true },
    age: { type: Number, required: true },
    willingToDonate: { type: Boolean, required: true },
    lastDonationDate: { type: String, required: true },
    studentType: { type: String, enum: ['student', 'not-student'], required: true },
    year: { type: Number },
    section: { type: String },
    address: { type: String },
    submittedAt: { type: String, required: true }
});

module.exports = mongoose.model('DonationRecord', DonationRecordSchema);