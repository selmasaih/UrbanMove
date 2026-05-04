require('dotenv').config();


const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import des routes
const authRoutes = require('./routes/auth');
const parkingRoutes = require('./routes/parking');
const navigationRoutes = require('./routes/navigation');
const alertRoutes = require('./routes/alert');
const userRoutes = require('./routes/user');
const reviewRoutes = require('./routes/review');
const iotRoutes = require('./routes/iot');

// Import des middlewares
const { rateLimiter } = require('./middleware/rateLimiter');

const app = express();

// Middleware de sécurité
app.use(helmet());

// Configuration CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));

// Parser JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting global
app.use('/api/', rateLimiter.general);

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/parkings', parkingRoutes);
app.use('/api/navigation', navigationRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/user', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/iot', iotRoutes);

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'UrbanMove API is running',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    features: [
      'auth (JWT + refresh)',
      'parkings (CRUD + geolocation)',
      'reservations (create + cancel + extend)',
      'reviews (CRUD + helpful + report)',
      'alerts (community verification)',
      'navigation (smart traffic lights)',
      'wallet (topup + transactions)',
      'favorites (parkings + places)',
      'rate-limiting',
      'role-based access',
      'iot (sensors + dashboard + live data)',
    ],
  });
});

// Gestion des erreurs 404
app.use((req, res, next) => {
  res.status(404).json({ 
    success: false, 
    message: `Route non trouvée: ${req.method} ${req.originalUrl}`,
  });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);

  // Erreur de validation Mongoose
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: messages,
    });
  }

  // Erreur de cast Mongoose (ID invalide)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'ID invalide',
    });
  }

  // Erreur de duplication
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `La valeur du champ '${field}' existe déjà`,
    });
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token invalide',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expiré',
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur serveur interne',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Connexion à MongoDB Atlas
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`✅ MongoDB connecté: ${conn.connection.host}`);
    
    // Créer les index géospatiaux
    const Parking = require('./models/Parking');
    const Alert = require('./models/Alert');
    await Parking.ensureIndexes();
    await Alert.ensureIndexes();
    console.log('✅ Index géospatiaux vérifiés');
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

// Démarrage du serveur
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    🚀 UrbanMove Backend API v2.0
    ==============================
    📍 Environnement: ${process.env.NODE_ENV || 'development'}
    🌐 Port: ${PORT}
    📅 Démarré le: ${new Date().toLocaleString('fr-FR')}
    🔗 API: http://localhost:${PORT}/api/health
    `);

    // ── Génération automatique d'alertes IoT ──
    const generateIoTAlerts = async () => {
      try {
        const http = require('http');
        const options = { hostname: 'localhost', port: PORT, path: '/api/alerts/iot/generate', method: 'POST', headers: { 'Content-Type': 'application/json' } };
        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const result = JSON.parse(data);
              if (result.data?.generated?.length > 0) {
                console.log(`🔔 IoT Alertes: ${result.data.generated.length} nouvelles, ${result.data.expiredCount} expirées`);
              }
            } catch (e) { /* silent */ }
          });
        });
        req.on('error', () => { /* silent */ });
        req.end();
      } catch (e) { /* silent */ }
    };

    // Générer au démarrage + toutes les 10 minutes
    setTimeout(generateIoTAlerts, 5000);
    setInterval(generateIoTAlerts, 10 * 60 * 1000);
    console.log('🔔 Auto-génération alertes IoT activée (toutes les 10 min)');
  });

  // Gestion propre de l'arrêt
  const shutdown = (signal) => {
    console.log(`\n${signal} reçu, arrêt gracieux...`);
    server.close(() => {
      mongoose.connection.close();
      console.log('✅ Serveur arrêté proprement');
      process.exit(0);
    });
    // Forcer l'arrêt après 10s
    setTimeout(() => {
      console.error('⚠️  Arrêt forcé');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer();

module.exports = app;
