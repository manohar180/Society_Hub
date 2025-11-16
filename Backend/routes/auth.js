const express = require('express');
const Resident = require('../models/Resident');
const jwt = require('jsonwebtoken');
const protect = require('../middleware/auth'); // Import the protection middleware
const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @route   POST /api/auth/signup
// @desc    Register a new resident (Initial unapproved status)
// @access  Public
router.post('/signup', async (req, res) => {
    // Added phoneSecondary
    const { name, email, password, unitNumber, phone, phoneSecondary } = req.body;

    const userExists = await Resident.findOne({ email });

    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    try {
        const resident = await Resident.create({
            name, email, password, unitNumber, 
            phone, phoneSecondary, // Save both numbers
            role: 'resident', 
            isApproved: false // Requires Admin approval
        });

        if (resident) {
            res.status(201).json({
                _id: resident._id,
                name: resident.name,
                email: resident.email,
                role: resident.role,
                unitNumber: resident.unitNumber,
                isApproved: resident.isApproved,
                message: 'Resident signed up. Awaiting admin approval.'
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during signup.' });
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await Resident.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            // Simple approval check for residents and guards
            if (user.role !== 'admin' && !user.isApproved) {
                 return res.status(403).json({ message: 'Account awaiting administrator approval.' });
            }

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                unitNumber: user.unitNumber,
                // Include phone numbers in login response for Profile page
                phone: user.phone, 
                phoneSecondary: user.phoneSecondary,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile (name, phones, password)
// @access  Private (All Roles)
router.put('/profile', protect, async (req, res) => {
    try {
        // req.user is available from the 'protect' middleware
        const user = await Resident.findById(req.user.id);

        if (user) {
            user.name = req.body.name || user.name;
            user.phone = req.body.phone || user.phone;
            user.phoneSecondary = req.body.phoneSecondary ?? user.phoneSecondary; // Allow setting to empty string
            
            // If password is sent, the pre-save hook will hash it
            if (req.body.password) {
                user.password = req.body.password; 
            }

            const updatedUser = await user.save();
            
            // Send back new user data with a new token
            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                unitNumber: updatedUser.unitNumber,
                phone: updatedUser.phone,
                phoneSecondary: updatedUser.phoneSecondary,
                token: generateToken(updatedUser._id),
            });
        } else {
            res.status(440).json({ message: 'User not found' });
        }
    } catch (error) {
         console.error(error);
         res.status(500).json({ message: 'Server error updating profile' });
    }
});

module.exports = router;