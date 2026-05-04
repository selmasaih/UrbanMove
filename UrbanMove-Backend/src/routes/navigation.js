const express = require('express');
const router = express.Router();
const { query, validationResult } = require('express-validator');
const Alert = require('../models/Alert');
const { auth, optionalAuth } = require('../middleware/auth');

// Configuration des feux tricolores intelligents (simulation)
const SMART_TRAFFIC_LIGHTS = {
  rabat: [
    { id: 'tl_rabat_1', location: { lat: 34.0209, lng: -6.8416 }, avgWait: 30 },
    { id: 'tl_rabat_2', location: { lat: 34.0150, lng: -6.8350 }, avgWait: 25 },
    { id: 'tl_rabat_3', location: { lat: 34.0100, lng: -6.8500 }, avgWait: 35 },
  ],
  casablanca: [
    { id: 'tl_casa_1', location: { lat: 33.5731, lng: -7.5898 }, avgWait: 40 },
    { id: 'tl_casa_2', location: { lat: 33.5800, lng: -7.6000 }, avgWait: 35 },
    { id: 'tl_casa_3', location: { lat: 33.5650, lng: -7.5750 }, avgWait: 45 },
  ],
  tanger: [
    { id: 'tl_tanger_1', location: { lat: 35.7595, lng: -5.8340 }, avgWait: 25 },
    { id: 'tl_tanger_2', location: { lat: 35.7650, lng: -5.8200 }, avgWait: 30 },
  ],
};

// @route   POST /api/navigation/route
// @desc    Calculer un itinéraire optimisé
// @access  Public
router.post('/route', [
  query('originLat').isFloat().withMessage('Latitude origine invalide'),
  query('originLng').isFloat().withMessage('Longitude origine invalide'),
  query('destLat').isFloat().withMessage('Latitude destination invalide'),
  query('destLng').isFloat().withMessage('Longitude destination invalide'),
], optionalAuth, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { originLat, originLng, destLat, destLng, mode = 'driving' } = req.query;

    // Calculer la distance à vol d'oiseau
    const distance = calculateDistance(
      parseFloat(originLat),
      parseFloat(originLng),
      parseFloat(destLat),
      parseFloat(destLng)
    );

    // Simuler un itinéraire (en production, utiliser Google Maps ou OpenRouteService)
    const baseTime = Math.round((distance / 1000) * 2); // ~30 km/h en ville
    
    // Déterminer la ville pour les feux intelligents
    const city = detectCity(parseFloat(originLat), parseFloat(originLng));
    const smartLights = SMART_TRAFFIC_LIGHTS[city] || [];

    // Calculer l'optimisation des feux tricolores
    const trafficLightsOnRoute = smartLights.filter(light => {
      const lightDist = calculateDistance(
        parseFloat(originLat),
        parseFloat(originLng),
        light.location.lat,
        light.location.lng
      );
      return lightDist < distance * 0.8;
    });

    const timeSavedBySmartLights = trafficLightsOnRoute.reduce((total, light) => {
      return total + Math.round(light.avgWait * 0.6); // 60% de temps économisé
    }, 0);

    // Obtenir les alertes sur le trajet
    const alertsOnRoute = await Alert.find({
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(originLng), parseFloat(originLat)],
          },
          $maxDistance: distance,
        },
      },
    }).limit(10);

    // Ajuster le temps selon les alertes
    let additionalTime = 0;
    alertsOnRoute.forEach(alert => {
      if (alert.type === 'accident') additionalTime += 10;
      else if (alert.type === 'traffic') additionalTime += 5;
      else if (alert.type === 'construction') additionalTime += 7;
    });

    const route = {
      origin: {
        lat: parseFloat(originLat),
        lng: parseFloat(originLng),
      },
      destination: {
        lat: parseFloat(destLat),
        lng: parseFloat(destLng),
      },
      distance: Math.round(distance),
      duration: {
        standard: baseTime + additionalTime,
        optimized: Math.max(baseTime + additionalTime - Math.round(timeSavedBySmartLights / 60), baseTime * 0.7),
        saved: Math.round(timeSavedBySmartLights / 60),
      },
      smartFeatures: {
        trafficLightsCount: trafficLightsOnRoute.length,
        timeSaved: timeSavedBySmartLights,
        co2Saved: Math.round(timeSavedBySmartLights * 2.3), // grammes de CO2
      },
      alerts: alertsOnRoute.map(a => ({
        id: a._id,
        type: a.type,
        title: a.title,
        severity: a.severity,
        location: a.location,
      })),
      trafficStatus: determineTrafficStatus(alertsOnRoute.length),
      steps: generateRouteSteps(
        parseFloat(originLat),
        parseFloat(originLng),
        parseFloat(destLat),
        parseFloat(destLng),
        distance
      ),
    };

    // Mettre à jour les stats utilisateur si connecté
    if (req.user) {
      req.user.stats.co2Saved += route.smartFeatures.co2Saved;
      req.user.stats.timeSaved += route.duration.saved;
      await req.user.save();
    }

    res.json({
      success: true,
      data: route,
    });
  } catch (error) {
    console.error('Erreur calcul itinéraire:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul de l\'itinéraire',
    });
  }
});

