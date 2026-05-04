const express = require('express');
const router = express.Router();
const { query, param, body, validationResult } = require('express-validator');
const Parking = require('../models/Parking');
const Reservation = require('../models/Reservation');
const Review = require('../models/Review');
const { auth, optionalAuth } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');

// @route   GET /api/parkings
// @desc    Obtenir tous les parkings avec filtres avancés
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      city,
      type,
      minPrice,
      maxPrice,
      available,
      amenities,
      sort = 'rating',
      page = 1,
      limit = 20,
      search,
      isFeatured,
    } = req.query;

    // Construire le filtre
    const filter = { isActive: true };

    if (city) filter['address.city'] = new RegExp(city, 'i');
    if (type) filter.type = type;
    if (isFeatured === 'true') filter.isFeatured = true;

    if (minPrice || maxPrice) {
      filter['pricing.hourly'] = {};
      if (minPrice) filter['pricing.hourly'].$gte = parseFloat(minPrice);
      if (maxPrice) filter['pricing.hourly'].$lte = parseFloat(maxPrice);
    }

    if (available === 'true') {
      filter.availableSpots = { $gt: 0 };
    }

    if (amenities) {
      const amenityList = amenities.split(',');
      filter.amenities = { $all: amenityList };
    }

    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { 'address.street': new RegExp(search, 'i') },
        { 'address.district': new RegExp(search, 'i') },
      ];
    }

    // Tri
    const sortOptions = {
      rating: { rating: -1, reviewCount: -1 },
      price_asc: { 'pricing.hourly': 1 },
      price_desc: { 'pricing.hourly': -1 },
      availability: { availableSpots: -1 },
      newest: { createdAt: -1 },
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [parkings, total] = await Promise.all([
      Parking.find(filter)
        .sort(sortOptions[sort] || sortOptions.rating)
        .skip(skip)
        .limit(parseInt(limit)),
      Parking.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: parkings,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
      },
    });
  } catch (error) {
    console.error('Erreur listing parkings:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des parkings',
    });
  }
});

// @route   GET /api/parkings/nearby
// @desc    Obtenir les parkings à proximité
// @access  Public
router.get('/nearby', rateLimiter.search, [
  query('lat').isFloat().withMessage('Latitude invalide'),
  query('lng').isFloat().withMessage('Longitude invalide'),
  query('radius').optional().isInt({ min: 100, max: 10000 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { lat, lng, radius = 2000, available, type } = req.query;

    const filter = {
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseInt(radius),
        },
      },
    };

    if (available === 'true') filter.availableSpots = { $gt: 0 };
    if (type) filter.type = type;

    const parkings = await Parking.find(filter).limit(20);

    const parkingsWithDistance = parkings.map(parking => {
      const distance = calculateDistance(
        parseFloat(lat), parseFloat(lng),
        parking.location.coordinates[1], parking.location.coordinates[0]
      );
      return {
        ...parking.toObject(),
        distance: Math.round(distance),
      };
    });

    res.json({
      success: true,
      data: parkingsWithDistance,
    });
  } catch (error) {
    console.error('Erreur nearby parkings:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche de parkings',
    });
  }
});

// @route   GET /api/parkings/featured
// @desc    Obtenir les parkings en vedette
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const { city, limit = 5 } = req.query;
    const filter = { isActive: true, isFeatured: true };
    if (city) filter['address.city'] = new RegExp(city, 'i');

    const parkings = await Parking.find(filter)
      .sort({ rating: -1 })
      .limit(parseInt(limit));

    res.json({ success: true, data: parkings });
  } catch (error) {
    console.error('Erreur featured parkings:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// @route   GET /api/parkings/stats
// @desc    Obtenir les statistiques globales des parkings
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const { city } = req.query;
    const filter = { isActive: true };
    if (city) filter['address.city'] = new RegExp(city, 'i');

    const [
      totalParkings,
      spotsAgg,
      avgPricing,
      byType,
      byCity,
    ] = await Promise.all([
      Parking.countDocuments(filter),
      Parking.aggregate([
        { $match: filter },
        { $group: {
          _id: null,
          totalSpots: { $sum: '$totalSpots' },
          availableSpots: { $sum: '$availableSpots' },
        }},
      ]),
      Parking.aggregate([
        { $match: filter },
        { $group: {
          _id: null,
          avgHourly: { $avg: '$pricing.hourly' },
          avgDaily: { $avg: '$pricing.daily' },
        }},
      ]),
      Parking.aggregate([
        { $match: filter },
        { $group: { _id: '$type', count: { $sum: 1 } }},
      ]),
      Parking.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$address.city', count: { $sum: 1 }, totalSpots: { $sum: '$totalSpots' } }},
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totalParkings,
        totalSpots: spotsAgg[0]?.totalSpots || 0,
        availableSpots: spotsAgg[0]?.availableSpots || 0,
        occupancyRate: spotsAgg[0] ? Math.round((1 - spotsAgg[0].availableSpots / spotsAgg[0].totalSpots) * 100) : 0,
        avgPricing: {
          hourly: Math.round(avgPricing[0]?.avgHourly || 0),
          daily: Math.round(avgPricing[0]?.avgDaily || 0),
        },
        byType: byType.reduce((acc, item) => { acc[item._id] = item.count; return acc; }, {}),
        byCity: byCity.reduce((acc, item) => { acc[item._id] = { count: item.count, totalSpots: item.totalSpots }; return acc; }, {}),
      },
    });
  } catch (error) {
    console.error('Erreur stats parkings:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ===================================
// ROUTES /reservations/* AVANT /:id
// ===================================

// @route   GET /api/parkings/reservations/my
// @desc    Obtenir les réservations de l'utilisateur
// @access  Private
router.get('/reservations/my', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { user: req.user._id };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reservations, total] = await Promise.all([
      Reservation.find(filter)
        .populate('parking', 'name address images pricing type')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Reservation.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: reservations,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
      },
    });
  } catch (error) {
    console.error('Erreur get reservations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des réservations',
    });
  }
});

