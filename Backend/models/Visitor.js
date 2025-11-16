const mongoose = require('mongoose');

const VisitorSchema = new mongoose.Schema({
    unitOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident', required: true },
    unitNumber: { type: String, required: true },
    
    name: { type: String, required: true },
    phone: { type: String, required: true },
    vehicleNo: { type: String, default: '' },
    visitorType: { type: String, enum: ['delivery', 'guest', 'service', 'other'], default: 'guest' },
    
    // --- APPROVAL LOGIC FIELDS ---
    preApproved: { type: Boolean, default: false },
    
    // 'approved': Allowed to enter (Pre-approved or Resident accepted)
    // 'pending': Guard waiting for resident response
    // 'denied': Resident rejected
    approvalStatus: { 
        type: String, 
        enum: ['approved', 'pending', 'denied'], 
        default: 'approved' 
    },
    // -----------------------------

    expectedTime: { type: Date },
    checkInTime: { type: Date, default: null },
    checkOutTime: { type: Date, default: null },
    qrCodeToken: { type: String, default: null } 
}, { timestamps: true });

module.exports = mongoose.model('Visitor', VisitorSchema);