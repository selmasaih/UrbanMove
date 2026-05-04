const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['accident', 'works', 'event', 'closure', 'traffic', 'weather', 'construction', 'other'],
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  address: {
    street: String,
    city: String,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  source: {
    type: String,
    enum: ['user', 'authority', 'sensor', 'system'],
    default: 'user',
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  estimatedEnd: Date,
  isActive: {
    type: Boolean,
    default: true,
  },
  verification: {
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    userReports: {
      type: Number,
      default: 1,
    },
    verifiedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    verifiedAt: Date,
  },
}, {
  timestamps: true,
});

// Index géospatial
alertSchema.index({ location: '2dsphere' });
alertSchema.index({ 'address.city': 1, isActive: 1 });

module.exports = mongoose.model('Alert', alertSchema);
