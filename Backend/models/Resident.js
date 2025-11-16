const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ResidentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['resident', 'guard', 'admin'], 
        default: 'resident' 
    },
    unitNumber: { type: String, required: function() { return this.role === 'resident'; } },
    
    // --- UPDATED PHONE FIELDS ---
    phone: { type: String, required: true }, // Primary
    phoneSecondary: { type: String, default: '' }, // Secondary (Optional)
    // ----------------------------

    isApproved: { type: Boolean, default: false } 
});

// Hash password before saving
ResidentSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

ResidentSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Resident', ResidentSchema);