const mongoose = require('mongoose');

const marketplaceListingSchema = new mongoose.Schema({
    title:         { type: String, required: true, trim: true },
    description:   { type: String, required: true },
    type:          { type: String, enum: ['sell', 'buy', 'lost', 'found', 'service', 'room'], required: true },
    price:         { type: Number },
    contactNumber: { type: String },
    images:        [{ type: String }],
    status:        { type: String, enum: ['active', 'sold', 'expired', 'closed'], default: 'active' },
    createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt:     { type: Date, default: Date.now },
    expiresAt:     { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('MarketplaceListing', marketplaceListingSchema);
