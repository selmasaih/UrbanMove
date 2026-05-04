const mongoose = require('mongoose');
const crypto = require('crypto');

const reservationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  parking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parking',
    required: true,
  },
  vehicle: {
    brand: String,
    model: String,
    licensePlate: {
      type: String,
      required: true,
    },
    type: { type: String },
  },
  spotNumber: String,
  floor: String,
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  duration: {
    type: Number, // en minutes
    required: true,
  },
  pricing: {
    hourlyRate: Number,
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'MAD',
    },
    breakdown: {
      base: Number,
      serviceFee: { type: Number, default: 0 },
      taxes: { type: Number, default: 0 },
    },
  },
  payment: {
    method: {
      type: String,
      enum: ['card', 'wallet', 'cash'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'refunded', 'failed'],
      default: 'pending',
    },
    transactionId: String,
    paidAt: Date,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled', 'expired', 'no-show'],
    default: 'pending',
  },
  checkIn: Date,
  checkOut: Date,
  qrCode: {
    type: String,
    unique: true,
    sparse: true,
  },
  confirmationCode: {
    type: String,
    unique: true,
    sparse: true,
  },
  cancellation: {
    cancelledAt: Date,
    reason: String,
    refundAmount: { type: Number, default: 0 },
    refundStatus: {
      type: String,
      enum: ['none', 'pending', 'processed', 'rejected'],
      default: 'none',
    },
  },
  rating: {
    score: { type: Number, min: 1, max: 5 },
    comment: String,
    ratedAt: Date,
  },
  notifications: {
    reminderSent: { type: Boolean, default: false },
    expiryWarningSent: { type: Boolean, default: false },
  },
  extensions: [{
    additionalDuration: Number, // minutes
    additionalAmount: Number,
    extendedAt: Date,
  }],
}, {
  timestamps: true,
});

// Index pour les requêtes fréquentes
reservationSchema.index({ user: 1, status: 1 });
reservationSchema.index({ parking: 1, startTime: 1, endTime: 1 });
reservationSchema.index({ 'payment.status': 1 });

// Générer un code de confirmation avant sauvegarde
reservationSchema.pre('save', function(next) {
  if (!this.confirmationCode) {
    this.confirmationCode = 'UM-' + crypto.randomBytes(4).toString('hex').toUpperCase();
  }
  if (!this.qrCode) {
    this.qrCode = crypto.randomBytes(16).toString('hex');
  }
  next();
});

// Virtuel: est-ce que la réservation est modifiable
reservationSchema.virtual('isModifiable').get(function() {
  return ['pending', 'confirmed'].includes(this.status);
});

// Virtuel: durée formatée
reservationSchema.virtual('formattedDuration').get(function() {
  const hours = Math.floor(this.duration / 60);
  const mins = this.duration % 60;
  return hours > 0 ? `${hours}h${mins > 0 ? mins + 'min' : ''}` : `${mins}min`;
});

// Méthode pour vérifier les chevauchements
reservationSchema.statics.checkOverlap = async function(parkingId, spotNumber, startTime, endTime, excludeId = null) {
  const query = {
    parking: parkingId,
    spotNumber,
    status: { $nin: ['cancelled', 'expired', 'no-show'] },
    $or: [
      { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
    ],
  };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  return this.findOne(query);
};

module.exports = mongoose.model('Reservation', reservationSchema);
