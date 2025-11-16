const express = require('express');
const Resident = require('../models/Resident');
const protect = require('../middleware/auth');
const authorize = require('../middleware/roles');
const router = express.Router();

// Admin-only middleware applied to all routes in this file
router.use(protect, authorize('admin'));

// @route   GET /api/admin/residents
// @desc    Admin views all residents and unapproved users
// @access  Private (Admin)
router.get('/residents', async (req, res) => {
    try {
        // Exclude Admin users from this general list for simplicity, focusing on residents/guards
        const users = await Resident.find({ role: { $in: ['resident', 'guard'] } }).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching residents.' });
    }
});

// @route   POST /api/admin/create-staff
// @desc    Admin creates a guard or another admin
// @access  Private (Admin)
router.post('/create-staff', async (req, res) => {
    const { name, email, password, role, phone } = req.body;

    if (role === 'resident') {
        return res.status(400).json({ message: 'Use the signup route for residents.' });
    }
    
    const userExists = await Resident.findOne({ email });

    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    try {
        const staff = await Resident.create({
            name, email, password, phone, role,
            unitNumber: 'N/A', // Staff doesn't have a unit
            isApproved: true // Staff created by admin is approved immediately
        });
        res.status(201).json({ staff, message: `${role} account created and approved.` });
    } catch (error) {
        res.status(500).json({ message: 'Server error creating staff account.' });
    }
});

// @route   PUT /api/admin/approve-user/:id
// @desc    Admin approves a resident/guard (after initial signup)
// @access  Private (Admin)
router.put('/approve-user/:id', async (req, res) => {
    try {
        const user = await Resident.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        user.isApproved = true;
        await user.save();
        
        res.json({ message: `${user.role} ${user.name} approved.`, user });
    } catch (error) {
        res.status(500).json({ message: 'Server error approving user.' });
    }
});

// @route   DELETE /api/admin/user/:id
// @desc    Admin deletes a resident or guard
// @access  Private (Admin)
router.delete('/user/:id', async (req, res) => {
    try {
        const user = await Resident.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Prevent deletion of the current admin user
        if (user._id.toString() === req.user.id) {
            return res.status(400).json({ message: 'Cannot delete your own active admin account.' });
        }

        // Restrict deletion of other Admin accounts for security
        if (user.role === 'admin') {
             return res.status(403).json({ message: 'Deletion of other Admin accounts is restricted.' });
        }
        
        // Use deleteOne for clear deletion
        await Resident.deleteOne({ _id: req.params.id });
        
        res.json({ message: `${user.role} ${user.name} removed successfully.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error deleting user.' });
    }
});

module.exports = router;