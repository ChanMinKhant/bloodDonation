const DonationRecord = require('./db');

exports.createDonationRecord = async (req, res) => {
    try {
        const {name, phone, bloodType, age, willingToDonate, lastDonationDate, studentType, year, section, address } = req.body;

        const newRecord = new DonationRecord({
            name,
            phone,
            bloodType,
            age,
            willingToDonate,
            lastDonationDate,
            studentType,
            year,
            section,
            address,
            submittedAt: new Date().toISOString()
        });

        await newRecord.save();
        res.status(201).json({ message: 'Donation record created successfully', record: newRecord });
    } catch (error) {
        console.error('Error creating donation record:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

exports.getDonationRecords = async (_unused, res) => {
    try {
        const records = await DonationRecord.find().lean().limit(500).skip(0);
        res.status(200).json(records);
    } catch (error) {
        console.error('Error fetching donation records:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

exports.getDonationRecordById = async (req, res) => {
    const { id } = req.params;
    try {
        const record = await DonationRecord.findById(id);
        if (!record) {
            return res.status(404).json({ message: 'Record not found' });
        }
        res.status(200).json(record);
    }
    catch (error) {
        console.error('Error fetching donation record:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

exports.updateDonationRecord = async (req, res) => {
    const { id } = req.params;
    try {
        const updatedRecord = await DonationRecord.findByIdAndUpdate(id, req
.body, { new: true });
        if (!updatedRecord) {
            return res.status(404).json({ message: 'Record not found' });
        }
        res.status(200).json({ message: 'Record updated successfully', record: updatedRecord });
    }

    catch (error) {
        console.error('Error updating donation record:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

exports.deleteDonationRecord = async (req, res) => {
    const { id } = req.params;
    try {
        const deletedRecord = await DonationRecord.findByIdAndDelete(id);
        if (!deletedRecord) {
            return res.status(404).json({ message: 'Record not found' });
        }
        res.status(200).json({ message: 'Record deleted successfully' });
    } catch (error) {
        console.error('Error deleting donation record:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}