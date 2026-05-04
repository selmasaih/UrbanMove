const express = require('express');
const router = express.Router();
const { query, param, body, validationResult } = require('express-validator');
const Alert = require('../models/Alert');
const { auth, optionalAuth } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');

// @route   GET /api/alerts
// @desc    Obtenir toutes les alertes avec filtres
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      city,
      type,
      severity,
      active = 'true',
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (active === 'true') filter.isActive = true;
    if (city) filter['address.city'] = new RegExp(city, 'i');
    if (type) filter.type = type;
    if (severity) filter.severity = severity;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [alerts, total] = await Promise.all([
      Alert.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Alert.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: alerts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
      },
    });
  } catch (error) {
    console.error('Erreur listing alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des alertes',
    });
  }
});

// @route   GET /api/alerts/nearby
// @desc    Obtenir les alertes à proximité
// @access  Public
router.get('/nearby', rateLimiter.search, [
  query('lat').isFloat().withMessage('Latitude invalide'),
  query('lng').isFloat().withMessage('Longitude invalide'),
  query('radius').optional().isInt({ min: 100, max: 20000 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { lat, lng, radius = 5000, type, severity } = req.query;

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

    if (type) filter.type = type;
    if (severity) filter.severity = severity;

    const alerts = await Alert.find(filter).limit(50);

    const alertsWithDistance = alerts.map(alert => {
      const distance = calculateDistance(
        parseFloat(lat), parseFloat(lng),
        alert.location.coordinates[1], alert.location.coordinates[0]
      );
      return { ...alert.toObject(), distance: Math.round(distance) };
    });

    res.json({ success: true, data: alertsWithDistance });
  } catch (error) {
    console.error('Erreur nearby alerts:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la recherche d\'alertes' });
  }
});

// ===================================
// ROUTES /stats/* et /my AVANT /:id
// ===================================

