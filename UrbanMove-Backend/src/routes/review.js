const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const Review = require('../models/Review');
const Reservation = require('../models/Reservation');
const { auth, optionalAuth } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');

// @route   GET /api/reviews
// @desc    Obtenir les avis (tous ou filtrés par parking)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { parking, user, rating, sort = 'recent', page = 1, limit = 10 } = req.query;

    const filter = { isActive: true };
    if (parking) filter.parking = parking;
    if (user) filter.user = user;
    if (rating) filter.rating = parseInt(rating);

    const sortOptions = {
      recent: { createdAt: -1 },
      rating_high: { rating: -1 },
      rating_low: { rating: 1 },
      helpful: { 'helpful.count': -1 },
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate('user', 'firstName lastName avatar')
        .populate('parking', 'name address')
        .sort(sortOptions[sort] || sortOptions.recent)
        .skip(skip)
        .limit(parseInt(limit)),
      Review.countDocuments(filter),
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
    console.error('Erreur listing reviews:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// @route   GET /api/reviews/my
// @desc    Obtenir mes avis
// @access  Private
router.get('/my', auth, async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id, isActive: true })
      .populate('parking', 'name address images')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: reviews });
  } catch (error) {
    console.error('Erreur my reviews:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// @route   GET /api/reviews/:id
// @desc    Obtenir un avis par ID
// @access  Public
router.get('/:id', [
  param('id').isMongoId().withMessage('ID invalide'),
], async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('user', 'firstName lastName avatar')
      .populate('parking', 'name address');

    if (!review) {
      return res.status(404).json({ success: false, message: 'Avis non trouvé' });
    }

    res.json({ success: true, data: review });
  } catch (error) {
    console.error('Erreur get review:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// @route   POST /api/reviews
// @desc    Créer un nouvel avis
// @access  Private
router.post('/', auth, rateLimiter.create, [
  body('parking').isMongoId().withMessage('ID parking invalide'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Note entre 1 et 5'),
  body('title').optional().trim().isLength({ min: 3, max: 100 }),
  body('comment').trim().notEmpty().withMessage('Commentaire requis')
    .isLength({ min: 10, max: 1000 }).withMessage('Commentaire entre 10 et 1000 caractères'),
  body('aspects.cleanliness').optional().isInt({ min: 1, max: 5 }),
  body('aspects.security').optional().isInt({ min: 1, max: 5 }),
  body('aspects.accessibility').optional().isInt({ min: 1, max: 5 }),
  body('aspects.value').optional().isInt({ min: 1, max: 5 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { parking, rating, title, comment, aspects, photos } = req.body;

    // Vérifier que l'utilisateur a une réservation complétée pour ce parking
    const hasReservation = await Reservation.findOne({
      user: req.user._id,
      parking: parking,
      status: 'completed',
    });

    if (!hasReservation) {
      return res.status(400).json({
        success: false,
        message: 'Vous devez avoir complété une réservation pour laisser un avis',
      });
    }

    // Vérifier si l'utilisateur a déjà laissé un avis
    const existingReview = await Review.findOne({
      user: req.user._id,
      parking: parking,
      isActive: true,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà laissé un avis pour ce parking',
      });
    }

    const review = new Review({
      user: req.user._id,
      parking,
      rating,
      title: title || '',
      comment,
      aspects: aspects || {},
      photos: photos || [],
      reservation: hasReservation._id,
    });

    await review.save();

    // Le calcAverageRating est appelé automatiquement via le post save hook
    const populatedReview = await Review.findById(review._id)
      .populate('user', 'firstName lastName avatar');

    res.status(201).json({
      success: true,
      message: 'Avis publié avec succès',
      data: populatedReview,
    });
  } catch (error) {
    console.error('Erreur création review:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà laissé un avis pour ce parking',
      });
    }
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// @route   PUT /api/reviews/:id
// @desc    Modifier un avis
// @access  Private (propriétaire)
router.put('/:id', auth, [
  param('id').isMongoId().withMessage('ID invalide'),
  body('rating').optional().isInt({ min: 1, max: 5 }),
  body('comment').optional().trim().isLength({ min: 10, max: 1000 }),
  body('title').optional().trim().isLength({ max: 100 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const review = await Review.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!review) {
      return res.status(404).json({ success: false, message: 'Avis non trouvé' });
    }

    const allowedFields = ['rating', 'title', 'comment', 'aspects', 'photos'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        review[field] = req.body[field];
      }
    });

    await review.save();

    res.json({
      success: true,
      message: 'Avis mis à jour',
      data: review,
    });
  } catch (error) {
    console.error('Erreur update review:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// @route   DELETE /api/reviews/:id
// @desc    Supprimer un avis
// @access  Private (propriétaire ou admin)
router.delete('/:id', auth, [
  param('id').isMongoId().withMessage('ID invalide'),
], async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Avis non trouvé' });
    }

    // Vérifier propriétaire ou admin
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    review.isActive = false;
    await review.save();

    // Recalculer la moyenne du parking
    await Review.calcAverageRating(review.parking);

    res.json({ success: true, message: 'Avis supprimé' });
  } catch (error) {
    console.error('Erreur delete review:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// @route   PUT /api/reviews/:id/helpful
// @desc    Marquer un avis comme utile
// @access  Private
router.put('/:id/helpful', auth, [
  param('id').isMongoId().withMessage('ID invalide'),
], async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Avis non trouvé' });
    }

    // Vérifier si déjà voté
    if (review.helpful.users.includes(req.user._id)) {
      // Retirer le vote
      review.helpful.users.pull(req.user._id);
      review.helpful.count = Math.max(0, review.helpful.count - 1);
    } else {
      // Ajouter le vote
      review.helpful.users.push(req.user._id);
      review.helpful.count += 1;
    }

    await review.save();

    res.json({
      success: true,
      data: {
        count: review.helpful.count,
        isHelpful: review.helpful.users.includes(req.user._id),
      },
    });
  } catch (error) {
    console.error('Erreur helpful:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// @route   POST /api/reviews/:id/report
// @desc    Signaler un avis inapproprié
// @access  Private
router.post('/:id/report', auth, [
  param('id').isMongoId().withMessage('ID invalide'),
  body('reason').trim().notEmpty().withMessage('Raison requise')
    .isLength({ max: 300 }),
], async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Avis non trouvé' });
    }

    // Vérifier si déjà signalé par cet utilisateur
    const alreadyReported = review.reported.reports.some(
      r => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReported) {
      return res.status(400).json({ success: false, message: 'Vous avez déjà signalé cet avis' });
    }

    review.reported.count += 1;
    review.reported.reports.push({
      user: req.user._id,
      reason: req.body.reason,
    });

    // Auto-masquer si trop de signalements
    if (review.reported.count >= 5) {
      review.isActive = false;
    }

    await review.save();

    res.json({ success: true, message: 'Avis signalé. Merci pour votre vigilance.' });
  } catch (error) {
    console.error('Erreur report review:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// @route   POST /api/reviews/:id/response
// @desc    Répondre à un avis (propriétaire du parking ou admin)
// @access  Private
router.post('/:id/response', auth, [
  param('id').isMongoId().withMessage('ID invalide'),
  body('message').trim().notEmpty().withMessage('Réponse requise')
    .isLength({ max: 500 }),
], async (req, res) => {
  try {
    const review = await Review.findById(req.params.id).populate('parking');

    if (!review) {
      return res.status(404).json({ success: false, message: 'Avis non trouvé' });
    }

    // Seul le propriétaire du parking ou un admin peut répondre
    if (review.parking.owner?.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    review.response = {
      message: req.body.message,
      respondedAt: new Date(),
      respondedBy: req.user._id,
    };

    await review.save();

    res.json({
      success: true,
      message: 'Réponse publiée',
      data: review.response,
    });
  } catch (error) {
    console.error('Erreur response review:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;
