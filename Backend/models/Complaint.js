const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, default: '' }, // <--- NEW FIELD
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident' },
    status: { type: String, enum: ['open', 'resolved'], default: 'open' }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', ComplaintSchema);