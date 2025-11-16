const mongoose = require('mongoose');

const LineItemSchema = new mongoose.Schema({
    description: { type: String, required: true },
    amount: { type: Number, required: true }
}, { _id: false });

const InvoiceSchema = new mongoose.Schema({
    unitOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident', required: true },
    unitNumber: { type: String, required: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    status: { 
        type: String, 
        enum: ['pending', 'paid', 'overdue'], 
        default: 'pending' 
    },
    lineItems: [LineItemSchema],
    
    // Payment simulation fields
    paymentTime: { type: Date, default: null },
    paymentTx: { type: Object, default: {} } // For storing transaction details
}, { timestamps: true });

// Middleware to update status to 'overdue' on read/update if needed, 
// but we'll manage this manually for simplicity in the API for this scope.

module.exports = mongoose.model('Invoice', InvoiceSchema);