const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Sous-schéma pour les véhicules
const vehicleSchema = new mongoose.Schema({
  brand: {
    type: String,
    required: true,
    trim: true,
  },
  model: {
    type: String,
    required: true,
    trim: true,
  },
  licensePlate: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  type: {
    type: String,
    enum: ['car', 'motorcycle', 'truck', 'electric'],
    default: 'car',
  },
  color: {
    type: String,
    default: '',
  },
  isElectric: {
    type: Boolean,
    default: false,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
}, { _id: true });

// Sous-schéma pour les transactions wallet
const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['topup', 'payment', 'refund', 'bonus'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  reference: {
    type: String,
    default: '',
  },
  date: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed',
  },
}, { _id: true });

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Le prénom est requis'],
    trim: true,
    maxlength: [50, 'Le prénom ne peut pas dépasser 50 caractères'],
  },
  lastName: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true,
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères'],
  },
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email invalide'],
  },
  phone: {
    type: String,
    required: [true, 'Le téléphone est requis'],
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: [6, 'Le mot de passe doit avoir au moins 6 caractères'],
    select: false,
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user',
  },
  avatar: {
    type: String,
    default: null,
  },
  city: {
    type: String,
    enum: ['rabat', 'casablanca', 'tanger', 'marrakech', 'fes', 'agadir'],
    default: 'rabat',
  },
  vehicles: [vehicleSchema],
  favorites: {
    parkings: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parking',
    }],
    places: [{
      name: String,
      address: String,
      location: {
        type: { type: String, default: 'Point' },
        coordinates: [Number],
      },
    }],
  },
  wallet: {
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: 'MAD',
    },
    transactions: [transactionSchema],
    lastUpdated: Date,
  },
  preferences: {
    notifications: {
      push: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
    },
    trafficAlerts: {
      type: Boolean,
      default: true,
    },
    parkingAlerts: {
      type: Boolean,
      default: true,
    },
    language: {
      type: String,
      enum: ['fr', 'ar', 'en'],
      default: 'fr',
    },
    defaultCity: {
      type: String,
      default: 'rabat',
    },
    darkMode: {
      type: Boolean,
      default: false,
    },
  },
  stats: {
    totalTrips: { type: Number, default: 0 },
    totalReservations: { type: Number, default: 0 },
    alertsReported: { type: Number, default: 0 },
    co2Saved: { type: Number, default: 0 },
    timeSaved: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  verificationToken: String,
  verificationExpires: Date,
  pushToken: String,
}, {
  timestamps: true,
});

// Index pour la recherche
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ city: 1 });

// Virtuel: compte verrouillé
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Hash du mot de passe avant sauvegarde
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Méthode pour incrémenter les tentatives de connexion
userSchema.methods.incLoginAttempts = async function() {
  // Si le verrou a expiré, réinitialiser
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }
  const updates = { $inc: { loginAttempts: 1 } };
  // Verrouiller après 5 tentatives (30 min)
  if (this.loginAttempts + 1 >= 5) {
    updates.$set = { lockUntil: Date.now() + 30 * 60 * 1000 };
  }
  return this.updateOne(updates);
};

// Méthode pour générer un token de réinitialisation
userSchema.methods.generateResetToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
  this.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 heure
  return token;
};

// Méthode pour générer un token de vérification
userSchema.methods.generateVerificationToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.verificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 heures
  return token;
};

// Méthode pour obtenir les données publiques
userSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    phone: this.phone,
    role: this.role,
    avatar: this.avatar,
    city: this.city,
    vehicles: this.vehicles,
    favorites: this.favorites,
    wallet: {
      balance: this.wallet.balance,
      currency: this.wallet.currency,
      lastUpdated: this.wallet.lastUpdated,
    },
    preferences: this.preferences,
    stats: this.stats,
    isVerified: this.isVerified,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
