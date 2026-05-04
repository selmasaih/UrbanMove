const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const User = require('../models/User');
const Reservation = require('../models/Reservation');
const Review = require('../models/Review');
const { auth } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');

// @route   GET /api/user/profile
// @desc    Obtenir le profil complet de l'utilisateur
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      success: true,
      data: user.toPublicJSON(),
    });
  } catch (error) {
    console.error('Erreur get profile:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
    });
  }
});

// @route   PUT /api/user/profile
// @desc    Mettre à jour le profil
// @access  Private
router.put('/profile', auth, [
  body('firstName').optional().trim().notEmpty().isLength({ min: 2, max: 50 }),
  body('lastName').optional().trim().notEmpty().isLength({ min: 2, max: 50 }),
  body('phone').optional().trim().matches(/^(06|07|05)\d{8}$/),
  body('city').optional().isIn(['rabat', 'casablanca', 'tanger', 'marrakech', 'fes', 'agadir']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const allowedFields = ['firstName', 'lastName', 'phone', 'city', 'avatar'];
    const updates = {};
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profil mis à jour',
      data: user.toPublicJSON(),
    });
  } catch (error) {
    console.error('Erreur update profile:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour',
    });
  }
});

// @route   PUT /api/user/password
// @desc    Changer le mot de passe
// @access  Private
router.put('/password', auth, [
  body('currentPassword').notEmpty().withMessage('Mot de passe actuel requis'),
  body('newPassword').isLength({ min: 6 }).withMessage('Minimum 6 caractères')
    .matches(/\d/).withMessage('Doit contenir au moins un chiffre'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel incorrect',
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès',
    });
  } catch (error) {
    console.error('Erreur change password:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de mot de passe',
    });
  }
});

// =============== VÉHICULES ===============

// @route   GET /api/user/vehicles
// @desc    Obtenir les véhicules de l'utilisateur
// @access  Private
router.get('/vehicles', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.user.vehicles,
    });
  } catch (error) {
    console.error('Erreur get vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des véhicules',
    });
  }
});

// @route   POST /api/user/vehicles
// @desc    Ajouter un véhicule
// @access  Private
router.post('/vehicles', auth, [
  body('brand').trim().notEmpty().withMessage('Marque requise'),
  body('model').trim().notEmpty().withMessage('Modèle requis'),
  body('licensePlate').trim().notEmpty().withMessage('Immatriculation requise')
    .matches(/^\d{1,5}-[A-Z]-\d{1,3}$/).withMessage('Format: 12345-A-1'),
  body('type').isIn(['car', 'motorcycle', 'truck']).withMessage('Type invalide'),
  body('color').optional().trim(),
  body('isElectric').optional().isBoolean(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { brand, model, licensePlate, type, color, isElectric } = req.body;

    // Vérifier max 5 véhicules
    if (req.user.vehicles.length >= 5) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 5 véhicules autorisés',
      });
    }

    // Vérifier si l'immatriculation existe déjà
    const existingPlate = req.user.vehicles.find(v => v.licensePlate === licensePlate);
    if (existingPlate) {
      return res.status(400).json({
        success: false,
        message: 'Cette immatriculation est déjà enregistrée',
      });
    }

    const vehicle = {
      brand,
      model,
      licensePlate,
      type,
      color: color || '',
      isElectric: isElectric || false,
      isDefault: req.user.vehicles.length === 0,
    };

    req.user.vehicles.push(vehicle);
    await req.user.save();

    res.status(201).json({
      success: true,
      message: 'Véhicule ajouté',
      data: req.user.vehicles,
    });
  } catch (error) {
    console.error('Erreur add vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout du véhicule',
    });
  }
});

