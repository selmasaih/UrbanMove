/**
 * Rate Limiting Middleware
 * Protection contre les abus et attaques brute-force
 */

// Store simple en mémoire (en production, utiliser Redis)
const requestCounts = new Map();

// Nettoyer les entrées expirées toutes les minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 60 * 1000);

/**
 * Créer un limiteur de requêtes
 * @param {Object} options - Configuration
 * @param {number} options.windowMs - Fenêtre de temps en ms (défaut: 15 min)
 * @param {number} options.max - Nombre max de requêtes par fenêtre (défaut: 100)
 * @param {string} options.message - Message d'erreur personnalisé
 */
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100,
    message = 'Trop de requêtes. Veuillez réessayer plus tard.',
    keyGenerator = (req) => req.ip || req.connection.remoteAddress,
  } = options;

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();

    if (!requestCounts.has(key)) {
      requestCounts.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    const data = requestCounts.get(key);

    // Réinitialiser si la fenêtre est expirée
    if (now > data.resetTime) {
      data.count = 1;
      data.resetTime = now + windowMs;
      return next();
    }

    data.count++;

    // Headers de rate limiting
    res.set('X-RateLimit-Limit', max);
    res.set('X-RateLimit-Remaining', Math.max(0, max - data.count));
    res.set('X-RateLimit-Reset', Math.ceil(data.resetTime / 1000));

    if (data.count > max) {
      return res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil((data.resetTime - now) / 1000),
      });
    }

    next();
  };
};

// Limiteurs préconfigurés
const rateLimiter = {
  // Limiteur général (100 req / 15 min)
  general: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
  }),

  // Limiteur strict pour l'authentification (10 req / 15 min)
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
  }),

  // Limiteur pour la création de contenu (30 req / 15 min)
  create: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: 'Trop de requêtes de création. Veuillez patienter.',
  }),

  // Limiteur pour les recherches (50 req / min)
  search: createRateLimiter({
    windowMs: 60 * 1000,
    max: 50,
  }),
};

module.exports = { createRateLimiter, rateLimiter };
