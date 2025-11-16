const express = require('express');
const Visitor = require('../models/Visitor');
const protect = require('../middleware/auth');
const authorize = require('../middleware/roles');
const router = express.Router();

// --- RESIDENT ROUTES ---

// @route   POST /api/visitors/pre-approve
// @desc    Resident pre-approves a visitor
router.post('/pre-approve', protect, authorize('resident'), async (req, res) => {
    const { name, phone, expectedTime, visitorType } = req.body;
    
    try {
        const visitor = await Visitor.create({
            unitOwner: req.user._id,
            unitNumber: req.user.unitNumber,
            name, phone, expectedTime, visitorType,
            preApproved: true,
            approvalStatus: 'approved' // Automatically approved
        });
        res.status(201).json({ visitor, message: 'Visitor pre-approved successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error creating pre-approval.' });
    }
});

// @route   GET /api/visitors/resident
// @desc    Resident views their history (approved/past)
router.get('/resident', protect, authorize('resident'), async (req, res) => {
    try {
        const visitors = await Visitor.find({ unitOwner: req.user._id })
            .sort({ createdAt: -1 })
            .limit(10);
        res.json(visitors);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching visitor list.' });
    }
});

// @route   GET /api/visitors/resident/pending-requests
// @desc    Resident fetches live requests from Guard
router.get('/resident/pending-requests', protect, authorize('resident'), async (req, res) => {
    try {
        const requests = await Visitor.find({ 
            unitOwner: req.user._id, 
            approvalStatus: 'pending',
            checkInTime: null 
        }).sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching requests.' });
    }
});

// @route   PUT /api/visitors/resident/respond-request/:id
// @desc    Resident Approves or Denies a sudden visitor
router.put('/resident/respond-request/:id', protect, authorize('resident'), async (req, res) => {
    const { status } = req.body; // 'approved' or 'denied'
    
    if(!['approved', 'denied'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        const visitor = await Visitor.findOne({ _id: req.params.id, unitOwner: req.user._id });
        if (!visitor) return res.status(404).json({ message: 'Request not found' });

        visitor.approvalStatus = status;
        await visitor.save();

        res.json({ message: `Visitor request ${status}.`, visitor });
    } catch (error) {
        res.status(500).json({ message: 'Error updating request.' });
    }
});


// --- GUARD ROUTES ---

// @route   GET /api/visitors/guard/lookup/:unitNumber
// @desc    Guard looks up resident contact info by Villa No
router.get('/guard/lookup/:unitNumber', protect, authorize('guard'), async (req, res) => {
    try {
        const Resident = require('../models/Resident');
        // Find the resident for this unit
        const resident = await Resident.findOne({ 
            unitNumber: req.params.unitNumber, 
            role: 'resident' 
        }).select('name phone phoneSecondary'); // Only fetch name and phones

        if (!resident) {
            return res.status(404).json({ message: 'No resident found for this Villa.' });
        }

        res.json(resident);
    } catch (error) {
        res.status(500).json({ message: 'Server error looking up resident.' });
    }
});

// @route   GET /api/visitors/guard/approved
// @desc    Guard views all approved visitors ready for check-in
router.get('/guard/approved', protect, authorize('guard'), async (req, res) => {
    try {
        const approvedVisitors = await Visitor.find({ 
            approvalStatus: 'approved', 
            checkInTime: null 
        }).select('name phone unitNumber expectedTime visitorType');
        res.json(approvedVisitors);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching approved visitors.' });
    }
});

// @route   POST /api/visitors/guard/request-entry
// @desc    Guard requests approval for sudden visitor
router.post('/guard/request-entry', protect, authorize('guard'), async (req, res) => {
    const { name, phone, unitNumber, vehicleNo, visitorType } = req.body;
    
    const Resident = require('../models/Resident');
    const unitOwner = await Resident.findOne({ unitNumber, role: 'resident' });

    if (!unitOwner) return res.status(404).json({ message: 'Resident not found for this unit.' });

    try {
        const visitor = await Visitor.create({
            unitOwner: unitOwner._id,
            unitNumber, name, phone, vehicleNo, visitorType,
            preApproved: false,
            approvalStatus: 'pending', // Status is PENDING
            checkInTime: null 
        });
        res.status(201).json({ visitor, message: 'Approval request sent to resident.' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending request.' });
    }
});

// @route   GET /api/visitors/guard/checked-in
// @desc    Guard views currently checked-in visitors
router.get('/guard/checked-in', protect, authorize('guard'), async (req, res) => {
    try {
        const checkedInVisitors = await Visitor.find({ 
            checkInTime: { $ne: null }, 
            checkOutTime: null 
        }).select('name phone vehicleNo unitNumber checkInTime');
        res.json(checkedInVisitors);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching checked-in visitors.' });
    }
});

// @route   POST /api/visitors/guard/check-in
// @desc    Guard checks in a visitor (Must be Approved)
router.post('/guard/check-in', protect, authorize('guard'), async (req, res) => {
    const { visitorId, name, phone, unitNumber, vehicleNo } = req.body;
    let visitor;

    // Scenario 1: Check-in Existing Record (Pre-approved or Request Approved)
    if (visitorId) { 
        visitor = await Visitor.findById(visitorId);
        if (!visitor) return res.status(404).json({ message: 'Visitor record not found.' });

        if (visitor.approvalStatus !== 'approved') {
            return res.status(400).json({ message: `Cannot check-in. Status is: ${visitor.approvalStatus}` });
        }

        visitor.checkInTime = new Date();
        visitor.vehicleNo = vehicleNo || visitor.vehicleNo;
    } 
    // Scenario 2: Legacy/Manual Check-in
    else { 
        const Resident = require('../models/Resident');
        const unitOwner = await Resident.findOne({ unitNumber: unitNumber, role: 'resident' });
        if (!unitOwner) return res.status(404).json({ message: 'Unit number invalid.' });
        
        visitor = await Visitor.create({
            unitOwner: unitOwner._id, unitNumber, name, phone, vehicleNo,
            preApproved: false,
            approvalStatus: 'approved', // Manual override by guard
            checkInTime: new Date()
        });
    }

    await visitor.save();
    res.json({ visitor, message: 'Visitor successfully checked in.' });
});

// @route   POST /api/visitors/guard/check-out/:id
// @desc    Guard checks out a visitor
router.post('/guard/check-out/:id', protect, authorize('guard'), async (req, res) => {
    try {
        const visitor = await Visitor.findById(req.params.id);
        if (!visitor) return res.status(404).json({ message: 'Visitor not found' });
        if (visitor.checkOutTime) return res.status(400).json({ message: 'Visitor already checked out.' });
        
        visitor.checkOutTime = new Date();
        await visitor.save();
        
        res.json({ message: 'Visitor checked out successfully', visitor });
    } catch (error) {
        res.status(500).json({ message: 'Server error checking out visitor.' });
    }
});

// --- ADMIN ROUTES ---

// @route   GET /api/visitors/logs
// @desc    Admin views all visitor logs
router.get('/logs', protect, authorize('admin'), async (req, res) => {
    try {
        const logs = await Visitor.find({})
            .populate('unitOwner', 'name unitNumber')
            .sort({ checkInTime: -1 });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching all visitor logs.' });
    }
});

module.exports = router;