// @route   PUT /api/user/vehicles/:id
// @desc    Modifier un véhicule
// @access  Private
router.put('/vehicles/:id', auth, [
  param('id').isMongoId().withMessage('ID véhicule invalide'),
  body('brand').optional().trim().notEmpty(),
  body('model').optional().trim().notEmpty(),
  body('color').optional().trim(),
  body('isElectric').optional().isBoolean(),
  body('isDefault').optional().isBoolean(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const vehicle = req.user.vehicles.id(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Véhicule non trouvé' });
    }

    const allowedFields = ['brand', 'model', 'color', 'isElectric', 'isDefault'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        vehicle[field] = req.body[field];
      }
    });

    // Si ce véhicule est défini par défaut, retirer les autres
    if (req.body.isDefault === true) {
      req.user.vehicles.forEach(v => {
        if (v._id.toString() !== req.params.id) {
          v.isDefault = false;
        }
      });
    }

    await req.user.save();

    res.json({
      success: true,
      message: 'Véhicule mis à jour',
      data: req.user.vehicles,
    });
  } catch (error) {
    console.error('Erreur update vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du véhicule',
    });
  }
});

// @route   DELETE /api/user/vehicles/:id
// @desc    Supprimer un véhicule
// @access  Private
router.delete('/vehicles/:id', auth, async (req, res) => {
  try {
    const vehicleIndex = req.user.vehicles.findIndex(
      v => v._id.toString() === req.params.id
    );

    if (vehicleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Véhicule non trouvé',
      });
    }

    const wasDefault = req.user.vehicles[vehicleIndex].isDefault;
    req.user.vehicles.splice(vehicleIndex, 1);

    // Si le véhicule supprimé était par défaut, en assigner un autre
    if (wasDefault && req.user.vehicles.length > 0) {
      req.user.vehicles[0].isDefault = true;
    }

    await req.user.save();

    res.json({
      success: true,
      message: 'Véhicule supprimé',
      data: req.user.vehicles,
    });
  } catch (error) {
    console.error('Erreur delete vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression',
    });
  }
});

// =============== PORTEFEUILLE ===============

// @route   GET /api/user/wallet
// @desc    Obtenir le portefeuille avec historique
// @access  Private
router.get('/wallet', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const wallet = {
      balance: req.user.wallet.balance,
      currency: req.user.wallet.currency,
      transactions: req.user.wallet.transactions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(skip, skip + parseInt(limit)),
      totalTransactions: req.user.wallet.transactions.length,
    };

    res.json({
      success: true,
      data: wallet,
    });
  } catch (error) {
    console.error('Erreur get wallet:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du portefeuille',
    });
  }
});

