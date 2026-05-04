const express = require('express');
const router = express.Router();
const Parking = require('../models/Parking');
const Reservation = require('../models/Reservation');
const { auth, optionalAuth } = require('../middleware/auth');

// ============================================
// IoT Smart Parking Sensor System
// Système intelligent de gestion du stationnement
// basé sur les technologies IoT
// ============================================

// @route   GET /api/iot/sensors/:parkingId
// @desc    Obtenir l'état des capteurs IoT d'un parking
// @access  Public
router.get('/sensors/:parkingId', optionalAuth, async (req, res) => {
  try {
    const parking = await Parking.findById(req.params.parkingId);
    if (!parking) {
      return res.status(404).json({ success: false, message: 'Parking non trouvé' });
    }

    // Simuler les données des capteurs IoT en temps réel
    const totalSpots = parking.totalSpots;
    const availableSpots = parking.availableSpots;
    const occupiedSpots = totalSpots - availableSpots;

    // Générer l'état de chaque place avec capteur
    const spots = [];
    for (let i = 1; i <= Math.min(totalSpots, 50); i++) {
      const isOccupied = i <= occupiedSpots;
      spots.push({
        spotId: `${parking.floors?.[0]?.name || 'A'}${String(i).padStart(2, '0')}`,
        floor: Math.ceil(i / Math.ceil(totalSpots / (parking.floors?.length || 1))),
        status: isOccupied ? 'occupied' : 'available',
        sensorType: 'ultrasonic', // capteur ultrasonique
        sensorStatus: 'active',
        lastDetection: isOccupied 
          ? new Date(Date.now() - Math.random() * 3600000).toISOString()
          : null,
        vehicleDetected: isOccupied,
        batteryLevel: Math.round(70 + Math.random() * 30), // 70-100%
      });
    }

    // Données environnementales des capteurs
    const environmentalSensors = {
      temperature: Math.round(18 + Math.random() * 12), // 18-30°C
      humidity: Math.round(40 + Math.random() * 30), // 40-70%
      airQuality: Math.random() > 0.3 ? 'good' : 'moderate',
      co2Level: Math.round(300 + Math.random() * 200), // ppm
      noiseLevel: Math.round(40 + Math.random() * 25), // dB
    };

    res.json({
      success: true,
      data: {
        parkingId: parking._id,
        parkingName: parking.name,
        sensorSystem: {
          provider: parking.sensors?.provider || 'UrbanMove IoT',
          totalSensors: totalSpots,
          activeSensors: totalSpots - Math.floor(Math.random() * 2),
          lastGlobalUpdate: new Date().toISOString(),
          networkStatus: 'online',
          protocol: 'LoRaWAN', // protocole IoT basse consommation
        },
        occupancy: {
          total: totalSpots,
          occupied: occupiedSpots,
          available: availableSpots,
          rate: Math.round((occupiedSpots / totalSpots) * 100),
        },
        spots: spots.slice(0, 20), // Limiter à 20 pour la réponse
        environmental: environmentalSensors,
        analytics: {
          avgOccupancyToday: Math.round(55 + Math.random() * 25),
          peakHour: '09:00-11:00',
          avgDuration: Math.round(90 + Math.random() * 60), // minutes
          turnaroundRate: Math.round(3 + Math.random() * 4), // véhicules/place/jour
        },
      },
    });
  } catch (error) {
    console.error('Erreur IoT sensors:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// @route   GET /api/iot/dashboard
// @desc    Tableau de bord global IoT - impact environnemental et économique
// @access  Public
router.get('/dashboard', optionalAuth, async (req, res) => {
  try {
    const { city } = req.query;
    const filter = { isActive: true };
    if (city) filter['address.city'] = new RegExp(city, 'i');

    const [parkings, totalReservations] = await Promise.all([
      Parking.find(filter).select('totalSpots availableSpots sensors statistics address pricing'),
      Reservation.countDocuments(city ? {} : {}),
    ]);

    const totalSpots = parkings.reduce((sum, p) => sum + p.totalSpots, 0);
    const availableSpots = parkings.reduce((sum, p) => sum + p.availableSpots, 0);
    const occupiedSpots = totalSpots - availableSpots;
    const smartParkings = parkings.filter(p => p.sensors?.hasSensors).length;

    // Calculs d'impact basés sur des études scientifiques
    // Étude MDPI 2023: réduction CO2 32-40% avec gestion intelligente
    // Recherche IA: réduction temps d'attente jusqu'à 72%

    // En moyenne, un conducteur passe 20 min à chercher une place
    // Avec IoT: réduction à 5 min = 15 min économisées
    const avgTimeSavedPerReservation = 15; // minutes
    const totalTimeSaved = totalReservations * avgTimeSavedPerReservation;

    // Un véhicule émet ~120g CO2/km en ville, vitesse ~15km/h en cherchant
    // 15 min = 3.75 km de recherche évitée = 450g CO2 par réservation
    const co2PerReservation = 0.45; // kg
    const totalCo2Saved = Math.round(totalReservations * co2PerReservation);

    // Carburant: ~8L/100km en ville, 3.75km économisés = 0.3L
    const fuelPerReservation = 0.3; // litres
    const totalFuelSaved = Math.round(totalReservations * fuelPerReservation * 10) / 10;

    // Économie financière: fuel à ~14 MAD/L + temps à ~50 MAD/h
    const fuelCostSaved = Math.round(totalFuelSaved * 14);
    const timeCostSaved = Math.round((totalTimeSaved / 60) * 50);

    // Arbres équivalents (1 arbre absorbe ~22kg CO2/an)
    const treesEquivalent = Math.round(totalCo2Saved / 22);

    res.json({
      success: true,
      data: {
        system: {
          totalParkings: parkings.length,
          smartParkings,
          totalSensors: totalSpots,
          activeSensors: Math.round(totalSpots * 0.97),
          cities: [...new Set(parkings.map(p => p.address?.city).filter(Boolean))],
          uptime: '99.7%',
          technology: 'IoT (LoRaWAN + Capteurs ultrasoniques)',
        },
        realtime: {
          totalSpots,
          occupiedSpots,
          availableSpots,
          globalOccupancy: totalSpots > 0 ? Math.round((occupiedSpots / totalSpots) * 100) : 0,
        },
        impact: {
          environmental: {
            co2Saved: totalCo2Saved, // kg
            fuelSaved: totalFuelSaved, // litres
            treesEquivalent,
            airQualityImprovement: '32%', // MDPI 2023
            co2ReductionRate: '36%', // MDPI 2023: 32-40%
          },
          economic: {
            totalReservations,
            timeSavedMinutes: totalTimeSaved,
            timeSavedHours: Math.round(totalTimeSaved / 60),
            fuelCostSaved, // MAD
            timeCostSaved, // MAD
            totalEconomySaved: fuelCostSaved + timeCostSaved, // MAD
            productivityGain: '72%', // Recherche IA
          },
          social: {
            stressReduction: '45%',
            accidentReduction: '13.3%', // Federal Highway Administration
            severeAccidentReduction: '35.8%', // Federal Highway Administration
            userSatisfaction: '92%',
            avgTimeSavedPerTrip: `${avgTimeSavedPerReservation} min`,
          },
        },
        worldCup2030: {
          readyParkings: parkings.length,
          readyCities: [...new Set(parkings.map(p => p.address?.city).filter(Boolean))].length,
          targetCapacity: totalSpots,
          message: 'Système prêt pour accueillir les visiteurs de la Coupe du Monde 2030',
        },
      },
    });
  } catch (error) {
    console.error('Erreur IoT dashboard:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// @route   GET /api/iot/parking/:parkingId/live
// @desc    Données IoT en temps réel d'un parking (occupancy live)
// @access  Public
router.get('/parking/:parkingId/live', optionalAuth, async (req, res) => {
  try {
    const parking = await Parking.findById(req.params.parkingId);
    if (!parking) {
      return res.status(404).json({ success: false, message: 'Parking non trouvé' });
    }

    // Historique d'occupation simulé (dernières 24h)
    const hourlyOccupancy = [];
    const now = new Date();
    for (let h = 0; h < 24; h++) {
      const hour = (now.getHours() - 23 + h + 24) % 24;
      let rate;
      // Simulation réaliste des tendances
      if (hour >= 8 && hour <= 11) rate = 70 + Math.random() * 25; // Matin: forte occupation
      else if (hour >= 12 && hour <= 14) rate = 50 + Math.random() * 30; // Midi: variable
      else if (hour >= 17 && hour <= 19) rate = 75 + Math.random() * 20; // Soir: pic
      else if (hour >= 22 || hour <= 5) rate = 10 + Math.random() * 20; // Nuit: faible
      else rate = 40 + Math.random() * 30; // Reste: modéré
      
      hourlyOccupancy.push({
        hour: `${String(hour).padStart(2, '0')}:00`,
        occupancyRate: Math.round(rate),
        vehicles: Math.round((rate / 100) * parking.totalSpots),
      });
    }

    // Prédiction pour les prochaines heures
    const predictions = [];
    for (let h = 1; h <= 4; h++) {
      const futureHour = (now.getHours() + h) % 24;
      let predicted;
      if (futureHour >= 8 && futureHour <= 11) predicted = 80;
      else if (futureHour >= 17 && futureHour <= 19) predicted = 85;
      else if (futureHour >= 22 || futureHour <= 5) predicted = 15;
      else predicted = 55;
      
      predictions.push({
        hour: `${String(futureHour).padStart(2, '0')}:00`,
        predictedOccupancy: predicted + Math.round(Math.random() * 10 - 5),
        confidence: Math.round(85 + Math.random() * 10),
      });
    }

    res.json({
      success: true,
      data: {
        parkingId: parking._id,
        parkingName: parking.name,
        currentOccupancy: {
          total: parking.totalSpots,
          occupied: parking.totalSpots - parking.availableSpots,
          available: parking.availableSpots,
          rate: Math.round(((parking.totalSpots - parking.availableSpots) / parking.totalSpots) * 100),
        },
        history: hourlyOccupancy,
        predictions,
        lastUpdate: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Erreur IoT live:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ============================================
// NOUVEAUX ENDPOINTS IoT AVANCÉS
// ============================================

// @route   GET /api/iot/smart-lights/analytics
// @desc    Analytiques des feux intelligents - impact détaillé
// @access  Public
router.get('/smart-lights/analytics', optionalAuth, async (req, res) => {
  try {
    const now = new Date();

    // Données par ville
    const cityData = {
      rabat: {
        totalLights: 47,
        smartLights: 38,
        coverage: 81,
        intersections: 23,
        avgWaitReduction: 42, // secondes
        peakOptimization: 67, // % de réduction aux heures de pointe
      },
      casablanca: {
        totalLights: 89,
        smartLights: 62,
        coverage: 70,
        intersections: 41,
        avgWaitReduction: 38,
        peakOptimization: 58,
      },
      tanger: {
        totalLights: 31,
        smartLights: 22,
        coverage: 71,
        intersections: 14,
        avgWaitReduction: 35,
        peakOptimization: 52,
      },
    };

    const totalSmartLights = Object.values(cityData).reduce((s, c) => s + c.smartLights, 0);
    const totalLights = Object.values(cityData).reduce((s, c) => s + c.totalLights, 0);

    // Historique horaire du temps moyen en secondes (dernières 24h)
    const hourlyImpact = [];
    for (let h = 0; h < 24; h++) {
      const hour = (now.getHours() - 23 + h + 24) % 24;
      let withoutSmart, withSmart;
      if (hour >= 7 && hour <= 9) { withoutSmart = 95; withSmart = 42; }
      else if (hour >= 12 && hour <= 14) { withoutSmart = 72; withSmart = 38; }
      else if (hour >= 17 && hour <= 20) { withoutSmart = 110; withSmart = 48; }
      else if (hour >= 22 || hour <= 5) { withoutSmart = 35; withSmart = 28; }
      else { withoutSmart = 55; withSmart = 32; }
      // Ajouter variation aléatoire
      withoutSmart += Math.round(Math.random() * 10 - 5);
      withSmart += Math.round(Math.random() * 6 - 3);
      hourlyImpact.push({
        hour: `${String(hour).padStart(2, '0')}:00`,
        avgWaitWithout: withoutSmart,
        avgWaitWith: Math.max(withSmart, 15),
        saved: withoutSmart - Math.max(withSmart, 15),
        vehiclesOptimized: Math.round(300 + Math.random() * 500),
      });
    }

    // Calculs globaux
    const totalTimeSavedToday = hourlyImpact.reduce((s, h) => s + h.saved * h.vehiclesOptimized, 0);
    const totalVehiclesOptimized = hourlyImpact.reduce((s, h) => s + h.vehiclesOptimized, 0);
    const avgReduction = Math.round(hourlyImpact.reduce((s, h) => s + ((h.avgWaitWithout - h.avgWaitWith) / h.avgWaitWithout) * 100, 0) / 24);
    // CO2: chaque seconde de ralenti = ~0.016g CO2 (diesel), ~0.012g (essence)
    const co2SavedToday = Math.round(totalTimeSavedToday * 0.014); // grammes

    res.json({
      success: true,
      data: {
        overview: {
          totalSmartLights,
          totalLights,
          globalCoverage: Math.round((totalSmartLights / totalLights) * 100),
          totalIntersections: Object.values(cityData).reduce((s, c) => s + c.intersections, 0),
          avgWaitReduction: `${avgReduction}%`,
          aiAlgorithm: 'Adaptive Signal Control (SCATS/SCOOT)',
          communicationProtocol: 'V2I (Vehicle-to-Infrastructure)',
          updateFrequency: '500ms',
        },
        cities: Object.entries(cityData).map(([city, data]) => ({
          city: city.charAt(0).toUpperCase() + city.slice(1),
          ...data,
          smartCoverage: `${data.coverage}%`,
          status: data.coverage > 75 ? 'avancé' : data.coverage > 50 ? 'en cours' : 'initial',
        })),
        todayImpact: {
          totalTimeSaved: Math.round(totalTimeSavedToday / 3600), // heures
          totalTimeSavedMinutes: Math.round(totalTimeSavedToday / 60),
          totalVehiclesOptimized,
          co2SavedGrams: co2SavedToday,
          co2SavedKg: Math.round(co2SavedToday / 1000),
          fuelSavedLiters: Math.round(co2SavedToday / 2350 * 10) / 10, // 2350g CO2/L essence
          costSavedMAD: Math.round(co2SavedToday / 2350 * 14 * 10) / 10,
        },
        hourlyImpact,
        technology: {
          sensors: ['Boucles inductives', 'Caméras vision IA', 'Radar micro-ondes', 'Capteurs infrarouges'],
          communication: ['Fibre optique', '4G/5G', 'LoRaWAN', 'V2I (802.11p)'],
          algorithms: [
            { name: 'SCATS', description: 'Sydney Coordinated Adaptive Traffic System' },
            { name: 'SCOOT', description: 'Split Cycle Offset Optimisation Technique' },
            { name: 'DRL', description: 'Deep Reinforcement Learning pour optimisation temps réel' },
            { name: 'Wave Green', description: 'Onde verte pour corridors prioritaires' },
          ],
          iaCapabilities: [
            'Détection automatique de congestion',
            'Prédiction des flux à 30 min',
            'Priorité véhicules d\'urgence',
            'Adaptation météo (pluie, brouillard)',
            'Coordination multi-intersections',
            'Gestion des événements sportifs (WC 2030)',
          ],
        },
      },
    });
  } catch (error) {
    console.error('Erreur smart lights analytics:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// @route   GET /api/iot/network/status
// @desc    État du réseau IoT - capteurs, passerelles, connectivité
// @access  Public
router.get('/network/status', optionalAuth, async (req, res) => {
  try {
    const parkings = await Parking.find({ isActive: true }).select('name totalSpots sensors address');

    const totalSensors = parkings.reduce((s, p) => s + p.totalSpots, 0);
    const activeSensors = Math.round(totalSensors * (0.95 + Math.random() * 0.04)); // 95-99%

    // Passerelles LoRaWAN par ville
    const gateways = [
      { id: 'GW-RAB-01', city: 'Rabat', location: 'Tour Hassan', status: 'online', signal: 98, devicesConnected: 156, protocol: 'LoRaWAN 1.0.3', frequency: '868 MHz (EU868)' },
      { id: 'GW-RAB-02', city: 'Rabat', location: 'Agdal Centre', status: 'online', signal: 95, devicesConnected: 134, protocol: 'LoRaWAN 1.0.3', frequency: '868 MHz (EU868)' },
      { id: 'GW-RAB-03', city: 'Rabat', location: 'Hay Riad', status: 'online', signal: 92, devicesConnected: 118, protocol: 'LoRaWAN 1.0.3', frequency: '868 MHz (EU868)' },
      { id: 'GW-CAS-01', city: 'Casablanca', location: 'Maarif', status: 'online', signal: 97, devicesConnected: 203, protocol: 'LoRaWAN 1.0.3', frequency: '868 MHz (EU868)' },
      { id: 'GW-CAS-02', city: 'Casablanca', location: 'Ain Diab', status: 'online', signal: 94, devicesConnected: 178, protocol: 'LoRaWAN 1.0.3', frequency: '868 MHz (EU868)' },
      { id: 'GW-TNG-01', city: 'Tanger', location: 'Centre Ville', status: 'online', signal: 96, devicesConnected: 98, protocol: 'LoRaWAN 1.0.3', frequency: '868 MHz (EU868)' },
    ];

    // Architecture du réseau
    const architecture = {
      layers: [
        {
          name: 'Couche Perception',
          description: 'Capteurs terrain',
          components: [
            { type: 'Capteurs ultrasoniques', count: totalSensors, role: 'Détection véhicule par place' },
            { type: 'Capteurs environnementaux', count: parkings.length * 3, role: 'Température, humidité, qualité air' },
            { type: 'Boucles inductives', count: 122, role: 'Comptage véhicules aux intersections' },
            { type: 'Caméras IA', count: 78, role: 'Vision par ordinateur, comptage, ANPR' },
          ],
        },
        {
          name: 'Couche Réseau',
          description: 'Communication & transmission',
          components: [
            { type: 'Passerelles LoRaWAN', count: gateways.length, role: 'Collecte données capteurs (868 MHz)' },
            { type: 'Points d\'accès 4G/5G', count: 12, role: 'Backbone haute bande passante' },
            { type: 'Switches Edge', count: 8, role: 'Traitement local (Edge Computing)' },
          ],
        },
        {
          name: 'Couche Traitement',
          description: 'Cloud & IA',
          components: [
            { type: 'Serveurs Cloud', count: 3, role: 'MongoDB Atlas, Node.js, API REST' },
            { type: 'Moteur IA', count: 1, role: 'TensorFlow — prédiction & optimisation' },
            { type: 'Stream Processing', count: 1, role: 'Apache Kafka — flux temps réel' },
          ],
        },
        {
          name: 'Couche Application',
          description: 'Interface utilisateur',
          components: [
            { type: 'App Mobile', count: 1, role: 'React Native — iOS & Android' },
            { type: 'Dashboard Admin', count: 1, role: 'Interface de gestion centralisée' },
            { type: 'API Publique', count: 1, role: 'REST API pour intégrations tierces' },
          ],
        },
      ],
    };

    // Métriques réseau temps réel
    const networkMetrics = {
      latency: { avg: 12, min: 3, max: 45, unit: 'ms' },
      packetLoss: { rate: 0.02, unit: '%' },
      bandwidth: { used: 2.4, total: 10, unit: 'Gbps' },
      uptime: { current: 99.7, monthly: 99.5, yearly: 99.3, unit: '%' },
      messagesPerSecond: Math.round(800 + Math.random() * 400),
      dataProcessedToday: Math.round(12 + Math.random() * 8) + ' GB',
    };

    res.json({
      success: true,
      data: {
        overview: {
          totalSensors,
          activeSensors,
          failedSensors: totalSensors - activeSensors,
          sensorUptime: `${Math.round((activeSensors / totalSensors) * 10000) / 100}%`,
          totalGateways: gateways.length,
          onlineGateways: gateways.filter(g => g.status === 'online').length,
          totalCities: [...new Set(gateways.map(g => g.city))].length,
        },
        gateways,
        architecture,
        networkMetrics,
        lastHealthCheck: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Erreur network status:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// @route   GET /api/iot/city/:cityName/analytics
// @desc    Analytiques IoT détaillées par ville
// @access  Public
router.get('/city/:cityName/analytics', optionalAuth, async (req, res) => {
  try {
    const cityName = req.params.cityName;
    const filter = { isActive: true, 'address.city': new RegExp(cityName, 'i') };
    
    const parkings = await Parking.find(filter).select('name totalSpots availableSpots sensors address pricing statistics');
    
    if (parkings.length === 0) {
      return res.status(404).json({ success: false, message: `Aucun parking trouvé pour ${cityName}` });
    }

    const totalSpots = parkings.reduce((s, p) => s + p.totalSpots, 0);
    const availableSpots = parkings.reduce((s, p) => s + p.availableSpots, 0);
    const occupiedSpots = totalSpots - availableSpots;
    const occupancyRate = Math.round((occupiedSpots / totalSpots) * 100);

    // Tendances sur 7 jours (simulé)
    const weekTrend = [];
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    for (let d = 0; d < 7; d++) {
      const base = d <= 4 ? 65 : 45; // Semaine vs weekend
      weekTrend.push({
        day: days[d],
        avgOccupancy: base + Math.round(Math.random() * 15),
        peakOccupancy: base + 20 + Math.round(Math.random() * 10),
        totalVehicles: Math.round(totalSpots * (base / 100) * (1.5 + Math.random())),
        revenue: Math.round(totalSpots * (base / 100) * 5 * (2 + Math.random())),
      });
    }

    // KPIs par parking
    const parkingKPIs = parkings.map(p => ({
      id: p._id,
      name: p.name,
      totalSpots: p.totalSpots,
      available: p.availableSpots,
      occupancy: Math.round(((p.totalSpots - p.availableSpots) / p.totalSpots) * 100),
      hasSensors: p.sensors?.hasSensors || false,
      avgTurnover: Math.round(2.5 + Math.random() * 3), // véhicules/place/jour
      avgDuration: Math.round(60 + Math.random() * 120), // minutes
      revenue24h: Math.round(p.totalSpots * 5 * (0.5 + Math.random())), // MAD
      satisfaction: Math.round(85 + Math.random() * 12), // %
    }));

    // Impact IoT de cette ville
    const reservations = await Reservation.countDocuments({});
    const cityReservations = Math.round(reservations * (parkings.length / 15)); // approximation
    const timeSaved = cityReservations * 15; // 15 min / réservation
    const co2Saved = Math.round(cityReservations * 0.45); // kg

    res.json({
      success: true,
      data: {
        city: cityName.charAt(0).toUpperCase() + cityName.slice(1),
        summary: {
          totalParkings: parkings.length,
          totalSpots,
          availableSpots,
          occupiedSpots,
          occupancyRate,
          smartParkings: parkings.filter(p => p.sensors?.hasSensors).length,
        },
        impact: {
          totalReservations: cityReservations,
          timeSavedHours: Math.round(timeSaved / 60),
          co2SavedKg: co2Saved,
          fuelSavedLiters: Math.round(co2Saved / 2.35 * 10) / 10,
          economySavedMAD: Math.round(co2Saved / 2.35 * 14 + (timeSaved / 60) * 50),
        },
        weekTrend,
        parkings: parkingKPIs,
        lastUpdate: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Erreur city analytics:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;