// @route   GET /api/parkings/reservations/active
// @desc    Obtenir la réservation active de l'utilisateur
// @access  Private
router.get('/reservations/active', auth, async (req, res) => {
  try {
    const reservation = await Reservation.findOne({
      user: req.user._id,
      status: 'active',
    }).populate('parking', 'name address images pricing location type');

    res.json({
      success: true,
      data: reservation,
    });
  } catch (error) {
    console.error('Erreur get active reservation:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// @route   PUT /api/parkings/reservations/:id/cancel
// @desc    Annuler une réservation
// @access  Private
router.put('/reservations/:id/cancel', auth, [
  param('id').isMongoId().withMessage('ID réservation invalide'),
], async (req, res) => {
  try {
    const reservation = await Reservation.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Réservation non trouvée' });
    }

    if (reservation.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Déjà annulée' });
    }

    if (reservation.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Impossible d\'annuler une réservation terminée' });
    }

    // Politique d'annulation
    const now = new Date();
    const startTime = new Date(reservation.startTime);
    const hoursUntilStart = (startTime - now) / (1000 * 60 * 60);

    let refundPercentage = 100;
    let refundStatus = 'completed';
    if (hoursUntilStart < 1) {
      refundPercentage = 0;
    } else if (hoursUntilStart < 6) {
      refundPercentage = 50;
    } else if (hoursUntilStart < 24) {
      refundPercentage = 75;
    }

    const refundAmount = Math.round(reservation.pricing.amount * refundPercentage / 100);

    reservation.status = 'cancelled';
    reservation.cancellation = {
      cancelledAt: now,
      reason: req.body.reason || 'Annulation utilisateur',
      refundAmount,
      refundStatus,
    };

    await reservation.save();

    // Remettre la place disponible
    await Parking.findByIdAndUpdate(reservation.parking, {
      $inc: { availableSpots: 1 },
    });

    // Rembourser dans le wallet si applicable
    if (refundAmount > 0) {
      const user = await User.findById(req.user._id);
      if (user) {
        user.wallet.balance += refundAmount;
        user.wallet.transactions.push({
          type: 'refund',
          amount: refundAmount,
          description: `Remboursement réservation ${reservation.confirmationCode}`,
          reference: reservation._id.toString(),
          status: 'completed',
        });
        await user.save();
      }
    }

    res.json({
      success: true,
      message: `Réservation annulée. Remboursement: ${refundAmount} MAD (${refundPercentage}%)`,
      data: reservation,
    });
  } catch (error) {
    console.error('Erreur annulation:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'annulation' });
  }
});

// @route   PUT /api/parkings/reservations/:id/extend
// @desc    Prolonger une réservation
// @access  Private
router.put('/reservations/:id/extend', auth, [
  param('id').isMongoId().withMessage('ID invalide'),
  body('additionalHours').isInt({ min: 1, max: 24 }).withMessage('Entre 1 et 24 heures'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const reservation = await Reservation.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: 'active',
    }).populate('parking');

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Réservation active non trouvée' });
    }

    const { additionalHours } = req.body;
    const additionalCost = additionalHours * reservation.parking.pricing.hourly;
    const newEndTime = new Date(reservation.endTime.getTime() + additionalHours * 60 * 60 * 1000);

    reservation.endTime = newEndTime;
    reservation.duration += additionalHours * 60;
    reservation.pricing.amount += additionalCost;
    reservation.pricing.breakdown.base += additionalCost;
    reservation.extensions.push({
      additionalTime: additionalHours * 60,
      additionalCost,
      extendedAt: new Date(),
    });

    await reservation.save();

    res.json({
      success: true,
      message: `Réservation prolongée de ${additionalHours}h. Coût supplémentaire: ${additionalCost} MAD`,
      data: reservation,
    });
  } catch (error) {
    console.error('Erreur extension:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la prolongation' });
  }
});

