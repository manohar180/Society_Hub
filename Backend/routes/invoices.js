const express = require('express');
const Invoice = require('../models/Invoice');
const protect = require('../middleware/auth');
const authorize = require('../middleware/roles');
const router = express.Router();

// Resident Routes

// @route   GET /api/invoices/my
// @desc    Resident views their invoices
// @access  Private (Resident)
router.get('/my', protect, authorize('resident'), async (req, res) => {
    try {
        const invoices = await Invoice.find({ unitOwner: req.user._id })
            .sort({ dueDate: 1, status: 1 });
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching resident invoices.' });
    }
});

// @route   PUT /api/invoices/pay/:id
// @desc    Resident marks an invoice as paid (simulation)
// @access  Private (Resident)
router.put('/pay/:id', protect, authorize('resident'), async (req, res) => {
    try {
        const invoice = await Invoice.findOne({ _id: req.params.id, unitOwner: req.user._id });

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        
        if (invoice.status === 'paid') {
            return res.status(400).json({ message: 'Invoice already paid.' });
        }

        invoice.status = 'paid';
        invoice.paymentTime = new Date();
        invoice.paymentTx = { method: 'Simulated Bank Transfer', txId: `TX-${Date.now()}` }; 

        await invoice.save();
        res.json({ message: 'Invoice marked as paid.', invoice });
    } catch (error) {
        res.status(500).json({ message: 'Server error processing payment.' });
    }
});

// Admin Routes

// @route   POST /api/invoices/create
// @desc    Admin creates invoice(s) - Single or Bulk
// @access  Private (Admin)
router.post('/create', protect, authorize('admin'), async (req, res) => {
    // Added isBulk and residentIds to the destructuring
    const { unitNumber, residentIds, isBulk, amount, dueDate, lineItems } = req.body;
    const Resident = require('../models/Resident');

    try {
        if (isBulk) {
            // --- BULK CREATION LOGIC ---
            if (!residentIds || !Array.isArray(residentIds) || residentIds.length === 0) {
                return res.status(400).json({ message: 'No residents selected for bulk invoice.' });
            }

            // 1. Find details for all selected residents to ensure we have correct Unit Numbers
            const residentsToBill = await Resident.find({ 
                _id: { $in: residentIds },
                role: 'resident' 
            });

            if (residentsToBill.length === 0) {
                return res.status(404).json({ message: 'No valid residents found from selection.' });
            }

            // 2. Create Invoice objects
            const invoicePromises = residentsToBill.map(resident => {
                return Invoice.create({
                    unitOwner: resident._id,
                    unitNumber: resident.unitNumber, // Use the resident's actual unit number from DB
                    amount,
                    dueDate,
                    lineItems: lineItems || []
                });
            });

            // 3. Execute all creations
            await Promise.all(invoicePromises);

            return res.status(201).json({ 
                message: `Successfully created invoices for ${residentsToBill.length} residents.`,
                count: residentsToBill.length 
            });

        } else {
            // --- SINGLE CREATION LOGIC (Existing) ---
            const unitOwner = await Resident.findOne({ unitNumber, role: 'resident' });

            if (!unitOwner) {
                return res.status(404).json({ message: 'Resident for unit not found.' });
            }
            
            const invoice = await Invoice.create({
                unitOwner: unitOwner._id,
                unitNumber,
                amount,
                dueDate,
                lineItems: lineItems || []
            });

            return res.status(201).json({ message: 'Invoice created successfully.', invoice });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error creating invoice.' });
    }
});

// @route   GET /api/invoices/all
// @desc    Admin views all invoices (with optional unit filter and status filter)
// @access  Private (Admin)
router.get('/all', protect, authorize('admin'), async (req, res) => {
    const { unitNumber, status } = req.query; 
    let filter = {};

    if (unitNumber) filter.unitNumber = unitNumber;

    // Support status filter: 'paid' or 'unpaid' (unpaid => pending|overdue)
    if (status) {
        if (status === 'paid') filter.status = 'paid';
        else if (status === 'unpaid') filter.status = { $in: ['pending', 'overdue'] };
    }

    try {
        const invoices = await Invoice.find(filter)
            .populate('unitOwner', 'name email')
            .sort({ dueDate: 1, status: 1 });
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching all invoices.' });
    }
});

module.exports = router;