// @route   GET /api/alerts/stats/summary
// @desc    Obtenir les statistiques des alertes
// @access  Public
router.get('/stats/summary', async (req, res) => {
  try {
    const { city } = req.query;

    const matchStage = { isActive: true };
    if (city) matchStage['address.city'] = new RegExp(city, 'i');

    const [total, byType, bySeverity, recentCount] = await Promise.all([
      Alert.countDocuments(matchStage),
      Alert.aggregate([
        { $match: matchStage },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      Alert.aggregate([
        { $match: matchStage },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ]),
      Alert.countDocuments({
        ...matchStage,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }),
    ]);

    res.json({
      success: true,
      data: {
        total,
        last24h: recentCount,
        byType: byType.reduce((acc, item) => { acc[item._id] = item.count; return acc; }, {}),
        bySeverity: bySeverity.reduce((acc, item) => { acc[item._id] = item.count; return acc; }, {}),
      },
    });
  } catch (error) {
    console.error('Erreur stats alertes:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// @route   GET /api/alerts/my
// @desc    Obtenir les alertes signalées par l'utilisateur
// @access  Private
router.get('/my', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [alerts, total] = await Promise.all([
      Alert.find({ reportedBy: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Alert.countDocuments({ reportedBy: req.user._id }),
    ]);

    res.json({
      success: true,
      data: alerts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
      },
    });
  } catch (error) {
    console.error('Erreur my alerts:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ===================================
// ROUTES IoT — AVANT /:id
// ===================================

// @route   POST /api/alerts/iot/generate
// @desc    Générer des alertes en temps réel basées sur les capteurs IoT
// @access  System
router.post('/iot/generate', async (req, res) => {
  try {
    const Parking = require('../models/Parking');
    const parkings = await Parking.find({});
    const generated = [];
    const now = new Date();
    const hour = now.getHours();

    for (const parking of parkings) {
      const occupancy = parking.capacity > 0
        ? Math.round(((parking.capacity - parking.availableSpots) / parking.capacity) * 100)
        : 0;

      if (occupancy >= 90) {
        const exists = await Alert.findOne({
          'address.city': parking.city, type: 'traffic', source: 'sensor', isActive: true,
          title: new RegExp(parking.name, 'i'),
          createdAt: { $gte: new Date(now - 2 * 60 * 60 * 1000) },
        });
        if (!exists) {
          const alert = new Alert({
            type: 'traffic',
            title: `Congestion zone ${parking.name}`,
            description: `Le parking ${parking.name} est occupé à ${occupancy}%. Forte densité de véhicules dans la zone. Les capteurs IoT détectent un trafic anormalement élevé aux alentours.`,
            location: parking.location,
            address: { street: parking.address, city: parking.city },
            severity: occupancy >= 95 ? 'high' : 'medium',
            source: 'sensor',
            verification: { status: 'verified', userReports: 0 },
            estimatedEnd: new Date(now.getTime() + 3 * 60 * 60 * 1000),
          });
          await alert.save();
          generated.push({ type: 'parking-congestion', parking: parking.name, occupancy });
        }
      }

      if (parking.availableSpots === 0) {
        const exists = await Alert.findOne({
          type: 'closure', source: 'sensor', isActive: true,
          title: new RegExp(parking.name, 'i'),
          createdAt: { $gte: new Date(now - 4 * 60 * 60 * 1000) },
        });
        if (!exists) {
          const alert = new Alert({
            type: 'closure',
            title: `Parking ${parking.name} complet`,
            description: `Tous les capteurs IoT indiquent une occupation à 100%. Aucune place disponible. Veuillez utiliser les parkings alternatifs à proximité.`,
            location: parking.location,
            address: { street: parking.address, city: parking.city },
            severity: 'high',
            source: 'sensor',
            verification: { status: 'verified', userReports: 0 },
            estimatedEnd: new Date(now.getTime() + 2 * 60 * 60 * 1000),
          });
          await alert.save();
          generated.push({ type: 'parking-full', parking: parking.name });
        }
      }
    }

    const smartLightAlerts = getSmartLightAlerts(hour, now);
    for (const sla of smartLightAlerts) {
      const exists = await Alert.findOne({
        type: sla.type, source: 'sensor', isActive: true, title: sla.title,
        createdAt: { $gte: new Date(now - 3 * 60 * 60 * 1000) },
      });
      if (!exists) {
        await new Alert(sla).save();
        generated.push({ type: 'smart-light', title: sla.title });
      }
    }

    const trafficAlerts = getRushHourAlerts(hour, now);
    for (const ta of trafficAlerts) {
      const exists = await Alert.findOne({
        type: ta.type, source: 'sensor', isActive: true, 'address.city': ta.address.city, title: ta.title,
        createdAt: { $gte: new Date(now - 2 * 60 * 60 * 1000) },
      });
      if (!exists) {
        await new Alert(ta).save();
        generated.push({ type: 'rush-hour', title: ta.title });
      }
    }

    const weatherAlert = getWeatherAlert(hour, now);
    if (weatherAlert) {
      const exists = await Alert.findOne({
        type: 'weather', source: 'sensor', isActive: true,
        createdAt: { $gte: new Date(now - 6 * 60 * 60 * 1000) },
      });
      if (!exists) {
        await new Alert(weatherAlert).save();
        generated.push({ type: 'weather', title: weatherAlert.title });
      }
    }

    const expired = await Alert.updateMany(
      { isActive: true, estimatedEnd: { $lt: now } },
      { $set: { isActive: false } }
    );

    res.json({
      success: true,
      message: `${generated.length} nouvelles alertes générées, ${expired.modifiedCount || 0} alertes expirées`,
      data: { generated, expiredCount: expired.modifiedCount || 0, timestamp: now.toISOString() },
    });
  } catch (error) {
    console.error('Erreur génération alertes IoT:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la génération des alertes' });
  }
});

// @route   GET /api/alerts/iot/live-feed
// @desc    Flux d'alertes en temps réel (dernières 2 heures)
// @access  Public
router.get('/iot/live-feed', async (req, res) => {
  try {
    const { city } = req.query;
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const filter = { isActive: true, createdAt: { $gte: twoHoursAgo } };
    if (city) filter['address.city'] = new RegExp(city, 'i');

    const recentAlerts = await Alert.find(filter).sort({ createdAt: -1 }).limit(20);

    const enriched = recentAlerts.map(alert => {
      const a = alert.toObject();
      const ageMins = Math.round((Date.now() - new Date(a.createdAt).getTime()) / 60000);
      return {
        ...a,
        iotMeta: {
          ageMinutes: ageMins,
          freshness: ageMins < 15 ? 'live' : ageMins < 60 ? 'recent' : 'older',
          sensorConfidence: a.source === 'sensor' ? 0.95 : a.source === 'authority' ? 0.90 : 0.70,
          dataSource: a.source === 'sensor' ? 'Capteurs IoT (LoRaWAN)' :
                      a.source === 'authority' ? 'Autorités routières' :
                      a.source === 'system' ? 'Système IA' : 'Signalement citoyen',
        },
      };
    });

    const sensorCount = enriched.filter(a => a.source === 'sensor').length;
    const liveCount = enriched.filter(a => a.iotMeta.freshness === 'live').length;

    res.json({
      success: true,
      data: {
        alerts: enriched,
        feedStats: {
          total: enriched.length,
          fromSensors: sensorCount,
          liveNow: liveCount,
          lastUpdate: new Date().toISOString(),
          networkStatus: 'connected',
          sensorCoverage: '3 villes • 450+ capteurs',
        },
      },
    });
  } catch (error) {
    console.error('Erreur live feed:', error);
    res.status(500).json({ success: false, message: 'Erreur flux temps réel' });
  }
});

// ===================================
// ROUTES /:id APRÈS /stats/* et /my
// ===================================

// @route   GET /api/alerts/:id
// @desc    Obtenir une alerte par ID
// @access  Public
router.get('/:id', [
  param('id').isMongoId().withMessage('ID invalide'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const alert = await Alert.findById(req.params.id)
      .populate('reportedBy', 'firstName lastName');

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alerte non trouvée' });
    }

    res.json({ success: true, data: alert });
  } catch (error) {
    console.error('Erreur get alert:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// @route   POST /api/alerts
// @desc    Créer une nouvelle alerte (signalement utilisateur)
// @access  Private
router.post('/', auth, rateLimiter.create, [
  body('type').isIn(['accident', 'traffic', 'construction', 'event', 'police', 'weather', 'other']).withMessage('Type invalide'),
  body('title').trim().notEmpty().withMessage('Titre requis').isLength({ max: 100 }),
  body('description').trim().notEmpty().withMessage('Description requise').isLength({ max: 500 }),
  body('location.coordinates').isArray({ min: 2, max: 2 }).withMessage('Coordonnées invalides'),
  body('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { type, title, description, location, severity, address } = req.body;

    const alert = new Alert({
      type,
      title,
      description,
      location: {
        type: 'Point',
        coordinates: location.coordinates,
      },
      address: address || {},
      severity: severity || 'medium',
      source: 'user',
      reportedBy: req.user._id,
      verification: {
        status: 'pending',
        userReports: 1,
      },
    });

    await alert.save();

    // Mettre à jour les stats utilisateur
    req.user.stats.alertsReported = (req.user.stats.alertsReported || 0) + 1;
    await req.user.save();

    res.status(201).json({
      success: true,
      message: 'Alerte signalée avec succès',
      data: alert,
    });
  } catch (error) {
    console.error('Erreur création alerte:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la création de l\'alerte' });
  }
});

// @route   PUT /api/alerts/:id/confirm
// @desc    Confirmer une alerte (vérification communautaire)
// @access  Private
router.put('/:id/confirm', auth, [
  param('id').isMongoId().withMessage('ID invalide'),
], async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alerte non trouvée' });
    }

    // Vérifier si l'utilisateur n'est pas le créateur
    if (alert.reportedBy && alert.reportedBy.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Vous ne pouvez pas confirmer votre propre alerte' });
    }

    // Vérifier si l'utilisateur a déjà confirmé
    if (alert.verification.verifiedBy.includes(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Vous avez déjà confirmé cette alerte' });
    }

    alert.verification.userReports += 1;
    alert.verification.verifiedBy.push(req.user._id);

    // Si assez de confirmations, marquer comme vérifiée
    if (alert.verification.userReports >= 3 && alert.verification.status === 'pending') {
      alert.verification.status = 'verified';
      alert.verification.verifiedAt = new Date();
    }

    await alert.save();

    res.json({
      success: true,
      message: 'Alerte confirmée',
      data: {
        userReports: alert.verification.userReports,
        status: alert.verification.status,
      },
    });
  } catch (error) {
    console.error('Erreur confirmation:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// @route   PUT /api/alerts/:id/dismiss
// @desc    Signaler une alerte comme non pertinente
// @access  Private
router.put('/:id/dismiss', auth, [
  param('id').isMongoId().withMessage('ID invalide'),
], async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alerte non trouvée' });
    }

    alert.verification.userReports = Math.max(0, alert.verification.userReports - 1);

    // Si trop de dismissals, désactiver
    if (alert.verification.userReports <= -3) {
      alert.isActive = false;
      alert.verification.status = 'rejected';
    }

    await alert.save();

    res.json({ success: true, message: 'Signalement enregistré' });
  } catch (error) {
    console.error('Erreur dismiss:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// @route   PUT /api/alerts/:id/resolve
// @desc    Marquer une alerte comme résolue
// @access  Private (propriétaire ou admin)
router.put('/:id/resolve', auth, [
  param('id').isMongoId().withMessage('ID invalide'),
], async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alerte non trouvée' });
    }

    // Seul le créateur ou un admin peut résoudre
    if (alert.reportedBy?.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    alert.isActive = false;
    alert.resolvedAt = new Date();
    await alert.save();

    res.json({ success: true, message: 'Alerte marquée comme résolue' });
  } catch (error) {
    console.error('Erreur resolve:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// (Routes IoT déplacées avant /:id — voir section "ROUTES IoT — AVANT /:id")
// Les anciennes routes iot/generate et iot/live-feed ont été supprimées d'ici.
// ===================================
// FIN DES ROUTES — DÉBUT DES HELPERS
// ===================================

/* PLACEHOLDER_START_REMOVE
  try {
    const Parking = require('../models/Parking');
    const parkings = await Parking.find({});
    const generated = [];
    const now = new Date();
    const hour = now.getHours();

    // ── 1. Alertes basées sur l'occupation des parkings ──
    for (const parking of parkings) {
      const occupancy = parking.capacity > 0
        ? Math.round(((parking.capacity - parking.availableSpots) / parking.capacity) * 100)
        : 0;

      // Parking quasi-plein → alerte trafic zone
      if (occupancy >= 90) {
        const exists = await Alert.findOne({
          'address.city': parking.city,
          type: 'traffic',
          source: 'sensor',
          isActive: true,
          title: new RegExp(parking.name, 'i'),
          createdAt: { $gte: new Date(now - 2 * 60 * 60 * 1000) },
        });

        if (!exists) {
          const alert = new Alert({
            type: 'traffic',
            title: `Congestion zone ${parking.name}`,
            description: `Le parking ${parking.name} est occupé à ${occupancy}%. Forte densité de véhicules dans la zone. Les capteurs IoT détectent un trafic anormalement élevé aux alentours.`,
            location: parking.location,
            address: { street: parking.address, city: parking.city },
            severity: occupancy >= 95 ? 'high' : 'medium',
            source: 'sensor',
            verification: { status: 'verified', userReports: 0 },
            estimatedEnd: new Date(now.getTime() + 3 * 60 * 60 * 1000),
          });
          await alert.save();
          generated.push({ type: 'parking-congestion', parking: parking.name, occupancy });
        }
      }

      // Parking complet → fermeture effective
      if (parking.availableSpots === 0) {
        const exists = await Alert.findOne({
          type: 'closure',
          source: 'sensor',
          isActive: true,
          title: new RegExp(parking.name, 'i'),
          createdAt: { $gte: new Date(now - 4 * 60 * 60 * 1000) },
        });

        if (!exists) {
          const alert = new Alert({
            type: 'closure',
            title: `Parking ${parking.name} complet`,
            description: `Tous les capteurs IoT indiquent une occupation à 100%. Aucune place disponible. Veuillez utiliser les parkings alternatifs à proximité.`,
            location: parking.location,
            address: { street: parking.address, city: parking.city },
            severity: 'high',
            source: 'sensor',
            verification: { status: 'verified', userReports: 0 },
            estimatedEnd: new Date(now.getTime() + 2 * 60 * 60 * 1000),
          });
          await alert.save();
          generated.push({ type: 'parking-full', parking: parking.name });
        }
      }
    }

    // ── 2. Alertes feux intelligents (basées sur l'heure et les conditions) ──
    const smartLightAlerts = getSmartLightAlerts(hour, now);
    for (const sla of smartLightAlerts) {
      const exists = await Alert.findOne({
        type: sla.type,
        source: 'sensor',
        isActive: true,
        title: sla.title,
        createdAt: { $gte: new Date(now - 3 * 60 * 60 * 1000) },
      });

      if (!exists) {
        const alert = new Alert(sla);
        await alert.save();
        generated.push({ type: 'smart-light', title: sla.title });
      }
    }

    // ── 3. Alertes conditions de trafic (heures de pointe) ──
    const trafficAlerts = getRushHourAlerts(hour, now);
    for (const ta of trafficAlerts) {
      const exists = await Alert.findOne({
        type: ta.type,
        source: 'sensor',
        isActive: true,
        'address.city': ta.address.city,
        title: ta.title,
        createdAt: { $gte: new Date(now - 2 * 60 * 60 * 1000) },
      });

      if (!exists) {
        const alert = new Alert(ta);
        await alert.save();
        generated.push({ type: 'rush-hour', title: ta.title });
      }
    }

    // ── 4. Alertes météo simulées (basées capteurs environnementaux) ──
    const weatherAlert = getWeatherAlert(hour, now);
    if (weatherAlert) {
      const exists = await Alert.findOne({
        type: 'weather',
        source: 'sensor',
        isActive: true,
        createdAt: { $gte: new Date(now - 6 * 60 * 60 * 1000) },
      });

      if (!exists) {
        const alert = new Alert(weatherAlert);
        await alert.save();
        generated.push({ type: 'weather', title: weatherAlert.title });
      }
    }

    // ── 5. Expirer les anciennes alertes automatiquement ──
    const expired = await Alert.updateMany(
      {
        isActive: true,
        estimatedEnd: { $lt: now },
      },
      { $set: { isActive: false } }
    );

    res.json({
      success: true,
      message: `${generated.length} nouvelles alertes générées, ${expired.modifiedCount || 0} alertes expirées`,
      data: {
        generated,
        expiredCount: expired.modifiedCount || 0,
        timestamp: now.toISOString(),
      },
    });
  } catch (error) {
    console.error('Erreur génération alertes IoT:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la génération des alertes' });
  }
});

// @route   GET /api/alerts/iot/live-feed
// @desc    Flux d'alertes en temps réel (dernières 2 heures, triées par fraîcheur)
// @access  Public
router.get('/iot/live-feed', async (req, res) => {
  try {
    const { city } = req.query;
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const filter = {
      isActive: true,
      createdAt: { $gte: twoHoursAgo },
    };
    if (city) filter['address.city'] = new RegExp(city, 'i');

    const recentAlerts = await Alert.find(filter)
      .sort({ createdAt: -1 })
      .limit(20);

    // Enrichir avec le statut IoT
    const enriched = recentAlerts.map(alert => {
      const a = alert.toObject();
      const ageMins = Math.round((Date.now() - new Date(a.createdAt).getTime()) / 60000);
      return {
        ...a,
        iotMeta: {
          ageMinutes: ageMins,
          freshness: ageMins < 15 ? 'live' : ageMins < 60 ? 'recent' : 'older',
          sensorConfidence: a.source === 'sensor' ? 0.95 : a.source === 'authority' ? 0.90 : 0.70,
          dataSource: a.source === 'sensor' ? 'Capteurs IoT (LoRaWAN)' :
                      a.source === 'authority' ? 'Autorités routières' :
                      a.source === 'system' ? 'Système IA' : 'Signalement citoyen',
        },
      };
    });

    // Stats du flux
    const sensorCount = enriched.filter(a => a.source === 'sensor').length;
    const liveCount = enriched.filter(a => a.iotMeta.freshness === 'live').length;

    res.json({
      success: true,
      data: {
        alerts: enriched,
        feedStats: {
          total: enriched.length,
          fromSensors: sensorCount,
          liveNow: liveCount,
          lastUpdate: new Date().toISOString(),
          networkStatus: 'connected',
          sensorCoverage: '3 villes • 450+ capteurs',
        },
      },
    });
OLD DUPLICATE ROUTES REMOVED — END OF BLOCK COMMENT */

// ===================================
// FONCTIONS DE GÉNÉRATION D'ALERTES
// ===================================

function getSmartLightAlerts(hour, now) {
  const alerts = [];

  // Heures de pointe matin (7h-9h)
  if (hour >= 7 && hour <= 9) {
    alerts.push({
      type: 'traffic',
      title: 'Optimisation feux IA — Pointe matinale Rabat',
      description: `Les algorithmes DRL ont détecté un afflux de véhicules. Les feux intelligents de 38 intersections à Rabat sont passés en mode adaptatif pour fluidifier le trafic. Temps d'attente réduit de 42%.`,
      location: { type: 'Point', coordinates: [-6.8498, 33.9716] },
      address: { street: 'Centres névralgiques', city: 'Rabat' },
      severity: 'low',
      source: 'sensor',
      verification: { status: 'verified', userReports: 0 },
      estimatedEnd: new Date(now.getTime() + 2 * 60 * 60 * 1000),
    });
  }

  // Heures de pointe soir (17h-20h)
  if (hour >= 17 && hour <= 20) {
    alerts.push({
      type: 'traffic',
      title: 'Mode adaptatif activé — Pointe du soir Casablanca',
      description: `SCATS/SCOOT détectent un volume de trafic élevé sur les axes principaux de Casablanca. 62 feux intelligents ajustent dynamiquement les cycles. Économie estimée : 1.8h de temps collectif.`,
      location: { type: 'Point', coordinates: [-7.6114, 33.5731] },
      address: { street: 'Axes principaux', city: 'Casablanca' },
      severity: 'low',
      source: 'sensor',
      verification: { status: 'verified', userReports: 0 },
      estimatedEnd: new Date(now.getTime() + 3 * 60 * 60 * 1000),
    });
  }

  // Détection anomalie feu (simulation aléatoire toutes les ~4h)
  if (hour % 4 === 2) {
    alerts.push({
      type: 'other',
      title: 'Maintenance feu intelligent — Av. Mohammed V',
      description: `Le capteur LIDAR du feu #RB-027 signale un dégradation du signal. L'IA a basculé en mode dégradé sécurisé. Équipe de maintenance alertée automatiquement.`,
      location: { type: 'Point', coordinates: [-6.8401, 34.0132] },
      address: { street: 'Avenue Mohammed V', city: 'Rabat' },
      severity: 'low',
      source: 'sensor',
      verification: { status: 'verified', userReports: 0 },
      estimatedEnd: new Date(now.getTime() + 1 * 60 * 60 * 1000),
    });
  }

  return alerts;
}

function getRushHourAlerts(hour, now) {
  const alerts = [];

  // Matin
  if (hour >= 7 && hour <= 9) {
    alerts.push({
      type: 'traffic',
      title: 'Trafic dense — Pont Hassan II',
      description: `Les capteurs de comptage véhiculaire détectent +${65 + Math.floor(Math.random() * 20)}% de trafic par rapport à la moyenne. Temps de traversée estimé : ${8 + Math.floor(Math.random() * 7)} min (normal : 4 min).`,
      location: { type: 'Point', coordinates: [-6.8234, 34.0298] },
      address: { street: 'Pont Hassan II', city: 'Rabat' },
      severity: 'medium',
      source: 'sensor',
      verification: { status: 'verified', userReports: 0 },
      estimatedEnd: new Date(now.getTime() + 1.5 * 60 * 60 * 1000),
    });
  }

  // Midi
  if (hour >= 12 && hour <= 14) {
    alerts.push({
      type: 'traffic',
      title: 'Affluence pause déjeuner — Centre Casablanca',
      description: `Les capteurs ultrasoniques enregistrent une hausse de ${40 + Math.floor(Math.random() * 25)}% de l'occupation des parkings du centre. Plusieurs parkings proches de la saturation.`,
      location: { type: 'Point', coordinates: [-7.6145, 33.5883] },
      address: { street: 'Centre-Ville', city: 'Casablanca' },
      severity: 'low',
      source: 'sensor',
      verification: { status: 'verified', userReports: 0 },
      estimatedEnd: new Date(now.getTime() + 2 * 60 * 60 * 1000),
    });
  }

  // Soir
  if (hour >= 17 && hour <= 20) {
    alerts.push({
      type: 'traffic',
      title: 'Congestion sortie bureaux — Agdal-Ryad',
      description: `Le réseau LoRaWAN signale un pic de trafic dans le quartier administratif. Les véhicules affluent vers les parkings Agdal et Al Irfane. Temps d'attente aux feux : ~${25 + Math.floor(Math.random() * 15)}s (normal : 15s).`,
      location: { type: 'Point', coordinates: [-6.8677, 33.9914] },
      address: { street: 'Quartier Agdal-Ryad', city: 'Rabat' },
      severity: 'medium',
      source: 'sensor',
      verification: { status: 'verified', userReports: 0 },
      estimatedEnd: new Date(now.getTime() + 2 * 60 * 60 * 1000),
    });

    alerts.push({
      type: 'traffic',
      title: 'Trafic élevé — Boulevard Zerktouni',
      description: `Les boucles inductives du réseau détectent un ralentissement important sur Bd Zerktouni. Vitesse moyenne : ${12 + Math.floor(Math.random() * 8)} km/h (normal : 35 km/h). Les feux IA ajustent les phases.`,
      location: { type: 'Point', coordinates: [-7.6328, 33.5880] },
      address: { street: 'Boulevard Zerktouni', city: 'Casablanca' },
      severity: 'high',
      source: 'sensor',
      verification: { status: 'verified', userReports: 0 },
      estimatedEnd: new Date(now.getTime() + 2.5 * 60 * 60 * 1000),
    });
  }

  // Weekend
  const day = now.getDay();
  if ((day === 5 || day === 6) && hour >= 10 && hour <= 18) {
    alerts.push({
      type: 'event',
      title: 'Affluence weekend — Zone touristique Tanger',
      description: `Capteurs de la corniche de Tanger détectent un afflux touristique important. Les parkings Malabata et Port affichent une occupation de ${75 + Math.floor(Math.random() * 20)}%.`,
      location: { type: 'Point', coordinates: [-5.7834, 35.7595] },
      address: { street: 'Corniche', city: 'Tanger' },
      severity: 'low',
      source: 'sensor',
      verification: { status: 'verified', userReports: 0 },
      estimatedEnd: new Date(now.getTime() + 6 * 60 * 60 * 1000),
    });
  }

  return alerts;
}

function getWeatherAlert(hour, now) {
  // Simuler les alertes météo basées sur les capteurs environnementaux
  // Probabilité variable selon la saison
  const month = now.getMonth(); // 0=Jan
  const isRainySeason = month >= 10 || month <= 2; // Nov-Mars
  const isHotSeason = month >= 5 && month <= 8; // Juin-Sept

  if (isRainySeason && (hour >= 6 && hour <= 10)) {
    return {
      type: 'weather',
      title: 'Chaussées glissantes — Capteurs IoT',
      description: `Les capteurs d'humidité du réseau routier détectent un taux d'humidité de ${78 + Math.floor(Math.random() * 15)}% sur les axes principaux. Risque accru de glissement. Les feux intelligents augmentent les temps de phase pour plus de sécurité.`,
      location: { type: 'Point', coordinates: [-6.8498, 33.9716] },
      address: { street: 'Axes principaux', city: 'Rabat' },
      severity: 'medium',
      source: 'sensor',
      verification: { status: 'verified', userReports: 0 },
      estimatedEnd: new Date(now.getTime() + 4 * 60 * 60 * 1000),
    };
  }

  if (isHotSeason && hour >= 12 && hour <= 16) {
    return {
      type: 'weather',
      title: 'Chaleur extrême — Impact trafic',
      description: `Les capteurs de température enregistrent ${38 + Math.floor(Math.random() * 8)}°C. Risque de surchauffe moteur. Consommation d'énergie des feux intelligents optimisée en mode économie. Pensez à l'hydratation.`,
      location: { type: 'Point', coordinates: [-7.6114, 33.5731] },
      address: { street: 'Agglomération', city: 'Casablanca' },
      severity: 'low',
      source: 'sensor',
      verification: { status: 'verified', userReports: 0 },
      estimatedEnd: new Date(now.getTime() + 4 * 60 * 60 * 1000),
    };
  }

  return null;
}

// Fonction utilitaire
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

module.exports = router;