// @route   POST /api/user/wallet/topup
// @desc    Recharger le portefeuille
// @access  Private
router.post('/wallet/topup', auth, rateLimiter.create, [
  body('amount').isFloat({ min: 10, max: 10000 }).withMessage('Montant entre 10 et 10000 MAD'),
  body('paymentMethod').isIn(['card', 'bank', 'cash_plus', 'wafacash']).withMessage('Méthode invalide'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { amount, paymentMethod } = req.body;
    const parsedAmount = parseFloat(amount);

    const methodNames = {
      card: 'carte bancaire',
      bank: 'virement bancaire',
      cash_plus: 'Cash Plus',
      wafacash: 'Wafacash',
    };

    // Simuler le paiement (en production, intégrer CMI/HPS/Payzone)
    req.user.wallet.balance += parsedAmount;
    req.user.wallet.transactions.push({
      type: 'topup',
      amount: parsedAmount,
      description: `Rechargement par ${methodNames[paymentMethod]}`,
      date: new Date(),
      status: 'completed',
      reference: `TOP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    });

    await req.user.save();

    res.json({
      success: true,
      message: 'Rechargement effectué',
      data: {
        newBalance: req.user.wallet.balance,
        transaction: req.user.wallet.transactions[req.user.wallet.transactions.length - 1],
      },
    });
  } catch (error) {
    console.error('Erreur topup:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du rechargement',
    });
  }
});

// =============== FAVORIS ===============

// @route   GET /api/user/favorites
// @desc    Obtenir les favoris (parkings + lieux)
// @access  Private
router.get('/favorites', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('favorites.parkings', 'name address pricing rating availableSpots totalSpots images type');

    res.json({
      success: true,
      data: {
        parkings: user.favorites.parkings,
        places: user.favorites.places,
      },
    });
  } catch (error) {
    console.error('Erreur get favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des favoris',
    });
  }
});

// @route   POST /api/user/favorites/parkings/:id
// @desc    Ajouter un parking aux favoris
// @access  Private
router.post('/favorites/parkings/:id', auth, [
  param('id').isMongoId().withMessage('ID parking invalide'),
], async (req, res) => {
  try {
    const parkingId = req.params.id;

    if (req.user.favorites.parkings.includes(parkingId)) {
      return res.status(400).json({
        success: false,
        message: 'Ce parking est déjà dans vos favoris',
      });
    }

    req.user.favorites.parkings.push(parkingId);
    await req.user.save();

    res.json({
      success: true,
      message: 'Parking ajouté aux favoris',
    });
  } catch (error) {
    console.error('Erreur add favorite parking:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout aux favoris',
    });
  }
});

// @route   DELETE /api/user/favorites/parkings/:id
// @desc    Retirer un parking des favoris
// @access  Private
router.delete('/favorites/parkings/:id', auth, [
  param('id').isMongoId().withMessage('ID parking invalide'),
], async (req, res) => {
  try {
    const parkingId = req.params.id;
    const index = req.user.favorites.parkings.indexOf(parkingId);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Parking non trouvé dans les favoris',
      });
    }

    req.user.favorites.parkings.splice(index, 1);
    await req.user.save();

    res.json({
      success: true,
      message: 'Parking retiré des favoris',
    });
  } catch (error) {
    console.error('Erreur remove favorite parking:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du retrait des favoris',
    });
  }
});

// @route   POST /api/user/favorites/places
// @desc    Ajouter un lieu aux favoris
// @access  Private
router.post('/favorites/places', auth, [
  body('name').trim().notEmpty().withMessage('Nom du lieu requis'),
  body('address').trim().notEmpty().withMessage('Adresse requise'),
  body('coordinates.lat').isFloat().withMessage('Latitude invalide'),
  body('coordinates.lng').isFloat().withMessage('Longitude invalide'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, address, coordinates } = req.body;

    // Max 10 lieux favoris
    if (req.user.favorites.places.length >= 10) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 10 lieux favoris',
      });
    }

    req.user.favorites.places.push({ name, address, coordinates });
    await req.user.save();

    res.status(201).json({
      success: true,
      message: 'Lieu ajouté aux favoris',
      data: req.user.favorites.places,
    });
  } catch (error) {
    console.error('Erreur add favorite place:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout du lieu',
    });
  }
});

// @route   DELETE /api/user/favorites/places/:id
// @desc    Retirer un lieu des favoris
// @access  Private
router.delete('/favorites/places/:id', auth, async (req, res) => {
  try {
    const placeIndex = req.user.favorites.places.findIndex(
      p => p._id.toString() === req.params.id
    );

    if (placeIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Lieu non trouvé',
      });
    }

    req.user.favorites.places.splice(placeIndex, 1);
    await req.user.save();

    res.json({
      success: true,
      message: 'Lieu retiré des favoris',
      data: req.user.favorites.places,
    });
  } catch (error) {
    console.error('Erreur remove favorite place:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du retrait du lieu',
    });
  }
});

// =============== STATISTIQUES & HISTORIQUE ===============

// @route   GET /api/user/stats
// @desc    Obtenir les statistiques utilisateur
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const [totalReservations, activeReservations, completedReservations, totalReviews] = await Promise.all([
      Reservation.countDocuments({ user: req.user._id }),
      Reservation.countDocuments({ user: req.user._id, status: 'active' }),
      Reservation.countDocuments({ user: req.user._id, status: 'completed' }),
      Review.countDocuments({ user: req.user._id }),
    ]);

    // Calculer le total dépensé
    const spending = await Reservation.aggregate([
      { $match: { user: req.user._id, 'payment.status': 'completed' } },
      { $group: { _id: null, total: { $sum: '$pricing.amount' } } },
    ]);

    res.json({
      success: true,
      data: {
        ...req.user.stats.toObject(),
        totalReservations,
        activeReservations,
        completedReservations,
        totalReviews,
        totalSpent: spending[0]?.total || req.user.stats.totalSpent || 0,
        walletBalance: req.user.wallet.balance,
        vehicleCount: req.user.vehicles.length,
        favoriteCount: req.user.favorites.parkings.length,
        memberSince: req.user.createdAt,
        isVerified: req.user.isVerified,
      },
    });
  } catch (error) {
    console.error('Erreur get stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
    });
  }
});

// @route   GET /api/user/history
// @desc    Obtenir l'historique complet des activités
// @access  Private
router.get('/history', auth, async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let reservations = [];
    let transactions = [];
    let reviews = [];

    if (!type || type === 'reservations') {
      reservations = await Reservation.find({ user: req.user._id })
        .populate('parking', 'name address images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
    }

    if (!type || type === 'transactions') {
      transactions = req.user.wallet.transactions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(skip, skip + parseInt(limit));
    }

    if (!type || type === 'reviews') {
      reviews = await Review.find({ user: req.user._id })
        .populate('parking', 'name address')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
    }

    res.json({
      success: true,
      data: {
        reservations,
        transactions,
        reviews,
      },
    });
  } catch (error) {
    console.error('Erreur get history:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique',
    });
  }
});

// =============== PRÉFÉRENCES ===============

// @route   PUT /api/user/preferences
// @desc    Mettre à jour les préférences
// @access  Private
router.put('/preferences', auth, async (req, res) => {
  try {
    const { notifications, language, defaultCity, darkMode } = req.body;

    if (notifications !== undefined) {
      req.user.preferences.notifications = {
        ...req.user.preferences.notifications.toObject(),
        ...notifications,
      };
    }

    if (language) {
      req.user.preferences.language = language;
    }

    if (defaultCity) {
      req.user.preferences.defaultCity = defaultCity;
    }

    if (darkMode !== undefined) {
      req.user.preferences.darkMode = darkMode;
    }

    await req.user.save();

    res.json({
      success: true,
      message: 'Préférences mises à jour',
      data: req.user.preferences,
    });
  } catch (error) {
    console.error('Erreur update preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des préférences',
    });
  }
});

// @route   PUT /api/user/push-token
// @desc    Enregistrer le token push notification
// @access  Private
router.put('/push-token', auth, [
  body('pushToken').trim().notEmpty().withMessage('Push token requis'),
], async (req, res) => {
  try {
    req.user.pushToken = req.body.pushToken;
    await req.user.save();

    res.json({
      success: true,
      message: 'Push token enregistré',
    });
  } catch (error) {
    console.error('Erreur push token:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement du push token',
    });
  }
});

// @route   DELETE /api/user/account
// @desc    Désactiver le compte
// @access  Private
router.delete('/account', auth, [
  body('password').notEmpty().withMessage('Mot de passe requis pour confirmation'),
], async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(req.body.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe incorrect',
      });
    }

    // Vérifier pas de réservation active
    const activeReservations = await Reservation.countDocuments({
      user: req.user._id,
      status: 'active',
    });

    if (activeReservations > 0) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez annuler vos réservations actives avant de désactiver votre compte',
      });
    }

    req.user.isActive = false;
    await req.user.save();

    res.json({
      success: true,
      message: 'Compte désactivé avec succès',
    });
  } catch (error) {
    console.error('Erreur delete account:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la désactivation du compte',
    });
  }
});

module.exports = router;