// @route   PUT /api/parkings/reservations/:id/rate
// @desc    Laisser une évaluation rapide sur une réservation
// @access  Private
router.put('/reservations/:id/rate', auth, [
  param('id').isMongoId(),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Note entre 1 et 5'),
  body('comment').optional().trim().isLength({ max: 500 }),
], async (req, res) => {
  try {
    const reservation = await Reservation.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: 'completed',
    });

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Réservation complétée non trouvée' });
    }

    reservation.rating = {
      score: req.body.rating,
      comment: req.body.comment,
      ratedAt: new Date(),
    };
    await reservation.save();

    res.json({
      success: true,
      message: 'Évaluation enregistrée',
      data: reservation.rating,
    });
  } catch (error) {
    console.error('Erreur rate reservation:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ===================================
// ROUTES /:id APRÈS /reservations/*
// ===================================

// @route   GET /api/parkings/:id
// @desc    Obtenir un parking par son ID avec reviews
// @access  Public
router.get('/:id', optionalAuth, [
  param('id').isMongoId().withMessage('ID invalide'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const parking = await Parking.findById(req.params.id);

    if (!parking) {
      return res.status(404).json({ success: false, message: 'Parking non trouvé' });
    }

    // Récupérer les derniers avis
    const reviews = await Review.find({ parking: parking._id, isActive: true })
      .populate('user', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(5);

    // Vérifier si l'utilisateur a mis en favori
    let isFavorite = false;
    if (req.user) {
      isFavorite = req.user.favorites.parkings.includes(parking._id.toString());
    }

    // Incrémenter les vues
    parking.statistics.views = (parking.statistics.views || 0) + 1;
    await parking.save();

    res.json({
      success: true,
      data: {
        ...parking.toObject(),
        recentReviews: reviews,
        isFavorite,
      },
    });
  } catch (error) {
    console.error('Erreur get parking:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du parking',
    });
  }
});

// @route   POST /api/parkings/:id/reserve
// @desc    Réserver une place de parking
// @access  Private
router.post('/:id/reserve', auth, rateLimiter.create, [
  param('id').isMongoId().withMessage('ID parking invalide'),
  body('startTime').isISO8601().withMessage('Date de début invalide'),
  body('endTime').isISO8601().withMessage('Date de fin invalide'),
  body('vehicle').optional().isObject(),
  body('vehicle.brand').optional().trim().notEmpty(),
  body('vehicle.model').optional().trim().notEmpty(),
  body('vehicle.licensePlate').optional().trim().notEmpty(),
  body('spotType').optional().isIn(['standard', 'handicapped', 'electric', 'motorcycle', 'vip']),
  body('paymentMethod').optional().isIn(['card', 'wallet', 'cash']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const parking = await Parking.findById(req.params.id);

    if (!parking) {
      return res.status(404).json({ success: false, message: 'Parking non trouvé' });
    }

    if (parking.availableSpots <= 0) {
      return res.status(400).json({ success: false, message: 'Aucune place disponible' });
    }

    const { startTime, endTime, vehicle, vehicleId, spotType, paymentMethod, floor, spotNumber } = req.body;

    const start = new Date(startTime);
    const end = new Date(endTime);

    // Validations
    if (start >= end) {
      return res.status(400).json({ success: false, message: 'La date de fin doit être après la date de début' });
    }

    if (start < new Date()) {
      return res.status(400).json({ success: false, message: 'La date de début doit être dans le futur' });
    }

    const durationMinutes = Math.ceil((end - start) / (1000 * 60));
    const durationHours = Math.ceil(durationMinutes / 60);

    // Calculer le prix
    let baseAmount;
    if (durationHours <= 1) {
      baseAmount = parking.pricing.hourly;
    } else if (durationHours <= 24) {
      baseAmount = Math.min(
        durationHours * parking.pricing.hourly,
        parking.pricing.daily || durationHours * parking.pricing.hourly
      );
    } else {
      const days = Math.ceil(durationHours / 24);
      const dailyRate = parking.pricing.daily || parking.pricing.hourly * 24;
      baseAmount = Math.min(
        days * dailyRate,
        parking.pricing.monthly || days * dailyRate
      );
    }

    // Surcharge VIP
    if (spotType === 'vip') baseAmount *= 1.5;
    if (spotType === 'electric') baseAmount *= 1.2;

    const serviceFee = Math.round(baseAmount * 0.05);
    const taxes = Math.round(baseAmount * 0.1);
    const totalAmount = baseAmount + serviceFee + taxes;

    // Récupérer le véhicule
    let vehicleData = vehicle;
    if (vehicleId) {
      const userVehicle = req.user.vehicles.id(vehicleId);
      if (userVehicle) {
        vehicleData = {
          brand: userVehicle.brand,
          model: userVehicle.model,
          licensePlate: userVehicle.licensePlate,
          type: userVehicle.type,
        };
      }
    }
    if (!vehicleData && req.user.vehicles.length > 0) {
      const defaultVehicle = req.user.vehicles.find(v => v.isDefault) || req.user.vehicles[0];
      vehicleData = {
        brand: defaultVehicle.brand,
        model: defaultVehicle.model,
        licensePlate: defaultVehicle.licensePlate,
        type: defaultVehicle.type,
      };
    }

    // Paiement par wallet
    if (paymentMethod === 'wallet') {
      if (req.user.wallet.balance < totalAmount) {
        return res.status(400).json({
          success: false,
          message: `Solde insuffisant. Il manque ${(totalAmount - req.user.wallet.balance).toFixed(2)} MAD`,
        });
      }
    }

    // Vérifier chevauchement de réservation
    const overlap = await Reservation.checkOverlap(parking._id, start, end);
    // On autorise quand même si le parking a des places dispo

    // Créer la réservation
    const reservation = new Reservation({
      user: req.user._id,
      parking: parking._id,
      startTime: start,
      endTime: end,
      duration: durationMinutes,
      floor: floor || parking.floors[0]?.name || 'Niveau 0',
      spotNumber: spotNumber || `${spotType === 'vip' ? 'V' : 'A'}${Math.floor(Math.random() * 100) + 1}`,
      spotType: spotType || 'standard',
      vehicle: vehicleData,
      pricing: {
        hourlyRate: parking.pricing.hourly,
        amount: totalAmount,
        currency: 'MAD',
        breakdown: {
          base: baseAmount,
          serviceFee,
          taxes,
        },
      },
      payment: {
        method: paymentMethod || 'card',
        status: paymentMethod === 'wallet' ? 'completed' : 'pending',
        paidAt: paymentMethod === 'wallet' ? new Date() : undefined,
      },
    });

    await reservation.save();

    // Mettre à jour le parking
    parking.availableSpots -= 1;
    parking.statistics.totalReservations = (parking.statistics.totalReservations || 0) + 1;
    await parking.save();

    // Déduire du wallet si paiement par wallet
    if (paymentMethod === 'wallet') {
      req.user.wallet.balance -= totalAmount;
      req.user.wallet.transactions.push({
        type: 'payment',
        amount: -totalAmount,
        description: `Réservation ${reservation.confirmationCode} - ${parking.name}`,
        reference: reservation._id.toString(),
        status: 'completed',
      });
    }

    // Mettre à jour les stats utilisateur
    req.user.stats.totalReservations = (req.user.stats.totalReservations || 0) + 1;
    req.user.stats.totalSpent = (req.user.stats.totalSpent || 0) + totalAmount;
    await req.user.save();

    res.status(201).json({
      success: true,
      message: 'Réservation créée avec succès',
      data: reservation,
    });
  } catch (error) {
    console.error('Erreur création réservation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la réservation',
    });
  }
});

// @route   GET /api/parkings/:id/reviews
// @desc    Obtenir les avis d'un parking
// @access  Public
router.get('/:id/reviews', [
  param('id').isMongoId().withMessage('ID invalide'),
], async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'recent' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const sortOptions = {
      recent: { createdAt: -1 },
      rating_high: { rating: -1 },
      rating_low: { rating: 1 },
      helpful: { 'helpful.count': -1 },
    };

    const [reviews, total] = await Promise.all([
      Review.find({ parking: req.params.id, isActive: true })
        .populate('user', 'firstName lastName avatar')
        .sort(sortOptions[sort] || sortOptions.recent)
        .skip(skip)
        .limit(parseInt(limit)),
      Review.countDocuments({ parking: req.params.id, isActive: true }),
    ]);

    res.json({
      success: true,
      data: reviews,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
      },
    });
  } catch (error) {
    console.error('Erreur get reviews:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Fonction utilitaire pour calculer la distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Import User pour les opérations wallet dans cancel
const User = require('../models/User');

module.exports = router;
