const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./user');
const DonationRecord = require('./db');
const { JWT_SECRET } = require('./middleware/auth');

// Auth: Login
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Auth: Logout (optional helper endpoint)
exports.logout = async (req, res) => {
    res.status(200).json({ message: 'Logout successful' });
};

// User Management: Create Admin (Owner only)
exports.createAdmin = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newAdmin = new User({
            username,
            password: hashedPassword,
            role: 'admin'
        });

        await newAdmin.save();
        res.status(201).json({
            message: 'Admin user created successfully',
            user: {
                id: newAdmin._id,
                username: newAdmin.username,
                role: newAdmin.role
            }
        });
    } catch (error) {
        console.error('Error creating admin:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// User Management: Get all users (Owner only)
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find({}, '-password').lean();
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// User Management: Delete user (Owner only)
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Prevent deleting the owner or self
        const userToDelete = await User.findById(id);
        if (!userToDelete) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (userToDelete.role === 'owner') {
            return res.status(400).json({ message: 'Cannot delete the Owner account' });
        }

        if (req.user.id === id) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        await User.findByIdAndDelete(id);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Donations: Public Create
exports.createDonationRecord = async (req, res) => {
    try {
        const { name, phone, bloodType, age, willingToDonate, lastDonationDate, studentType, year, section, address } = req.body;

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
};

// Donations: Get all (Owner / Admin)
exports.getDonationRecords = async (req, res) => {
    try {
        const records = await DonationRecord.find().lean().limit(1000).skip(0);
        res.status(200).json(records);
    } catch (error) {
        console.error('Error fetching donation records:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Donations: Get by ID (Owner / Admin)
exports.getDonationRecordById = async (req, res) => {
    const { id } = req.params;
    try {
        const record = await DonationRecord.findById(id);
        if (!record) {
            return res.status(404).json({ message: 'Record not found' });
        }
        res.status(200).json(record);
    } catch (error) {
        console.error('Error fetching donation record:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Donations: Update (Owner / Admin with strict field checks)
exports.updateDonationRecord = async (req, res) => {
    const { id } = req.params;
    try {
        // Strict Role Check for Admin
        if (req.user.role === 'admin') {
            // Admin is ONLY allowed to update lastDonationDate/blood_donated_date
            const allowedKeys = ['lastDonationDate', 'blood_donated_date'];
            const keys = Object.keys(req.body).filter(k => k !== '_id' && k !== 'id');
            const hasOtherFields = keys.some(k => !allowedKeys.includes(k));
            
            if (hasOtherFields) {
                return res.status(403).json({ message: 'Forbidden: Admin is only allowed to update the donation date' });
            }
        }

        // Support both lastDonationDate and blood_donated_date
        if (req.body.blood_donated_date !== undefined) {
            req.body.lastDonationDate = req.body.blood_donated_date;
            delete req.body.blood_donated_date;
        }

        const updatedRecord = await DonationRecord.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedRecord) {
            return res.status(404).json({ message: 'Record not found' });
        }
        res.status(200).json(updatedRecord);
    } catch (error) {
        console.error('Error updating donation record:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Donations: Delete (Owner only)
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
};

// Donations: Export CSV (Owner only)
exports.exportDonationsCSV = async (req, res) => {
    try {
        const records = await DonationRecord.find().lean();
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=donations.csv');

        // Headers
        const headers = [
            "Name",
            "Phone",
            "Blood Type",
            "Age",
            "Willing to Donate",
            "Last Donation Date",
            "Student Type",
            "Year",
            "Section",
            "Address",
            "Submitted At"
        ];

        let csvContent = headers.join(",") + "\n";

        records.forEach(r => {
            const row = [
                `"${(r.name || "").replace(/"/g, '""')}"`,
                `"${(r.phone || "").replace(/"/g, '""')}"`,
                `"${(r.bloodType || "").replace(/"/g, '""')}"`,
                r.age || "",
                r.willingToDonate ? "Yes" : "No",
                `"${(r.lastDonationDate || "").replace(/"/g, '""')}"`,
                `"${(r.studentType || "").replace(/"/g, '""')}"`,
                r.year || "",
                `"${(r.section || "").replace(/"/g, '""')}"`,
                `"${(r.address || "").replace(/"/g, '""')}"`,
                `"${(r.submittedAt || "").replace(/"/g, '""')}"`
            ];
            csvContent += row.join(",") + "\n";
        });

        res.status(200).send(csvContent);
    } catch (error) {
        console.error('Error exporting CSV:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};