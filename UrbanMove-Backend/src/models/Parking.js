const mongoose = require('mongoose');

const parkingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom du parking est requis'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  type: {
    type: String,
    enum: ['outdoor', 'underground', 'multilevel', 'covered', 'smart'],
    default: 'outdoor',
  },
  address: {
    street: String,
    city: String,
    postalCode: String,
    district: String,
    country: {
      type: String,
      default: 'Maroc',
    },
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
  totalSpots: {
    type: Number,
    required: true,
    min: 1,
  },
  availableSpots: {
    type: Number,
    required: true,
    min: 0,
  },
  spotTypes: {
    standard: { total: Number, available: Number },
    handicapped: { total: Number, available: Number },
    electric: { total: Number, available: Number },
    motorcycle: { total: Number, available: Number },
    vip: { total: Number, available: Number },
  },
  floors: [{
    name: String,
    level: Number,
    totalSpots: Number,
    availableSpots: Number,
  }],
  pricing: {
    hourly: {
      type: Number,
      required: true,
    },
    daily: Number,
    weekly: Number,
    monthly: Number,
    currency: {
      type: String,
      default: 'MAD',
    },
    specialRates: [{
      name: String,
      description: String,
      rate: Number,
      conditions: String,
    }],
  },
  amenities: [{
    type: String,
    enum: [
      'security', 'lighting', 'elevator', 'ev_charging', 'disabled_access',
      'cctv', 'car_wash', 'valet', 'restrooms', 'wifi', 'covered',
      'motorcycle_parking', 'bicycle_parking', 'air_pump', 'emergency_button',
    ],
  }],
  operatingHours: {
    is24Hours: {
      type: Boolean,
      default: true,
    },
    schedule: {
      type: mongoose.Schema.Types.Mixed,
    },
    holidays: [{
      date: Date,
      open: String,
      close: String,
      isClosed: Boolean,
    }],
  },
  contact: {
    phone: String,
    email: String,
    website: String,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  images: [String],
  sensors: {
    hasSensors: { type: Boolean, default: false },
    lastUpdate: Date,
    provider: String,
  },
  statistics: {
    totalReservations: { type: Number, default: 0 },
    averageOccupancy: { type: Number, default: 0 },
    peakHours: [String],
    busyDays: [String],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Index géospatial
parkingSchema.index({ location: '2dsphere' });
parkingSchema.index({ 'address.city': 1, isActive: 1 });
parkingSchema.index({ rating: -1 });
parkingSchema.index({ 'pricing.hourly': 1 });
parkingSchema.index({ isFeatured: 1 });

// Virtuel: taux d'occupation
parkingSchema.virtual('occupancyRate').get(function() {
  return Math.round(((this.totalSpots - this.availableSpots) / this.totalSpots) * 100);
});

// Virtuel: status de disponibilité
parkingSchema.virtual('availabilityStatus').get(function() {
  const ratio = this.availableSpots / this.totalSpots;
  if (ratio === 0) return 'full';
  if (ratio <= 0.1) return 'almost-full';
  if (ratio <= 0.3) return 'limited';
  return 'available';
});

// Virtuel: avis
parkingSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'parking',
});

// Méthode: vérifier si le parking est ouvert
parkingSchema.methods.isOpenNow = function() {
  if (this.operatingHours.is24Hours) return true;
  
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[now.getDay()];
  
  const schedule = this.operatingHours.schedule?.[today];
  if (!schedule) return false;
  
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return currentTime >= schedule.open && currentTime <= schedule.close;
};

module.exports = mongoose.model('Parking', parkingSchema);
