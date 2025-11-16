const express = require('express');
const Notice = require('../models/Notice');
const Complaint = require('../models/Complaint');
const protect = require('../middleware/auth');
const authorize = require('../middleware/roles');
const multer = require('multer');
const { storage } = require('../config/cloudinary'); // Import Cloudinary config
const router = express.Router();

// Initialize Multer with Cloudinary Storage
const upload = multer({ storage });

// ==========================================
//               NOTICES
// ==========================================

// @route   GET /api/community/notices
// @desc    Get all notices
router.get('/notices', protect, async (req, res) => {
    try {
        const notices = await Notice.find().sort({ createdAt: -1 }).populate('postedBy', 'name role');
        res.json(notices);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching notices' });
    }
});

// @route   POST /api/community/notices
// @desc    Create a new notice
router.post('/notices', protect, async (req, res) => {
    try {
        const notice = await Notice.create({ ...req.body, postedBy: req.user._id });
        
        // Populate immediately for frontend display
        await notice.populate('postedBy', 'name role');

        req.io.emit('community_update', { type: 'notice', action: 'create', data: notice });
        res.status(201).json(notice);
    } catch (err) {
        res.status(500).json({ message: 'Error creating notice' });
    }
});

// @route   PUT /api/community/notices/:id
// @desc    Update a notice (Author Only)
router.put('/notices/:id', protect, async (req, res) => {
    try {
        const notice = await Notice.findById(req.params.id);
        if (!notice) return res.status(404).json({ message: 'Notice not found' });

        // Check permission: Admin OR Author
        if (req.user.role === 'admin' || notice.postedBy.toString() === req.user.id) {
            const updatedNotice = await Notice.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('postedBy', 'name role');
            req.io.emit('community_update', { type: 'notice', action: 'update', data: updatedNotice });
            res.json(updatedNotice);
        } else {
            res.status(403).json({ message: 'Not authorized' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Error updating notice' });
    }
});

// @route   DELETE /api/community/notices/:id
// @desc    Delete a notice (Admin OR Author)
router.delete('/notices/:id', protect, async (req, res) => {
    try {
        const notice = await Notice.findById(req.params.id);
        if (!notice) return res.status(404).json({ message: 'Notice not found' });

        if (req.user.role === 'admin' || notice.postedBy.toString() === req.user.id) {
            await Notice.findByIdAndDelete(req.params.id);
            req.io.emit('community_update', { type: 'notice', action: 'delete', id: req.params.id });
            res.json({ message: 'Notice deleted' });
        } else {
            res.status(403).json({ message: 'Not authorized' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Error deleting notice' });
    }
});

// ==========================================
//               COMPLAINTS
// ==========================================

// @route   GET /api/community/complaints
// @desc    Get all complaints
router.get('/complaints', protect, async (req, res) => {
    try {
        const complaints = await Complaint.find().sort({ createdAt: -1 }).populate('postedBy', 'name unitNumber');
        res.json(complaints);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching complaints' });
    }
});

// @route   POST /api/community/complaints
// @desc    Create a complaint (supports Image Upload)
router.post('/complaints', protect, upload.single('image'), async (req, res) => {
    try {
        console.log('File received:', req.file); // Debug: check if file is received
        console.log('Body:', req.body); // Debug: check form data
        
        if (!req.body.title || !req.body.description) {
            return res.status(400).json({ message: 'Title and description are required.' });
        }
        
        const complaintData = {
            title: req.body.title,
            description: req.body.description,
            postedBy: req.user._id,
            imageUrl: req.file ? req.file.path : '' // Save Cloudinary URL if file exists
        };

        console.log('Complaint data being saved:', complaintData); // Debug: check data

        let complaint = await Complaint.create(complaintData);
        
        // CRITICAL: Populate user details immediately so the frontend can display 
        // "Posted by: Name (Villa No)" instantly without refresh.
        complaint = await complaint.populate('postedBy', 'name unitNumber');
        
        console.log('Complaint saved with imageUrl:', complaint.imageUrl); // Debug: verify imageUrl is saved
        
        req.io.emit('community_update', { type: 'complaint', action: 'create', data: complaint });
        res.status(201).json(complaint);
    } catch (err) {
        console.error('Error posting complaint:', err);
        res.status(500).json({ message: 'Error posting complaint: ' + err.message });
    }
});

// @route   PUT /api/community/complaints/:id
// @desc    Update a complaint (Author Only) - Resets status to 'open'
router.put('/complaints/:id', protect, async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

        if (complaint.postedBy.toString() === req.user.id) {
            const updatedComplaint = await Complaint.findByIdAndUpdate(
                req.params.id, 
                { ...req.body, status: 'open' }, // Reset status to open on edit
                { new: true }
            ).populate('postedBy', 'name unitNumber');

            req.io.emit('community_update', { type: 'complaint', action: 'update', data: updatedComplaint });
            res.json(updatedComplaint);
        } else {
            res.status(403).json({ message: 'Not authorized' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Error updating complaint' });
    }
});

// @route   DELETE /api/community/complaints/:id
// @desc    Delete a complaint (Admin OR Author)
router.delete('/complaints/:id', protect, async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

        if (req.user.role === 'admin' || complaint.postedBy.toString() === req.user.id) {
            await Complaint.findByIdAndDelete(req.params.id);
            req.io.emit('community_update', { type: 'complaint', action: 'delete', id: req.params.id });
            res.json({ message: 'Complaint deleted' });
        } else {
            res.status(403).json({ message: 'Not authorized' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Error deleting complaint' });
    }
});

// @route   PUT /api/community/complaints/:id/resolve
// @desc    Mark complaint as resolved (Admin Only)
router.put('/complaints/:id/resolve', protect, authorize('admin'), async (req, res) => {
    try {
        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id, 
            { status: 'resolved' }, 
            { new: true }
        ).populate('postedBy', 'name unitNumber');

        req.io.emit('community_update', { type: 'complaint', action: 'update', data: complaint });
        res.json(complaint);
    } catch (err) {
        res.status(500).json({ message: 'Error resolving complaint' });
    }
});

module.exports = router;