// @route   GET /api/navigation/traffic
// @desc    Obtenir l'état du trafic dans une zone
// @access  Public
router.get('/traffic', [
  query('lat').isFloat().withMessage('Latitude invalide'),
  query('lng').isFloat().withMessage('Longitude invalide'),
  query('radius').optional().isInt({ min: 500, max: 20000 }),
], async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;

    // Obtenir les alertes actives dans la zone
    const alerts = await Alert.find({
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
    });

    // Calculer l'indice de trafic
    const trafficIndex = calculateTrafficIndex(alerts);
    const city = detectCity(parseFloat(lat), parseFloat(lng));

    res.json({
      success: true,
      data: {
        city,
        location: { lat: parseFloat(lat), lng: parseFloat(lng) },
        radius: parseInt(radius),
        trafficIndex,
        status: getTrafficStatusFromIndex(trafficIndex),
        activeAlerts: alerts.length,
        alerts: alerts.map(a => ({
          id: a._id,
          type: a.type,
          title: a.title,
          severity: a.severity,
          description: a.description,
        })),
        smartLights: SMART_TRAFFIC_LIGHTS[city]?.length || 0,
        lastUpdated: new Date(),
      },
    });
  } catch (error) {
    console.error('Erreur trafic:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du trafic',
    });
  }
});

// @route   GET /api/navigation/smart-lights
// @desc    Obtenir les feux tricolores intelligents
// @access  Public
router.get('/smart-lights', [
  query('city').optional().isString(),
], async (req, res) => {
  try {
    const { city } = req.query;

    let lights;
    if (city && SMART_TRAFFIC_LIGHTS[city.toLowerCase()]) {
      lights = SMART_TRAFFIC_LIGHTS[city.toLowerCase()];
    } else {
      lights = Object.values(SMART_TRAFFIC_LIGHTS).flat();
    }

    // Simuler l'état actuel des feux
    const lightsWithStatus = lights.map(light => ({
      ...light,
      status: ['green', 'yellow', 'red'][Math.floor(Math.random() * 3)],
      nextChange: Math.floor(Math.random() * 60) + 10, // secondes
      optimizationActive: Math.random() > 0.2,
    }));

    res.json({
      success: true,
      data: lightsWithStatus,
      total: lightsWithStatus.length,
    });
  } catch (error) {
    console.error('Erreur smart lights:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des feux',
    });
  }
});

// Fonctions utilitaires
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

function detectCity(lat, lng) {
  const cities = {
    rabat: { lat: 34.0209, lng: -6.8416 },
    casablanca: { lat: 33.5731, lng: -7.5898 },
    tanger: { lat: 35.7595, lng: -5.8340 },
  };

  let closestCity = 'rabat';
  let minDistance = Infinity;

  Object.entries(cities).forEach(([city, coords]) => {
    const dist = calculateDistance(lat, lng, coords.lat, coords.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closestCity = city;
    }
  });

  return closestCity;
}

function calculateTrafficIndex(alerts) {
  if (alerts.length === 0) return 1;
  
  let index = 1;
  alerts.forEach(alert => {
    if (alert.severity === 'critical') index += 3;
    else if (alert.severity === 'high') index += 2;
    else if (alert.severity === 'medium') index += 1;
    else index += 0.5;
  });

  return Math.min(Math.round(index), 10);
}

function getTrafficStatusFromIndex(index) {
  if (index <= 2) return 'fluide';
  if (index <= 4) return 'normal';
  if (index <= 6) return 'dense';
  if (index <= 8) return 'congestionné';
  return 'bloqué';
}

function determineTrafficStatus(alertCount) {
  if (alertCount === 0) return 'fluide';
  if (alertCount <= 2) return 'normal';
  if (alertCount <= 5) return 'dense';
  return 'congestionné';
}

function generateRouteSteps(originLat, originLng, destLat, destLng, distance) {
  const steps = [];
  const numSteps = Math.min(Math.max(Math.floor(distance / 500), 3), 10);
  
  const latStep = (destLat - originLat) / numSteps;
  const lngStep = (destLng - originLng) / numSteps;

  const directions = [
    'Continuer tout droit',
    'Tourner à droite',
    'Tourner à gauche',
    'Prendre la sortie',
    'Rester sur la voie de droite',
    'Au rond-point, prendre la 2ème sortie',
  ];

  for (let i = 0; i < numSteps; i++) {
    steps.push({
      index: i + 1,
      instruction: i === 0 
        ? 'Départ' 
        : i === numSteps - 1 
          ? 'Vous êtes arrivé à destination'
          : directions[Math.floor(Math.random() * directions.length)],
      distance: Math.round(distance / numSteps),
      location: {
        lat: originLat + latStep * i,
        lng: originLng + lngStep * i,
      },
      hasSmartLight: Math.random() > 0.6,
    });
  }

  return steps;
}

module.exports = router;
