const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
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
  reservation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',
  },
  rating: {
    type: Number,
    required: [true, 'La note est requise'],
    min: 1,
    max: 5,
  },
  title: {
    type: String,
    trim: true,
    maxlength: 100,
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  aspects: {
    cleanliness: { type: Number, min: 1, max: 5 },
    security: { type: Number, min: 1, max: 5 },
    accessibility: { type: Number, min: 1, max: 5 },
    value: { type: Number, min: 1, max: 5 },
  },
  photos: [String],
  isVerified: {
    type: Boolean,
    default: false,
  },
  response: {
    text: String,
    respondedAt: Date,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  helpful: {
    count: { type: Number, default: 0 },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  reported: {
    isReported: { type: Boolean, default: false },
    reason: String,
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Un utilisateur ne peut laisser qu'un avis par parking
reviewSchema.index({ user: 1, parking: 1 }, { unique: true });
reviewSchema.index({ parking: 1, rating: -1 });
reviewSchema.index({ createdAt: -1 });

// Méthode statique pour calculer la note moyenne d'un parking
reviewSchema.statics.calcAverageRating = async function(parkingId) {
  const stats = await this.aggregate([
    { $match: { parking: parkingId, isActive: true } },
    {
      $group: {
        _id: '$parking',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    const Parking = mongoose.model('Parking');
    await Parking.findByIdAndUpdate(parkingId, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      reviewCount: stats[0].count,
    });
  }
};

// Mettre à jour la note du parking après chaque ajout/modification/suppression
reviewSchema.post('save', function() {
  this.constructor.calcAverageRating(this.parking);
});

reviewSchema.post('remove', function() {
  this.constructor.calcAverageRating(this.parking);
});

module.exports = mongoose.model('Review', reviewSchema);
